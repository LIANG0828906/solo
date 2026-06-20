export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getGradientColors(name: string): { from: string; to: string } {
  const hash = hashString(name);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40 + (hash % 80)) % 360;
  const saturation = 60 + (hash % 20);
  const lightness = 65 + (hash % 10);
  
  return {
    from: `hsl(${hue1}, ${saturation}%, ${lightness}%)`,
    to: `hsl(${hue2}, ${saturation}%, ${lightness - 15}%)`
  };
}
