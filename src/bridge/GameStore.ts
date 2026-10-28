import { goTo } from '../core/city';
import { currentUnit } from '../core/combat/engine';
import { runCommand, type Command } from '../core/commands';
import { GameError, type Content, type Ctx } from '../core/content';
import { chooseOption, continueNode, startTalk, type TalkResult } from '../core/dialogue';
import { createRng } from '../core/rng';
import { createInitialState, syncWithContent } from '../core/state';
import type { GameEvent, GameState, ItemInstance } from '../core/types';
import { combatAiStep } from '../core/world/expedition';
import type { CombatFx } from '../core/combat/types';
import { makeSaveFile, type SaveRepository } from '../persistence/saveFile';

export type PanelId =
  | 'forge' | 'shop' | 'market' | 'inventory' | 'book' | 'settings' | 'debug'
  | 'party' | 'mercenaries' | 'repair' | 'expedition' | 'bag' | 'alchemy' | 'library'
  | 'quests' | 'contacts' | 'auction' | 'servants';

/** Puesto de trabajo de la herrería: yunque (y flechería), mesa de joyería o mesa de runas. */
export type ForgeStation = 'yunque' | 'joyeria' | 'runas';

export interface DialogueView {
  npcId: string;
  dialogueId: string | null;
  nodeId: string | null;
  busyLine?: string;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'bad';
}

export interface UiState {
  screen: 'loading' | 'title' | 'game';
  view: 'map' | 'location' | 'world';
  panel: PanelId | null;
  dialogue: DialogueView | null;
  itemCard: { item: ItemInstance; newSynergies: string[] } | null;
  toasts: Toast[];
  debug: boolean;
  hasSave: boolean;
  /** Diseño guardado que se carga al abrir la forja. */
  forgeDraft: { blueprintId: string; materials: Record<string, string> } | null;
  /** Región elegida en el mapa del mundo (panel de expedición). */
  regionId: string | null;
  /** Modo de la UI de combate: mover, elegir objetivo de una acción, o nada. */
  combat: { mode: 'move' | 'skill' | 'potion' | null; skillId?: string; potionUid?: string; target?: { x: number; y: number } };
  /** Puesto de la herrería que abrió el panel de forja. */
  forgeStation: ForgeStation;
  /** NPC elegido en el panel de contactos (para regalar). */
  contactNpc: string | null;
  /** Hay animaciones o turnos enemigos en curso: la UI de combate espera. */
  busy: boolean;
}

export interface Snapshot {
  state: GameState | null;
  ui: UiState;
}

export type { Command };

/** Cuánto tardan en animarse los efectos de una acción de combate. */
function fxDuration(fx: CombatFx[]): number {
  let ms = 150;
  for (const f of fx) {
    if (f.kind === 'move') ms += f.path.length * 170;
    else if (f.kind === 'hit' || f.kind === 'miss') ms += 450;
    else if (f.kind === 'spawn') ms += 400;
    else ms += 220;
  }
  return Math.min(ms, 2600);
}

const SAVE_SLOT = 'auto';
const SAVE_DELAY_MS = 400;

/**
 * Única fuente de verdad del estado. React y Phaser leen el snapshot y mandan comandos.
 * Cada comando corre sobre una copia: si falla, el estado queda intacto.
 */
export class GameStore {
  private snapshot: Snapshot;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(e: GameEvent) => void>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private toastId = 1;

  constructor(readonly content: Content, private repo: SaveRepository, debug = false) {
    this.snapshot = {
      state: null,
      ui: { screen: 'loading', view: 'location', panel: null, dialogue: null, itemCard: null, toasts: [], debug, hasSave: false, forgeDraft: null,
        regionId: null, combat: { mode: null }, busy: false, forgeStation: 'yunque', contactNpc: null,
      },
    };
  }

  // ── Suscripción (useSyncExternalStore) ──
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  onEvent(fn: (e: GameEvent) => void) {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  get state(): GameState {
    if (!this.snapshot.state) throw new Error('No hay partida cargada.');
    return this.snapshot.state;
  }

  private publish(next: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((fn) => fn());
  }

  setUi(patch: Partial<UiState>) {
    this.publish({ ui: { ...this.snapshot.ui, ...patch } });
  }

  // ── Comandos ──
  run<A extends unknown[]>(cmd: Command<A>, ...args: A): boolean {
    const draft = structuredClone(this.state);
    const rng = createRng(draft.rngState);
    let events: GameEvent[];
    try {
      events = runCommand(draft, { c: this.content, rng } as Ctx, cmd, ...args);
    } catch (err) {
      if (err instanceof GameError) {
        this.toast(err.message, 'bad');
        return false;
      }
      throw err;
    }
    draft.rngState = rng.state();
    this.publish({ state: draft });
    this.handleEvents(events);
    this.scheduleSave();
    return true;
  }

  private handleEvents(events: GameEvent[]) {
    for (const e of events) {
      if (e.type === 'toast') this.toast(e.text, e.tone ?? 'info');
      if (e.type === 'itemCreated') {
        if (this.state.settings.skipItemCard) {
          this.toast(`Forjaste: ${e.item.name} (${e.item.rarity}).`, 'good');
          if (e.newSynergies.length) this.toast('¡Nueva sinergia anotada en el libro!', 'good');
        } else {
          this.setUi({ itemCard: { item: e.item, newSynergies: e.newSynergies } });
        }
      }
      if (e.type === 'expeditionStarted' || e.type === 'expeditionEnded') this.setUi({ view: 'location', panel: null, dialogue: null });
      if (e.type === 'combatStarted') {
        this.setUi({ combat: { mode: null }, panel: null });
        this.driveCombat(900);
      }
      if (e.type === 'combatFx') {
        this.setUi({ combat: { mode: null } });
        this.driveCombat(fxDuration(e.fx));
      }
      this.eventListeners.forEach((fn) => fn(e));
    }
  }

  private combatTimer: ReturnType<typeof setTimeout> | null = null;

  /** Espera a que terminen las animaciones y, si le toca a un enemigo, juega su turno. */
  private driveCombat(delay: number) {
    if (this.combatTimer) clearTimeout(this.combatTimer);
    this.setUi({ busy: true });
    this.combatTimer = setTimeout(() => {
      this.combatTimer = null;
      const cs = this.snapshot.state?.expedition?.combat;
      const u = cs && !cs.outcome ? currentUnit(cs) : undefined;
      if (u && (u.side === 'enemy' || cs?.autoUnit === u.id)) {
        if (!this.run(combatAiStep)) this.setUi({ busy: false });
      } else {
        this.setUi({ busy: false });
      }
    }, delay);
  }

  showWorld() {
    this.setUi({ view: 'world', panel: null, dialogue: null, regionId: null });
  }

  toast(text: string, tone: Toast['tone'] = 'info') {
    const toast = { id: this.toastId++, text, tone };
    this.setUi({ toasts: [...this.snapshot.ui.toasts, toast].slice(-4) });
    setTimeout(() => this.setUi({ toasts: this.snapshot.ui.toasts.filter((t) => t.id !== toast.id) }), 3200);
  }

  // ── Acciones de alto nivel que usan la UI y las escenas ──
  goTo(locationId: string) {
    if (this.run(goTo, locationId)) this.setUi({ view: 'location', panel: null, dialogue: null });
  }

  showMap() {
    this.setUi({ view: 'map', panel: null, dialogue: null });
  }

  openPanel(panel: PanelId) {
    this.setUi({ panel, dialogue: null });
  }

  closePanel() {
    this.setUi({ panel: null });
  }

  /** Contactos y regalos; si se pasa un NPC, abre su ficha. */
  openContacts(npcId: string | null = null) {
    this.setUi({ panel: 'contacts', contactNpc: npcId, dialogue: null });
  }

  openForge(station: ForgeStation) {
    this.setUi({ panel: 'forge', forgeStation: station, dialogue: null });
  }

  useDesign(blueprintId: string, materials: Record<string, string>) {
    if (this.state.location !== 'herreria') return this.toast('Los diseños se usan en tu herrería.', 'bad');
    const station = this.content.blueprints[blueprintId]?.station === 'joyeria' ? 'joyeria' : 'yunque';
    this.setUi({ panel: 'forge', forgeStation: station, forgeDraft: { blueprintId, materials: { ...materials } } });
  }

  talkTo(npcId: string) {
    const out: { result?: TalkResult } = {};
    if (this.run(startTalk, npcId, out) && out.result) {
      this.setUi({ panel: null, dialogue: { npcId, ...out.result } });
    }
  }

  chooseDialogueOption(index: number) {
    const d = this.snapshot.ui.dialogue;
    if (!d?.dialogueId || !d.nodeId) return;
    const out: { next?: string | null } = {};
    if (this.run(chooseOption, d.dialogueId, d.nodeId, index, out)) this.advanceDialogue(out.next ?? null);
  }

  continueDialogue() {
    const d = this.snapshot.ui.dialogue;
    if (!d?.dialogueId || !d.nodeId) return this.setUi({ dialogue: null });
    const out: { next?: string | null } = {};
    if (this.run(continueNode, d.dialogueId, d.nodeId, out)) this.advanceDialogue(out.next ?? null);
  }

  private advanceDialogue(next: string | null) {
    const d = this.snapshot.ui.dialogue!;
    this.setUi({ dialogue: next ? { ...d, nodeId: next } : null });
  }

  closeDialogue() {
    this.setUi({ dialogue: null });
  }

  updateSettings(patch: Partial<GameState['settings']>) {
    this.run((s) => { Object.assign(s.settings, patch); return []; });
  }

  // ── Partida y guardado ──
  async init() {
    let hasSave = false;
    try {
      hasSave = !!(await this.repo.load(SAVE_SLOT));
    } catch (err) {
      console.warn('No se pudo leer el guardado', err);
    }
    this.setUi({ screen: 'title', hasSave });
  }

  async continueGame() {
    const file = await this.repo.load(SAVE_SLOT);
    if (!file) return this.newGame();
    this.startWith(file.state);
  }

  newGame() {
    this.startWith(createInitialState(this.content));
    this.saveNow();
  }

  private startWith(state: GameState) {
    syncWithContent(state, this.content);
    this.publish({ state });
    this.setUi({ screen: 'game', view: 'location', panel: null, dialogue: null, itemCard: null, combat: { mode: null }, busy: false });
    // Comando vacío: prepara el mercado del día si hace falta.
    this.run(() => []);
    this.eventListeners.forEach((fn) => fn({ type: 'gameLoaded' }));
    if (state.expedition?.combat && !state.expedition.combat.outcome) this.driveCombat(600);
  }

  async deleteSaveAndRestart() {
    await this.repo.remove(SAVE_SLOT);
    this.newGame();
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), SAVE_DELAY_MS);
  }

  saveNow() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const state = this.snapshot.state;
    if (!state) return;
    this.repo.save(makeSaveFile(state, SAVE_SLOT)).catch((err) => {
      console.error('Error al guardar', err);
      this.toast('No se pudo guardar la partida.', 'bad');
    });
  }
}
