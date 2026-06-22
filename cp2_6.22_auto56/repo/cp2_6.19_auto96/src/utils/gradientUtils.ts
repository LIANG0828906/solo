export interface GradientLayer {
  id: string;
  startColor: string;
  endColor: string;
  angle: number;
  stop1: number;
  stop2: number;
}

export interface PresetTheme {
  id: string;
  name: string;
  icon: "circle" | "triangle" | "star";
  layers: GradientLayer[];
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6 && clean.length !== 3) return null;
  const expanded =
    clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean;
  const num = parseInt(expanded, 16);
  if (isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function isValidColorFormat(value: string): boolean {
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) return true;
  if (
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(value)
  )
    return true;
  if (
    /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/.test(value)
  )
    return true;
  return false;
}

export function generateGradientCSS(layers: GradientLayer[]): string {
  if (layers.length === 0) return "background: linear-gradient(0deg, #000000 0%, #ffffff 100%);";
  const parts = layers.map((layer) => {
    return `linear-gradient(${layer.angle}deg, ${layer.startColor} ${layer.stop1}%, ${layer.endColor} ${layer.stop2}%)`;
  });
  return `background: ${parts.join(", ")};`;
}

export function generateLayerGradientCSS(layer: GradientLayer): string {
  return `linear-gradient(${layer.angle}deg, ${layer.startColor} ${layer.stop1}%, ${layer.endColor} ${layer.stop2}%)`;
}

export function parseColorToHex(color: string): string {
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    const clean = color.replace("#", "");
    if (clean.length === 3) {
      return "#" + clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    return color.toLowerCase();
  }
  const rgbMatch = color.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return (
      "#" +
      [r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("")
    );
  }
  return color;
}

let _idCounter = 0;
export function generateId(): string {
  _idCounter++;
  return `layer-${Date.now()}-${_idCounter}`;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: "sunset",
    name: "日落红橙",
    icon: "circle",
    layers: [
      { id: "s1", startColor: "#ff6b35", endColor: "#f7c59f", angle: 135, stop1: 0, stop2: 100 },
      { id: "s2", startColor: "#d62828", endColor: "#f77f00", angle: 180, stop1: 10, stop2: 90 },
    ],
  },
  {
    id: "ocean",
    name: "海洋蓝绿",
    icon: "triangle",
    layers: [
      { id: "o1", startColor: "#0077b6", endColor: "#90e0ef", angle: 180, stop1: 0, stop2: 100 },
      { id: "o2", startColor: "#023e8a", endColor: "#48cae4", angle: 160, stop1: 5, stop2: 95 },
    ],
  },
  {
    id: "aurora",
    name: "极光紫绿",
    icon: "star",
    layers: [
      { id: "a1", startColor: "#7209b7", endColor: "#4cc9f0", angle: 135, stop1: 0, stop2: 100 },
      { id: "a2", startColor: "#560bad", endColor: "#80ed99", angle: 200, stop1: 10, stop2: 90 },
    ],
  },
  {
    id: "flame",
    name: "火焰红黄",
    icon: "circle",
    layers: [
      { id: "f1", startColor: "#e63946", endColor: "#ffb703", angle: 0, stop1: 0, stop2: 100 },
      { id: "f2", startColor: "#d00000", endColor: "#faa307", angle: 45, stop1: 0, stop2: 100 },
    ],
  },
  {
    id: "forest",
    name: "森林绿棕",
    icon: "triangle",
    layers: [
      { id: "fr1", startColor: "#2d6a4f", endColor: "#d4a373", angle: 170, stop1: 0, stop2: 100 },
      { id: "fr2", startColor: "#40916c", endColor: "#b08968", angle: 200, stop1: 10, stop2: 90 },
    ],
  },
  {
    id: "galaxy",
    name: "星系紫蓝",
    icon: "star",
    layers: [
      { id: "g1", startColor: "#3a0ca3", endColor: "#4361ee", angle: 135, stop1: 0, stop2: 100 },
      { id: "g2", startColor: "#4cc9f0", endColor: "#7209b7", angle: 225, stop1: 0, stop2: 100 },
    ],
  },
];
