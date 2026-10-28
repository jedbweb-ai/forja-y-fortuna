import { AlchemyPanel } from './panels/AlchemyPanel';
import { AuctionPanel } from './panels/AuctionPanel';
import { ContactsPanel } from './panels/ContactsPanel';
import { QuestsPanel } from './panels/QuestsPanel';
import { ServantsPanel } from './panels/ServantsPanel';
import { TalentsPanel } from './panels/TalentsPanel';
import { TravelPanel } from './panels/TravelPanel';
import { WorkshopPanel } from './panels/WorkshopPanel';
import { BookPanel } from './panels/BookPanel';
import { DebugPanel } from './panels/DebugPanel';
import { ExpeditionPanel } from './panels/ExpeditionPanel';
import { ForgePanel } from './panels/forge/ForgePanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { LibraryPanel } from './panels/LibraryPanel';
import { MarketPanel } from './panels/MarketPanel';
import { MercenaryPanel } from './panels/MercenaryPanel';
import { PartyPanel } from './panels/PartyPanel';
import { RepairPanel } from './panels/RepairPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ShopPanel } from './panels/ShopPanel';
import { CombatHud } from './components/CombatHud';
import { DialogueBox } from './components/DialogueBox';
import { Hud } from './components/Hud';
import { ItemCard } from './components/ItemCard';
import { LocationBar } from './components/LocationBar';
import { BagPanel, RegionHud } from './components/RegionHud';
import { DungeonHud, DungeonPanel, LandingBox, RiddleBox } from './components/DungeonUi';
import { TitleScreen } from './components/TitleScreen';
import { Toasts } from './components/Toasts';
import { store, useSnapshot } from './hooks';

export function App() {
  const { ui, state } = useSnapshot();
  const exp = state?.expedition;
  return (
    <>
      <div className="rotate-overlay">
        <div className="rotate-icon">📱↻</div>
        <p>Girá el dispositivo para jugar en horizontal.</p>
      </div>
      {ui.screen === 'loading' && <div className="splash">Avivando la fragua…</div>}
      {ui.screen === 'title' && <TitleScreen hasSave={ui.hasSave} />}
      {ui.screen === 'game' && state && (
        <>
          {!exp?.combat && <Hud />}
          {!exp && !ui.panel && !ui.dialogue && <LocationBar />}
          {exp && !exp.combat && !ui.panel && !exp.dungeon && <RegionHud />}
          {exp?.dungeon && !exp.combat && !ui.panel && !exp.dungeon.riddle && !exp.dungeon.landing && <DungeonHud />}
          {exp?.dungeon?.landing && !exp.combat && !exp.report && !ui.panel && <LandingBox />}
          {exp?.dungeon?.riddle && !exp.combat && !ui.panel && <RiddleBox />}
          {exp?.combat && <CombatHud />}
          {ui.panel === 'forge' && <ForgePanel />}
          {ui.panel === 'shop' && <ShopPanel />}
          {ui.panel === 'market' && <MarketPanel />}
          {ui.panel === 'inventory' && <InventoryPanel />}
          {ui.panel === 'book' && <BookPanel />}
          {ui.panel === 'settings' && <SettingsPanel />}
          {ui.panel === 'party' && <PartyPanel />}
          {ui.panel === 'mercenaries' && <MercenaryPanel />}
          {ui.panel === 'repair' && <RepairPanel />}
          {ui.panel === 'expedition' && <ExpeditionPanel />}
          {ui.panel === 'bag' && <BagPanel />}
          {ui.panel === 'alchemy' && <AlchemyPanel />}
          {ui.panel === 'library' && <LibraryPanel />}
          {ui.panel === 'quests' && <QuestsPanel />}
          {ui.panel === 'contacts' && <ContactsPanel />}
          {ui.panel === 'auction' && <AuctionPanel />}
          {ui.panel === 'servants' && <ServantsPanel />}
          {ui.panel === 'dungeon' && <DungeonPanel />}
          {ui.panel === 'talents' && <TalentsPanel />}
          {ui.panel === 'workshop' && <WorkshopPanel />}
          {ui.panel === 'travel' && <TravelPanel />}
          {ui.panel === 'debug' && ui.debug && <DebugPanel />}
          {ui.dialogue && <DialogueBox />}
          {ui.itemCard && (
            <ItemCard item={ui.itemCard.item} newSynergies={ui.itemCard.newSynergies} onClose={() => store.setUi({ itemCard: null })} />
          )}
        </>
      )}
      <Toasts toasts={ui.toasts} />
    </>
  );
}
