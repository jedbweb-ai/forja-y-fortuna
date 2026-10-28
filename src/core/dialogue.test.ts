import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { goTo } from './city';
import { checkCondition, chooseOption, pickDialogue, startTalk, type TalkResult } from './dialogue';
import { setup } from './testUtils';

describe('diálogos', () => {
  it('la primera charla es la presentación, y no se repite', () => {
    const { s, ctx } = setup();
    expect(pickDialogue(CONTENT, s, 'rulfa')?.id).toBe('rulfa_intro');
    goTo(s, ctx, 'taberna');
    const out: { result?: TalkResult } = {};
    startTalk(s, ctx, 'rulfa', out);
    expect(out.result?.dialogueId).toBe('rulfa_intro');
    s.day += 1;
    expect(pickDialogue(CONTENT, s, 'rulfa')?.id).not.toBe('rulfa_intro');
  });

  it('respeta el límite diario', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'taberna');
    startTalk(s, ctx, 'rulfa', {});
    const out: { result?: TalkResult } = {};
    startTalk(s, ctx, 'rulfa', out);
    expect(out.result?.dialogueId).toBeNull();
    expect(out.result?.busyLine).toBeTruthy();
  });

  it('las opciones mueven la relación', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'taberna');
    startTalk(s, ctx, 'rulfa', {});
    const out: { next?: string | null } = {};
    chooseOption(s, ctx, 'rulfa_intro', 'a', 0, out);
    expect(s.npcs.rulfa.relation).toBe(4);
    expect(out.next).toBe('b');
  });

  it('con buena relación se desbloquea un secreto que anota una sinergia', () => {
    const { s, ctx } = setup();
    s.npcs.rulfa.relation = 20;
    s.npcs.rulfa.seenDialogues.push('rulfa_intro');
    expect(pickDialogue(CONTENT, s, 'rulfa')?.id).toBe('rulfa_secreto');
    goTo(s, ctx, 'taberna');
    startTalk(s, ctx, 'rulfa', {});
    expect(s.discoveredSynergies).toContain('forro_viscoso');
  });

  it('no se puede hablar con quien no está', () => {
    const { s, ctx } = setup();
    goTo(s, ctx, 'mercado');
    expect(() => startTalk(s, ctx, 'rulfa', {})).toThrow();
  });

  it('condiciones básicas', () => {
    const { s } = setup();
    expect(checkCondition(s, { type: 'gold', min: 10 })).toBe(true);
    expect(checkCondition(s, { type: 'slot', in: ['noche'] })).toBe(false);
    s.flags.visto = true;
    expect(checkCondition(s, { type: 'flag', flag: 'visto' })).toBe(true);
    expect(checkCondition(s, { type: 'flag', flag: 'visto', not: true })).toBe(false);
  });
});
