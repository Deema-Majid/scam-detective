import { beforeEach, describe, expect, it } from 'vitest';

// Minimal localStorage so zustand/persist works under the node test environment.
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;
(globalThis as unknown as { window: unknown }).window = { location: { search: '' }, matchMedia: () => ({ matches: false }), localStorage: (globalThis as unknown as { localStorage: Storage }).localStorage };

describe('tester flow in the store', () => {
  beforeEach(() => mem.clear());

  it('creates the post-test session when the last case ends in tester mode', async () => {
    const { useGame } = await import('../../src/store/gameStore');
    useGame.getState().resetAll();
    useGame.getState().setMode('tester');
    useGame.getState().setTester('T-0427');
    const last = useGame.getState().caseOrder.at(-1)!;
    useGame.setState({ currentCaseId: last });
    useGame.getState().nextCase();
    const s = useGame.getState();
    expect(s.screen).toBe('posttest');
    expect(s.post?.form).toBe('B'); // odd code: A before, B after
    expect(s.post?.answers).toEqual([]);
  });

  it('family mode ends on the family card', async () => {
    const { useGame } = await import('../../src/store/gameStore');
    useGame.getState().resetAll();
    useGame.getState().setMode('family', ['case1']);
    useGame.setState({ currentCaseId: 'case1' });
    useGame.getState().nextCase();
    expect(useGame.getState().screen).toBe('family-card');
  });
});

describe('mode follows the URL', () => {
  beforeEach(() => mem.clear());

  it('family saved, plain URL -> clean normal session', async () => {
    const { useGame } = await import('../../src/store/gameStore');
    useGame.getState().resetAll();
    useGame.getState().syncModeWithUrl('?mode=family&case=case2');
    expect(useGame.getState().mode).toBe('family');
    expect(useGame.getState().screen).toBe('case');
    expect(useGame.getState().currentCaseId).toBe('case2');
    useGame.getState().syncModeWithUrl('');
    const s = useGame.getState();
    expect(s.mode).toBe('normal');
    expect(s.screen).toBe('intro');
    expect(s.currentCaseId).toBeUndefined();
    expect(s.runs).toEqual({});
  });

  it('tester saved, plain URL -> clean normal session; same mode resumes', async () => {
    const { useGame } = await import('../../src/store/gameStore');
    useGame.getState().resetAll();
    useGame.getState().syncModeWithUrl('?tester=1');
    useGame.getState().setTester('T-0427');
    useGame.getState().setScreen('consent');
    useGame.getState().syncModeWithUrl('?tester=1');
    expect(useGame.getState().screen).toBe('consent');
    expect(useGame.getState().tester?.code).toBe('T-0427');
    useGame.getState().syncModeWithUrl('');
    expect(useGame.getState().mode).toBe('normal');
    expect(useGame.getState().tester).toBeUndefined();
    expect(useGame.getState().screen).toBe('intro');
  });

  it('exitFamily resets to normal intro', async () => {
    const { useGame } = await import('../../src/store/gameStore');
    useGame.getState().syncModeWithUrl('?mode=family&case=case1');
    useGame.getState().exitFamily();
    expect(useGame.getState().mode).toBe('normal');
    expect(useGame.getState().screen).toBe('intro');
  });
});
