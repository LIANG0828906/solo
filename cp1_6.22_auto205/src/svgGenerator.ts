export interface SignatureParams {
  text: string;
  speed: number;
  jitter: number;
  connection: number;
  bleed: number;
}

export interface StrokeData {
  path: string;
  length: number;
  duration: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export interface SignatureResult {
  svg: string;
  strokes: StrokeData[];
  totalDuration: number;
  strokeWidth: number;
}

interface Point {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 220;

const CHAR_STROKE_LIBRARY: Record<string, Point[][]> = {
  '张': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.25, y: 0.18 }, { x: 0.35, y: 0.15 }
    ],
    [
      { x: 0.25, y: 0.15 }, { x: 0.25, y: 0.55 }
    ],
    [
      { x: 0.15, y: 0.35 }, { x: 0.35, y: 0.35 }
    ],
    [
      { x: 0.15, y: 0.55 }, { x: 0.35, y: 0.55 }
    ],
    [
      { x: 0.45, y: 0.2 }, { x: 0.55, y: 0.25 }, { x: 0.65, y: 0.2 }
    ],
    [
      { x: 0.55, y: 0.2 }, { x: 0.5, y: 0.45 }, { x: 0.45, y: 0.65 }
    ],
    [
      { x: 0.55, y: 0.45 }, { x: 0.65, y: 0.5 }, { x: 0.7, y: 0.65 }
    ],
    [
      { x: 0.48, y: 0.7 }, { x: 0.6, y: 0.75 }, { x: 0.72, y: 0.7 }
    ]
  ],
  '三': [
    [
      { x: 0.15, y: 0.25 }, { x: 0.3, y: 0.22 }, { x: 0.45, y: 0.25 }
    ],
    [
      { x: 0.12, y: 0.5 }, { x: 0.3, y: 0.47 }, { x: 0.48, y: 0.5 }
    ],
    [
      { x: 0.1, y: 0.75 }, { x: 0.3, y: 0.72 }, { x: 0.5, y: 0.75 }
    ]
  ],
  'A': [
    [
      { x: 0.15, y: 0.85 }, { x: 0.3, y: 0.2 }, { x: 0.45, y: 0.85 }
    ],
    [
      { x: 0.22, y: 0.55 }, { x: 0.38, y: 0.55 }
    ]
  ],
  'B': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.35, y: 0.15 }, { x: 0.4, y: 0.3 }, { x: 0.35, y: 0.45 }, { x: 0.15, y: 0.45 }
    ],
    [
      { x: 0.15, y: 0.45 }, { x: 0.38, y: 0.45 }, { x: 0.43, y: 0.6 }, { x: 0.38, y: 0.85 }, { x: 0.15, y: 0.85 }
    ]
  ],
  'C': [
    [
      { x: 0.45, y: 0.15 }, { x: 0.2, y: 0.15 }, { x: 0.1, y: 0.35 }, { x: 0.1, y: 0.65 }, { x: 0.2, y: 0.85 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'D': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.35, y: 0.15 }, { x: 0.45, y: 0.35 }, { x: 0.45, y: 0.65 }, { x: 0.35, y: 0.85 }, { x: 0.15, y: 0.85 }
    ]
  ],
  'E': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.45, y: 0.15 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.4, y: 0.5 }
    ],
    [
      { x: 0.15, y: 0.85 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'F': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.45, y: 0.15 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.4, y: 0.5 }
    ]
  ],
  'G': [
    [
      { x: 0.45, y: 0.15 }, { x: 0.2, y: 0.15 }, { x: 0.1, y: 0.35 }, { x: 0.1, y: 0.65 }, { x: 0.2, y: 0.85 }, { x: 0.4, y: 0.85 }, { x: 0.45, y: 0.65 }, { x: 0.3, y: 0.65 }
    ]
  ],
  'H': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.45, y: 0.15 }, { x: 0.45, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.45, y: 0.5 }
    ]
  ],
  'I': [
    [
      { x: 0.3, y: 0.15 }, { x: 0.3, y: 0.85 }
    ]
  ],
  'J': [
    [
      { x: 0.45, y: 0.15 }, { x: 0.45, y: 0.7 }, { x: 0.35, y: 0.85 }, { x: 0.2, y: 0.85 }, { x: 0.1, y: 0.7 }
    ]
  ],
  'K': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.35, y: 0.25 }, { x: 0.5, y: 0.15 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.35, y: 0.65 }, { x: 0.5, y: 0.85 }
    ]
  ],
  'L': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'M': [
    [
      { x: 0.1, y: 0.85 }, { x: 0.1, y: 0.15 }, { x: 0.275, y: 0.5 }, { x: 0.45, y: 0.15 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'N': [
    [
      { x: 0.1, y: 0.85 }, { x: 0.1, y: 0.15 }, { x: 0.45, y: 0.85 }, { x: 0.45, y: 0.15 }
    ]
  ],
  'O': [
    [
      { x: 0.275, y: 0.15 }, { x: 0.1, y: 0.35 }, { x: 0.1, y: 0.65 }, { x: 0.275, y: 0.85 }, { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.35 }, { x: 0.275, y: 0.15 }
    ]
  ],
  'P': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.35, y: 0.15 }, { x: 0.45, y: 0.3 }, { x: 0.35, y: 0.5 }, { x: 0.15, y: 0.5 }
    ]
  ],
  'Q': [
    [
      { x: 0.275, y: 0.15 }, { x: 0.1, y: 0.35 }, { x: 0.1, y: 0.65 }, { x: 0.275, y: 0.85 }, { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.35 }, { x: 0.275, y: 0.15 }
    ],
    [
      { x: 0.35, y: 0.7 }, { x: 0.5, y: 0.85 }
    ]
  ],
  'R': [
    [
      { x: 0.15, y: 0.15 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.15 }, { x: 0.35, y: 0.15 }, { x: 0.45, y: 0.3 }, { x: 0.35, y: 0.5 }, { x: 0.15, y: 0.5 }
    ],
    [
      { x: 0.25, y: 0.5 }, { x: 0.4, y: 0.65 }, { x: 0.5, y: 0.85 }
    ]
  ],
  'S': [
    [
      { x: 0.45, y: 0.2 }, { x: 0.25, y: 0.2 }, { x: 0.1, y: 0.35 }, { x: 0.25, y: 0.5 }, { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.8 }, { x: 0.2, y: 0.8 }
    ]
  ],
  'T': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.45, y: 0.15 }
    ],
    [
      { x: 0.275, y: 0.15 }, { x: 0.275, y: 0.85 }
    ]
  ],
  'U': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.1, y: 0.65 }, { x: 0.2, y: 0.85 }, { x: 0.35, y: 0.85 }, { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.15 }
    ]
  ],
  'V': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.275, y: 0.85 }, { x: 0.45, y: 0.15 }
    ]
  ],
  'W': [
    [
      { x: 0.08, y: 0.15 }, { x: 0.15, y: 0.85 }, { x: 0.25, y: 0.5 }, { x: 0.35, y: 0.85 }, { x: 0.48, y: 0.15 }
    ]
  ],
  'X': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.45, y: 0.85 }
    ],
    [
      { x: 0.45, y: 0.15 }, { x: 0.1, y: 0.85 }
    ]
  ],
  'Y': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.275, y: 0.45 }, { x: 0.45, y: 0.15 }
    ],
    [
      { x: 0.275, y: 0.45 }, { x: 0.275, y: 0.85 }
    ]
  ],
  'Z': [
    [
      { x: 0.1, y: 0.15 }, { x: 0.45, y: 0.15 }, { x: 0.1, y: 0.85 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'a': [
    [
      { x: 0.4, y: 0.35 }, { x: 0.2, y: 0.35 }, { x: 0.1, y: 0.55 }, { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.45, y: 0.55 }, { x: 0.4, y: 0.35 }
    ],
    [
      { x: 0.4, y: 0.55 }, { x: 0.4, y: 0.85 }
    ]
  ],
  'b': [
    [
      { x: 0.15, y: 0.1 }, { x: 0.15, y: 0.75 }
    ],
    [
      { x: 0.15, y: 0.35 }, { x: 0.35, y: 0.35 }, { x: 0.45, y: 0.55 }, { x: 0.35, y: 0.75 }, { x: 0.15, y: 0.75 }
    ]
  ],
  'c': [
    [
      { x: 0.4, y: 0.4 }, { x: 0.2, y: 0.35 }, { x: 0.1, y: 0.55 }, { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.7 }
    ]
  ],
  'd': [
    [
      { x: 0.45, y: 0.1 }, { x: 0.45, y: 0.75 }
    ],
    [
      { x: 0.45, y: 0.35 }, { x: 0.25, y: 0.35 }, { x: 0.15, y: 0.55 }, { x: 0.25, y: 0.75 }, { x: 0.45, y: 0.75 }
    ]
  ],
  'e': [
    [
      { x: 0.1, y: 0.55 }, { x: 0.4, y: 0.55 }, { x: 0.45, y: 0.45 }, { x: 0.35, y: 0.35 }, { x: 0.15, y: 0.4 }, { x: 0.1, y: 0.55 }, { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.7 }
    ]
  ],
  'f': [
    [
      { x: 0.35, y: 0.15 }, { x: 0.25, y: 0.15 }, { x: 0.2, y: 0.3 }, { x: 0.2, y: 0.85 }
    ],
    [
      { x: 0.1, y: 0.45 }, { x: 0.3, y: 0.45 }
    ]
  ],
  'g': [
    [
      { x: 0.4, y: 0.35 }, { x: 0.2, y: 0.35 }, { x: 0.1, y: 0.55 }, { x: 0.2, y: 0.75 }, { x: 0.4, y: 0.75 }, { x: 0.45, y: 0.55 }, { x: 0.4, y: 0.35 }
    ],
    [
      { x: 0.4, y: 0.75 }, { x: 0.45, y: 0.9 }, { x: 0.35, y: 0.95 }, { x: 0.15, y: 0.9 }
    ]
  ],
  'h': [
    [
      { x: 0.12, y: 0.1 }, { x: 0.12, y: 0.75 }
    ],
    [
      { x: 0.12, y: 0.4 }, { x: 0.3, y: 0.4 }, { x: 0.4, y: 0.55 }, { x: 0.4, y: 0.85 }
    ]
  ],
  'i': [
    [
      { x: 0.25, y: 0.4 }, { x: 0.25, y: 0.85 }
    ],
    [
      { x: 0.25, y: 0.25 }, { x: 0.28, y: 0.25 }
    ]
  ],
  'j': [
    [
      { x: 0.35, y: 0.4 }, { x: 0.35, y: 0.9 }, { x: 0.25, y: 0.95 }, { x: 0.1, y: 0.9 }
    ],
    [
      { x: 0.35, y: 0.25 }, { x: 0.38, y: 0.25 }
    ]
  ],
  'k': [
    [
      { x: 0.15, y: 0.1 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.5 }, { x: 0.35, y: 0.3 }, { x: 0.45, y: 0.15 }
    ],
    [
      { x: 0.15, y: 0.55 }, { x: 0.4, y: 0.75 }, { x: 0.45, y: 0.85 }
    ]
  ],
  'l': [
    [
      { x: 0.25, y: 0.1 }, { x: 0.25, y: 0.85 }
    ]
  ],
  'm': [
    [
      { x: 0.1, y: 0.4 }, { x: 0.1, y: 0.85 }
    ],
    [
      { x: 0.1, y: 0.4 }, { x: 0.25, y: 0.4 }, { x: 0.3, y: 0.55 }, { x: 0.3, y: 0.85 }
    ],
    [
      { x: 0.3, y: 0.4 }, { x: 0.45, y: 0.4 }, { x: 0.5, y: 0.55 }, { x: 0.5, y: 0.85 }
    ]
  ],
  'n': [
    [
      { x: 0.12, y: 0.4 }, { x: 0.12, y: 0.85 }
    ],
    [
      { x: 0.12, y: 0.4 }, { x: 0.32, y: 0.4 }, { x: 0.42, y: 0.55 }, { x: 0.42, y: 0.85 }
    ]
  ],
  'o': [
    [
      { x: 0.275, y: 0.4 }, { x: 0.1, y: 0.55 }, { x: 0.1, y: 0.75 }, { x: 0.275, y: 0.85 }, { x: 0.45, y: 0.75 }, { x: 0.45, y: 0.55 }, { x: 0.275, y: 0.4 }
    ]
  ],
  'p': [
    [
      { x: 0.15, y: 0.4 }, { x: 0.15, y: 0.95 }
    ],
    [
      { x: 0.15, y: 0.4 }, { x: 0.35, y: 0.4 }, { x: 0.45, y: 0.55 }, { x: 0.35, y: 0.75 }, { x: 0.15, y: 0.75 }
    ]
  ],
  'q': [
    [
      { x: 0.45, y: 0.4 }, { x: 0.45, y: 0.95 }
    ],
    [
      { x: 0.45, y: 0.4 }, { x: 0.25, y: 0.4 }, { x: 0.15, y: 0.55 }, { x: 0.25, y: 0.75 }, { x: 0.45, y: 0.75 }
    ]
  ],
  'r': [
    [
      { x: 0.15, y: 0.45 }, { x: 0.15, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.45 }, { x: 0.3, y: 0.4 }, { x: 0.4, y: 0.45 }
    ]
  ],
  's': [
    [
      { x: 0.4, y: 0.45 }, { x: 0.2, y: 0.45 }, { x: 0.12, y: 0.55 }, { x: 0.25, y: 0.62 }, { x: 0.4, y: 0.7 }, { x: 0.4, y: 0.8 }, { x: 0.2, y: 0.8 }
    ]
  ],
  't': [
    [
      { x: 0.275, y: 0.15 }, { x: 0.275, y: 0.85 }
    ],
    [
      { x: 0.15, y: 0.35 }, { x: 0.4, y: 0.35 }
    ]
  ],
  'u': [
    [
      { x: 0.12, y: 0.4 }, { x: 0.12, y: 0.7 }, { x: 0.2, y: 0.85 }, { x: 0.35, y: 0.85 }, { x: 0.45, y: 0.7 }, { x: 0.45, y: 0.4 }
    ]
  ],
  'v': [
    [
      { x: 0.1, y: 0.4 }, { x: 0.275, y: 0.85 }, { x: 0.45, y: 0.4 }
    ]
  ],
  'w': [
    [
      { x: 0.08, y: 0.4 }, { x: 0.15, y: 0.85 }, { x: 0.25, y: 0.55 }, { x: 0.35, y: 0.85 }, { x: 0.48, y: 0.4 }
    ]
  ],
  'x': [
    [
      { x: 0.1, y: 0.45 }, { x: 0.45, y: 0.8 }
    ],
    [
      { x: 0.45, y: 0.45 }, { x: 0.1, y: 0.8 }
    ]
  ],
  'y': [
    [
      { x: 0.1, y: 0.4 }, { x: 0.275, y: 0.6 }, { x: 0.45, y: 0.4 }
    ],
    [
      { x: 0.275, y: 0.6 }, { x: 0.35, y: 0.9 }, { x: 0.25, y: 0.95 }, { x: 0.1, y: 0.85 }
    ]
  ],
  'z': [
    [
      { x: 0.1, y: 0.45 }, { x: 0.4, y: 0.45 }, { x: 0.15, y: 0.8 }, { x: 0.45, y: 0.8 }
    ]
  ],
  ' ': [[]],
  '.': [
    [
      { x: 0.25, y: 0.78 }, { x: 0.28, y: 0.78 }
    ]
  ],
  ',': [
    [
      { x: 0.25, y: 0.75 }, { x: 0.22, y: 0.85 }
    ]
  ],
  '!': [
    [
      { x: 0.25, y: 0.3 }, { x: 0.25, y: 0.7 }
    ],
    [
      { x: 0.25, y: 0.78 }, { x: 0.28, y: 0.78 }
    ]
  ],
  '?': [
    [
      { x: 0.15, y: 0.35 }, { x: 0.3, y: 0.3 }, { x: 0.35, y: 0.45 }, { x: 0.25, y: 0.55 }, { x: 0.25, y: 0.7 }
    ],
    [
      { x: 0.25, y: 0.78 }, { x: 0.28, y: 0.78 }
    ]
  ],
  '-': [
    [
      { x: 0.1, y: 0.6 }, { x: 0.4, y: 0.6 }
    ]
  ],
  '_': [
    [
      { x: 0.1, y: 0.85 }, { x: 0.45, y: 0.85 }
    ]
  ],
  "'": [
    [
      { x: 0.3, y: 0.35 }, { x: 0.28, y: 0.45 }
    ]
  ],
  '"': [
    [
      { x: 0.22, y: 0.35 }, { x: 0.2, y: 0.45 }
    ],
    [
      { x: 0.32, y: 0.35 }, { x: 0.3, y: 0.45 }
    ]
  ]
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function getCharStrokes(char: string, seed: number): Point[][] {
  const upperChar = char.toUpperCase();
  const lowerChar = char.toLowerCase();
  
  if (CHAR_STROKE_LIBRARY[char]) {
    return CHAR_STROKE_LIBRARY[char];
  }
  
  if (CHAR_STROKE_LIBRARY[upperChar]) {
    return CHAR_STROKE_LIBRARY[upperChar];
  }
  
  if (CHAR_STROKE_LIBRARY[lowerChar]) {
    return CHAR_STROKE_LIBRARY[lowerChar];
  }
  
  return generateGenericCharStrokes(char, seed);
}

function generateGenericCharStrokes(char: string, seed: number): Point[][] {
  const random = seededRandom(seed + char.charCodeAt(0));
  const strokes: Point[][] = [];
  const numStrokes = Math.floor(random() * 3) + 2;
  
  for (let i = 0; i < numStrokes; i++) {
    const stroke: Point[] = [];
    const startY = 0.2 + random() * 0.5;
    const endY = 0.3 + random() * 0.5;
    const xOffset = random() * 0.1;
    
    stroke.push({ x: 0.1 + xOffset, y: startY });
    
    const midPoints = Math.floor(random() * 2) + 1;
    for (let j = 0; j < midPoints; j++) {
      stroke.push({
        x: 0.2 + xOffset + (j + 1) * 0.15,
        y: Math.min(0.9, Math.max(0.1, startY + (random() - 0.5) * 0.4))
      });
    }
    
    stroke.push({ x: 0.45 + xOffset, y: endY });
    strokes.push(stroke);
  }
  
  return strokes;
}

function addJitter(points: Point[], jitterAmount: number, random: () => number): Point[] {
  return points.map(p => ({
    x: p.x + (random() - 0.5) * jitterAmount * 0.01,
    y: p.y + (random() - 0.5) * jitterAmount * 0.01
  }));
}

function generateSmoothPath(points: Point[], charOffsetX: number, charWidth: number, charOffsetY: number): string {
  if (points.length < 2) return '';
  
  const scaleX = charWidth;
  const scaleY = CANVAS_HEIGHT * 0.85;
  const baseY = CANVAS_HEIGHT * 0.075 + charOffsetY;
  
  const first = points[0];
  let path = `M ${charOffsetX + first.x * scaleX} ${baseY + first.y * scaleY}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = charOffsetX + (prev.x + curr.x) / 2 * scaleX;
    const cpy = baseY + (prev.y + curr.y) / 2 * scaleY;
    const endX = charOffsetX + curr.x * scaleX;
    const endY = baseY + curr.y * scaleY;
    path += ` Q ${cpx} ${cpy} ${endX} ${endY}`;
  }
  
  return path;
}

function estimatePathLength(points: Point[], charWidth: number): number {
  let length = 0;
  const scaleX = charWidth;
  const scaleY = CANVAS_HEIGHT * 0.85;
  
  for (let i = 1; i < points.length; i++) {
    const dx = (points[i].x - points[i - 1].x) * scaleX;
    const dy = (points[i].y - points[i - 1].y) * scaleY;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  
  return length;
}

function generateConnectionPath(
  from: Point,
  to: Point,
  fromOffsetX: number,
  toOffsetX: number,
  charWidth: number,
  connection: number,
  random: () => number
): { path: string; length: number } | null {
  if (random() > connection) return null;
  
  const scaleX = charWidth;
  const scaleY = CANVAS_HEIGHT * 0.85;
  const baseY = CANVAS_HEIGHT * 0.075;
  
  const midX = (fromOffsetX + from.x * charWidth + toOffsetX + to.x * charWidth) / 2;
  const midY = baseY + ((from.y + to.y) / 2 + (random() - 0.5) * 0.15 * connection) * scaleY;
  
  const startX = fromOffsetX + from.x * scaleX;
  const startY = baseY + from.y * scaleY;
  const endX = toOffsetX + to.x * scaleX;
  const endY = baseY + to.y * scaleY;
  
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy) * 1.3;
  
  return {
    path: `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`,
    length
  };
}

function isChinese(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x4E00 && code <= 0x9FFF;
}

export function generateSignature(params: SignatureParams): SignatureResult {
  const { text, speed, jitter, connection, bleed } = params;
  const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const random = seededRandom(seed);
  
  const chars = text.split('');
  const chineseCount = chars.filter(isChinese).length;
  const englishCount = chars.length - chineseCount;
  const totalWidth = chineseCount * 110 + englishCount * 55;
  const startX = Math.max(20, (CANVAS_WIDTH - totalWidth) / 2);
  
  const strokes: StrokeData[] = [];
  let currentX = startX;
  let lastEndPoint: Point | null = null;
  let lastCharOffsetX = 0;
  
  const baseStrokeWidth = 4.5 - (speed - 0.5) * 1.2;
  const strokeWidth = Math.max(1.5, Math.min(6, baseStrokeWidth));
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === ' ') {
      currentX += 40;
      continue;
    }
    
    const isChineseChar = isChinese(char);
    const charWidth = isChineseChar ? 100 : 50;
    const charOffsetX = currentX;
    const charOffsetY = isChineseChar ? 0 : -10;
    
    const charStrokes = getCharStrokes(char, seed + i * 1000);
    
    if (connection > 0.4 && lastEndPoint && charStrokes.length > 0 && charStrokes[0].length > 0) {
      const connectionPath = generateConnectionPath(
        lastEndPoint,
        charStrokes[0][0],
        lastCharOffsetX,
        charOffsetX,
        charWidth,
        connection,
        random
      );
      
      if (connectionPath) {
        const duration = (connectionPath.length / 100) / speed * 800;
        strokes.push({
          path: connectionPath.path,
          length: connectionPath.length,
          duration,
          startX: charOffsetX,
          endX: charOffsetX + charWidth,
          startY: CANVAS_HEIGHT * 0.5,
          endY: CANVAS_HEIGHT * 0.5
        });
      }
    }
    
    for (const strokePoints of charStrokes) {
      if (strokePoints.length < 2) continue;
      
      const jitteredPoints = addJitter(strokePoints, jitter, random);
      const path = generateSmoothPath(jitteredPoints, charOffsetX, charWidth, charOffsetY);
      const length = estimatePathLength(jitteredPoints, charWidth);
      const duration = (length / 100) / speed * 800;
      
      const first = jitteredPoints[0];
      const last = jitteredPoints[jitteredPoints.length - 1];
      
      strokes.push({
        path,
        length,
        duration,
        startX: charOffsetX + first.x * charWidth,
        endX: charOffsetX + last.x * charWidth,
        startY: CANVAS_HEIGHT * 0.075 + charOffsetY + first.y * CANVAS_HEIGHT * 0.85,
        endY: CANVAS_HEIGHT * 0.075 + charOffsetY + last.y * CANVAS_HEIGHT * 0.85
      });
      
      lastEndPoint = last;
      lastCharOffsetX = charOffsetX;
    }
    
    currentX += charWidth + 8;
  }
  
  const totalDuration = strokes.reduce((acc, s) => acc + s.duration, 0);
  
  let pathsSvg = '';
  strokes.forEach((stroke, index) => {
    const filterAttr = bleed > 0 ? `filter="url(#ink-bleed)"` : '';
    pathsSvg += `<path d="${stroke.path}" fill="none" stroke="#1F2937" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="signature-stroke" data-index="${index}" data-length="${stroke.length}" data-duration="${stroke.duration}" ${filterAttr} />`;
  });
  
  const filterSvg = bleed > 0 ? `
    <defs>
      <filter id="ink-bleed" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${bleed * 0.4}" />
      </filter>
    </defs>
  ` : '';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" preserveAspectRatio="xMidYMid meet">
      ${filterSvg}
      ${pathsSvg}
    </svg>
  `.trim();
  
  return { svg, strokes, totalDuration, strokeWidth };
}

export function updateStrokeAnimation(
  svgElement: SVGSVGElement,
  strokes: StrokeData[],
  progress: number
): void {
  let elapsed = 0;
  const totalDuration = strokes.reduce((acc, s) => acc + s.duration, 0);
  const targetTime = progress * totalDuration;
  
  const pathElements = svgElement.querySelectorAll('.signature-stroke');
  
  pathElements.forEach((el, index) => {
    const stroke = strokes[index];
    if (!stroke) return;
    
    const pathEl = el as SVGPathElement;
    
    if (targetTime >= elapsed + stroke.duration) {
      pathEl.style.strokeDasharray = 'none';
      pathEl.style.strokeDashoffset = '0';
    } else if (targetTime <= elapsed) {
      pathEl.style.strokeDasharray = `${stroke.length}`;
      pathEl.style.strokeDashoffset = `${stroke.length}`;
    } else {
      const strokeProgress = (targetTime - elapsed) / stroke.duration;
      const offset = stroke.length * (1 - strokeProgress);
      pathEl.style.strokeDasharray = `${stroke.length}`;
      pathEl.style.strokeDashoffset = `${offset}`;
    }
    
    elapsed += stroke.duration;
  });
}

export function resetStrokeAnimation(svgElement: SVGSVGElement, strokes: StrokeData[]): void {
  const pathElements = svgElement.querySelectorAll('.signature-stroke');
  pathElements.forEach((el, index) => {
    const stroke = strokes[index];
    if (!stroke) return;
    const pathEl = el as SVGPathElement;
    pathEl.style.strokeDasharray = `${stroke.length}`;
    pathEl.style.strokeDashoffset = `${stroke.length}`;
  });
}

export function completeStrokeAnimation(svgElement: SVGSVGElement): void {
  const pathElements = svgElement.querySelectorAll('.signature-stroke');
  pathElements.forEach((el) => {
    const pathEl = el as SVGPathElement;
    pathEl.style.strokeDasharray = 'none';
    pathEl.style.strokeDashoffset = '0';
  });
}
