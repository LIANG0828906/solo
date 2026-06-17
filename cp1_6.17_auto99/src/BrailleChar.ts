export interface BrailleCharMap {
  [key: string]: number;
}

export const brailleMap: BrailleCharMap = {
  'A': 0b000001,
  'B': 0b000011,
  'C': 0b001001,
  'D': 0b011001,
  'E': 0b010001,
  'F': 0b001011,
  'G': 0b011011,
  'H': 0b010011,
  'I': 0b001010,
  'J': 0b011010,
  'K': 0b000101,
  'L': 0b000111,
  'M': 0b001101,
  'N': 0b011101,
  'O': 0b010101,
  'P': 0b001111,
  'Q': 0b011111,
  'R': 0b010111,
  'S': 0b001110,
  'T': 0b011110,
  'U': 0b100101,
  'V': 0b100111,
  'W': 0b111010,
  'X': 0b101101,
  'Y': 0b111101,
  'Z': 0b110101,
  '0': 0b011010,
  '1': 0b000001,
  '2': 0b000011,
  '3': 0b001001,
  '4': 0b011001,
  '5': 0b010001,
  '6': 0b001011,
  '7': 0b011011,
  '8': 0b010011,
  '9': 0b001010,
};

export function charToDots(char: string): boolean[] {
  const upperChar = char.toUpperCase();
  const bits = brailleMap[upperChar];
  if (bits === undefined) {
    return [false, false, false, false, false, false];
  }
  const dots: boolean[] = [];
  for (let i = 0; i < 6; i++) {
    dots.push(((bits >> i) & 1) === 1);
  }
  return dots;
}

export function dotsToChar(dots: boolean[]): string | null {
  let bits = 0;
  for (let i = 0; i < 6; i++) {
    if (dots[i]) {
      bits |= 1 << i;
    }
  }
  for (const [char, charBits] of Object.entries(brailleMap)) {
    if (charBits === bits && /[A-Z]/.test(char)) {
      return char;
    }
  }
  return null;
}

export function getRandomChar(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

export function getRandomChars(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(getRandomChar());
  }
  return result;
}

export function dotsEqual(a: boolean[], b: boolean[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
