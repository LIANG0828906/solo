export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface StrokeKeyPoints {
  points: Point[];
  directions: number[];
}

export interface RuneTemplate {
  id: string;
  name: string;
  complexity: number;
  description: string;
  strokeCount: number;
  strokes: { keyPoints: { x: number; y: number }[] }[];
  preview: string;
}

const RUNES: RuneTemplate[] = [
  {
    id: "zhenhun",
    name: "镇魂符",
    complexity: 1,
    description: "安定魂魄，平息惊扰",
    strokeCount: 3,
    strokes: [
      { keyPoints: [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.7 }] },
      { keyPoints: [{ x: 0.2, y: 0.4 }, { x: 0.8, y: 0.4 }] },
      { keyPoints: [{ x: 0.5, y: 0.82 }, { x: 0.5, y: 0.88 }] },
    ],
    preview: "丨",
  },
  {
    id: "jingxin",
    name: "净心符",
    complexity: 2,
    description: "涤荡心魔，澄澈神志",
    strokeCount: 4,
    strokes: [
      { keyPoints: [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.65 }] },
      { keyPoints: [{ x: 0.15, y: 0.35 }, { x: 0.85, y: 0.35 }] },
      { keyPoints: [{ x: 0.15, y: 0.35 }, { x: 0.35, y: 0.55 }, { x: 0.5, y: 0.65 }] },
      { keyPoints: [{ x: 0.85, y: 0.35 }, { x: 0.65, y: 0.55 }, { x: 0.5, y: 0.65 }] },
    ],
    preview: "✟",
  },
  {
    id: "quxie",
    name: "驱邪符",
    complexity: 3,
    description: "辟除邪祟，守护安宁",
    strokeCount: 5,
    strokes: [
      { keyPoints: [{ x: 0.5, y: 0.08 }, { x: 0.5, y: 0.75 }] },
      { keyPoints: [{ x: 0.15, y: 0.3 }, { x: 0.85, y: 0.3 }] },
      { keyPoints: [{ x: 0.2, y: 0.1 }, { x: 0.5, y: 0.35 }] },
      { keyPoints: [{ x: 0.8, y: 0.1 }, { x: 0.5, y: 0.35 }] },
      { keyPoints: [{ x: 0.38, y: 0.8 }, { x: 0.5, y: 0.9 }, { x: 0.62, y: 0.8 }] },
    ],
    preview: "⚡",
  },
  {
    id: "zhaocai",
    name: "招财符",
    complexity: 4,
    description: "招财纳福，财源广进",
    strokeCount: 6,
    strokes: [
      { keyPoints: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.4 }] },
      { keyPoints: [{ x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 }] },
      { keyPoints: [{ x: 0.2, y: 0.25 }, { x: 0.3, y: 0.45 }, { x: 0.5, y: 0.55 }] },
      { keyPoints: [{ x: 0.8, y: 0.25 }, { x: 0.7, y: 0.45 }, { x: 0.5, y: 0.55 }] },
      { keyPoints: [{ x: 0.3, y: 0.6 }, { x: 0.5, y: 0.85 }, { x: 0.7, y: 0.6 }] },
      { keyPoints: [{ x: 0.5, y: 0.55 }, { x: 0.5, y: 0.85 }] },
    ],
    preview: "☰",
  },
  {
    id: "tiangang",
    name: "天罡符",
    complexity: 5,
    description: "引天罡之力，镇压万邪",
    strokeCount: 8,
    strokes: [
      { keyPoints: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.45 }] },
      { keyPoints: [{ x: 0.15, y: 0.25 }, { x: 0.85, y: 0.25 }] },
      { keyPoints: [{ x: 0.2, y: 0.08 }, { x: 0.5, y: 0.25 }] },
      { keyPoints: [{ x: 0.8, y: 0.08 }, { x: 0.5, y: 0.25 }] },
      { keyPoints: [{ x: 0.5, y: 0.25 }, { x: 0.3, y: 0.55 }] },
      { keyPoints: [{ x: 0.5, y: 0.25 }, { x: 0.7, y: 0.55 }] },
      { keyPoints: [{ x: 0.25, y: 0.55 }, { x: 0.5, y: 0.9 }, { x: 0.75, y: 0.55 }] },
      { keyPoints: [{ x: 0.35, y: 0.65 }, { x: 0.65, y: 0.65 }] },
    ],
    preview: "✦",
  },
];

export function getRuneById(id: string): RuneTemplate | undefined {
  return RUNES.find((r) => r.id === id);
}

export function getAllRunes(): RuneTemplate[] {
  return RUNES;
}
