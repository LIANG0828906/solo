export interface Star {
  id: string;
  name: string;
  x: number;
  y: number;
  baseSize: number;
  baseBrightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

export interface Constellation {
  id: string;
  name: string;
  stars: string[];
  connections: [string, string][];
}

export interface ObservedStar {
  id: string;
  starId: string;
  starName: string;
  note: string;
  observedAt: string;
}

export interface CustomConnection {
  id: string;
  fromStarId: string;
  toStarId: string;
  color: string;
  note: string;
  createdAt: string;
}

export interface ObservationLog {
  id: string;
  type: 'observe' | 'connect' | 'constellation';
  target: string;
  note: string;
  mood: string;
  timestamp: string;
}

export interface ObservationState {
  observedStars: ObservedStar[];
  customConnections: CustomConnection[];
  observationLogs: ObservationLog[];
  selectedConstellation: string | null;
}

const starNames = [
  '天狼星', '老人星', '南门二', '大角星', '织女星',
  '五车二', '参宿七', '南河三', '参宿四', '水委一',
  '马腹一', '河鼓二', '毕宿五', '北河三', '角宿一',
  '心宿二', '北落师门', '天津四', '轩辕十四', '北河二',
  '北天极', '天枢', '天璇', '天玑', '天权',
  '玉衡', '开阳', '摇光', '王良四', '王良一',
  '策', '王良二', '王良三', '觜宿一', '参宿五',
  '参宿三', '参宿二', '参宿一', '猎户星云', '渐台二',
  '渐台三', '渐台一', '辇道增七', '天津一', '天津二',
  '天津九', '辇道增五', '天市左垣六', '天市右垣七', '女床一',
  '天津八', '天津五', '天鹅座β', '天琴座κ', '渐台四',
  '辇道一', '辇道二', '辇道三', '辇道四', '天津六',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateStars(count: number = 60, canvasWidth: number = 800, canvasHeight: number = 600): Star[] {
  const random = seededRandom(42);
  const stars: Star[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count && i < starNames.length; i++) {
    const x = 50 + random() * (canvasWidth - 100);
    const y = 50 + random() * (canvasHeight - 100);
    const baseSize = 0.8 + random() * 3.5;
    const baseBrightness = 0.5 + random() * 0.5;
    const twinkleSpeed = 0.3 + random() * 0.7;
    const twinkleOffset = random() * Math.PI * 2;

    const colorTone = random();
    let color = '#FFFFFF';
    if (colorTone < 0.15) {
      color = '#FFF4E0';
    } else if (colorTone < 0.3) {
      color = '#FFE8C0';
    } else if (colorTone < 0.4) {
      color = '#E0F0FF';
    }

    stars.push({
      id: `star-${i}`,
      name: starNames[i],
      x,
      y,
      baseSize,
      baseBrightness,
      twinkleSpeed,
      twinkleOffset,
      color,
    });
    usedNames.add(starNames[i]);
  }

  return stars;
}

export function getStarByName(stars: Star[], name: string): Star | undefined {
  return stars.find((s) => s.name === name);
}

export function getStarById(stars: Star[], id: string): Star | undefined {
  return stars.find((s) => s.id === id);
}
