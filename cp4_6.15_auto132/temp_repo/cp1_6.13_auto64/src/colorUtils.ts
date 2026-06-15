export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

export function generateColorWithHueDifference(existingHues: number[], minDiff: number = 60): { hue: number; hex: string } {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const hue = Math.random() * 360;
    const hasCloseColor = existingHues.some(h => hueDifference(h, hue) < minDiff);
    
    if (!hasCloseColor || existingHues.length === 0) {
      const saturation = 0.5 + Math.random() * 0.2;
      const lightness = 0.75 + Math.random() * 0.15;
      return {
        hue,
        hex: hslToHex(hue, saturation, lightness),
      };
    }
    attempts++;
  }
  
  const hue = Math.random() * 360;
  const saturation = 0.5 + Math.random() * 0.2;
  const lightness = 0.75 + Math.random() * 0.15;
  return {
    hue,
    hex: hslToHex(hue, saturation, lightness),
  };
}

export function collectAllHues(cards: any[]): number[] {
  const hues: number[] = [];
  const collect = (cardList: any[]) => {
    for (const card of cardList) {
      hues.push(card.hue);
      if (card.children && card.children.length > 0) {
        collect(card.children);
      }
    }
  };
  collect(cards);
  return hues;
}
