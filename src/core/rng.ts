// Generador pseudoaleatorio con semilla (mulberry32). El estado entra en el save,
// así la forja y los clientes son reproducibles en tests y en debug.

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(list: readonly T[]): T;
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  state(): number;
}

function fromNext(next: () => number, state: () => number): Rng {
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (entries) => {
      const total = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
      let r = next() * total;
      for (const [value, w] of entries) {
        r -= Math.max(0, w);
        if (r < 0) return value;
      }
      return entries[entries.length - 1][0];
    },
    state,
  };
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  return fromNext(() => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }, () => s);
}

/** Rng con secuencia fija (cíclica), para tests. */
export function fixedRng(values: number[]): Rng {
  let i = 0;
  return fromNext(() => values[i++ % values.length], () => i);
}
