export interface PoemRiddle {
  lines: string[];
  keywords: number[];
  answer: string;
  category: 'flower' | 'medicine' | 'utensil' | 'place';
  hint: string;
}

export interface DecomposedBlock {
  id: string;
  char: string;
  sourceIndex: number;
  owner: string;
}

export interface RiddleState {
  riddle: PoemRiddle | null;
  decomposed: DecomposedBlock[];
  ringOrder: DecomposedBlock[];
  hintCount: number;
  revealed: boolean;
}

function permutations(chars: string[]): string[] {
  if (chars.length <= 1) return [chars.join('')];
  const result: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const rest = [...chars.slice(0, i), ...chars.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push(chars[i] + perm);
    }
  }
  return result;
}

function rotations(s: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < s.length; i++) {
    result.push(s.slice(i) + s.slice(0, i));
  }
  return result;
}

export function createEngine() {
  let state: RiddleState = {
    riddle: null,
    decomposed: [],
    ringOrder: [],
    hintCount: 0,
    revealed: false,
  };

  let blockCounter = 0;

  function getCharAt(index: number): string {
    if (!state.riddle) return '';
    const flat = state.riddle.lines.join('');
    return flat[index] || '';
  }

  function isCharTaken(sourceIndex: number): boolean {
    return (
      state.decomposed.some(b => b.sourceIndex === sourceIndex) ||
      state.ringOrder.some(b => b.sourceIndex === sourceIndex)
    );
  }

  return {
    setRiddle(riddle: PoemRiddle): void {
      state = {
        riddle,
        decomposed: [],
        ringOrder: [],
        hintCount: 0,
        revealed: false,
      };
      blockCounter = 0;
    },

    getRiddleState(): RiddleState {
      return {
        riddle: state.riddle,
        decomposed: [...state.decomposed],
        ringOrder: [...state.ringOrder],
        hintCount: state.hintCount,
        revealed: state.revealed,
      };
    },

    decompose(charIndex: number, playerId: string): DecomposedBlock | null {
      if (!state.riddle) return null;
      if (!state.riddle.keywords.includes(charIndex)) return null;
      if (isCharTaken(charIndex)) return null;

      const char = getCharAt(charIndex);
      const block: DecomposedBlock = {
        id: `block_${charIndex}_${++blockCounter}`,
        char,
        sourceIndex: charIndex,
        owner: playerId,
      };
      state.decomposed.push(block);
      return block;
    },

    returnBlock(blockId: string): boolean {
      let found = false;
      const dIdx = state.decomposed.findIndex(b => b.id === blockId);
      if (dIdx !== -1) {
        state.decomposed.splice(dIdx, 1);
        found = true;
      }
      const rIdx = state.ringOrder.findIndex(b => b.id === blockId);
      if (rIdx !== -1) {
        state.ringOrder.splice(rIdx, 1);
        found = true;
      }
      return found;
    },

    recompose(blockId: string): boolean {
      const dIdx = state.decomposed.findIndex(b => b.id === blockId);
      if (dIdx === -1) return false;
      const rIdx = state.ringOrder.findIndex(b => b.id === blockId);
      if (rIdx !== -1) return false;
      const [block] = state.decomposed.splice(dIdx, 1);
      state.ringOrder.push(block);
      return true;
    },

    removeFromRing(blockId: string): boolean {
      const rIdx = state.ringOrder.findIndex(b => b.id === blockId);
      if (rIdx === -1) return false;
      const [block] = state.ringOrder.splice(rIdx, 1);
      state.decomposed.push(block);
      return true;
    },

    judge(): { success: boolean; answer: string } {
      if (!state.riddle) return { success: false, answer: '' };
      const chars = state.ringOrder.map(b => b.char);
      const answer = state.riddle.answer;

      if (chars.length !== answer.length) {
        return { success: false, answer };
      }

      const ringStr = chars.join('');
      for (const rot of rotations(ringStr)) {
        if (rot === answer) {
          return { success: true, answer };
        }
      }

      for (const perm of permutations(chars)) {
        if (perm === answer) {
          return { success: true, answer };
        }
      }

      return { success: false, answer };
    },

    getHint(): string {
      if (!state.riddle) return '';
      state.hintCount++;
      return state.riddle.hint;
    },

    reveal(): string {
      if (!state.riddle) return '';
      state.revealed = true;
      return state.riddle.answer;
    },

    calculateScore(remainingSeconds: number): number {
      const raw = 100 - state.hintCount * 10 + remainingSeconds * 0.5;
      return Math.max(0, raw);
    },
  };
}
