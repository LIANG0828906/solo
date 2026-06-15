import type { Rubbing, Point, CharacterStroke } from '../types';

const generateStrokePoints = (segments: { x: number; y: number }[]): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const start = segments[i];
    const end = segments[i + 1];
    const steps = 20;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        pressure: 0.5 + 0.3 * Math.sin(t * Math.PI)
      });
    }
  }
  return points;
};

const createStroke = (
  id: number,
  name: string,
  segments: { x: number; y: number }[],
  wStart: number,
  wMid: number,
  wEnd: number
): CharacterStroke => ({
  id,
  name,
  points: generateStrokePoints(segments),
  widthStart: wStart,
  widthMid: wMid,
  widthEnd: wEnd
});

const createCharacter = (char: string, strokes: CharacterStroke[]) => ({
  char,
  strokes
});

const yongStrokes: CharacterStroke[] = [
  createStroke(1, '点', [{ x: 200, y: 80 }, { x: 220, y: 100 }, { x: 210, y: 130 }], 8, 16, 10),
  createStroke(2, '横', [{ x: 100, y: 150 }, { x: 200, y: 140 }, { x: 300, y: 150 }], 10, 6, 14),
  createStroke(3, '竖', [{ x: 200, y: 140 }, { x: 200, y: 240 }, { x: 200, y: 320 }], 12, 10, 14),
  createStroke(4, '撇', [{ x: 200, y: 170 }, { x: 160, y: 220 }, { x: 110, y: 280 }], 14, 10, 6),
  createStroke(5, '捺', [{ x: 200, y: 170 }, { x: 250, y: 230 }, { x: 310, y: 290 }], 10, 14, 18),
  createStroke(6, '提', [{ x: 200, y: 320 }, { x: 180, y: 360 }, { x: 140, y: 380 }], 12, 8, 4),
  createStroke(7, '钩', [{ x: 200, y: 320 }, { x: 230, y: 350 }, { x: 270, y: 370 }], 12, 10, 6),
  createStroke(8, '短撇', [{ x: 170, y: 230 }, { x: 150, y: 260 }, { x: 130, y: 280 }], 8, 6, 4)
];

const tianStrokes: CharacterStroke[] = [
  createStroke(1, '竖', [{ x: 120, y: 80 }, { x: 120, y: 200 }, { x: 120, y: 320 }], 12, 10, 12),
  createStroke(2, '横折', [{ x: 120, y: 80 }, { x: 280, y: 80 }, { x: 280, y: 200 }, { x: 280, y: 320 }], 10, 8, 14),
  createStroke(3, '横', [{ x: 120, y: 200 }, { x: 200, y: 195 }, { x: 280, y: 200 }], 8, 6, 10),
  createStroke(4, '竖', [{ x: 200, y: 80 }, { x: 200, y: 200 }, { x: 200, y: 320 }], 10, 8, 12),
  createStroke(5, '横', [{ x: 120, y: 320 }, { x: 200, y: 315 }, { x: 280, y: 320 }], 12, 10, 14)
];

const renStrokes: CharacterStroke[] = [
  createStroke(1, '撇', [{ x: 220, y: 60 }, { x: 180, y: 180 }, { x: 100, y: 340 }], 16, 10, 6),
  createStroke(2, '捺', [{ x: 190, y: 150 }, { x: 250, y: 230 }, { x: 320, y: 340 }], 10, 14, 20)
];

const daStrokes: CharacterStroke[] = [
  createStroke(1, '横', [{ x: 80, y: 140 }, { x: 200, y: 130 }, { x: 320, y: 140 }], 10, 6, 14),
  createStroke(2, '撇', [{ x: 200, y: 130 }, { x: 150, y: 220 }, { x: 80, y: 340 }], 14, 10, 6),
  createStroke(3, '捺', [{ x: 200, y: 130 }, { x: 260, y: 220 }, { x: 340, y: 340 }], 10, 14, 20)
];

const zhongStrokes: CharacterStroke[] = [
  createStroke(1, '竖', [{ x: 200, y: 50 }, { x: 200, y: 200 }, { x: 200, y: 360 }], 14, 12, 16),
  createStroke(2, '横折', [{ x: 100, y: 120 }, { x: 300, y: 120 }, { x: 300, y: 200 }, { x: 300, y: 290 }], 10, 8, 12),
  createStroke(3, '横', [{ x: 100, y: 120 }, { x: 200, y: 115 }, { x: 300, y: 120 }], 10, 6, 12),
  createStroke(4, '竖', [{ x: 100, y: 120 }, { x: 100, y: 200 }, { x: 100, y: 290 }], 10, 8, 12),
  createStroke(5, '横', [{ x: 100, y: 290 }, { x: 200, y: 285 }, { x: 300, y: 290 }], 12, 10, 14)
];

export const rubbings: Rubbing[] = [
  {
    id: 'lanting',
    name: '兰亭序',
    dynasty: '东晋',
    author: '王羲之',
    year: '公元353年',
    thumbnail: 'lanting',
    description: '天下第一行书，王羲之代表作，飘逸遒劲',
    characters: [
      createCharacter('永', yongStrokes),
      createCharacter('天', tianStrokes),
      createCharacter('人', renStrokes),
      createCharacter('大', daStrokes),
      createCharacter('中', zhongStrokes)
    ]
  },
  {
    id: 'jiuchenggong',
    name: '九成宫醴泉铭',
    dynasty: '唐',
    author: '欧阳询',
    year: '公元632年',
    thumbnail: 'jiuchenggong',
    description: '楷书极则，欧体代表，险峻严谨',
    characters: [
      createCharacter('永', yongStrokes),
      createCharacter('天', tianStrokes),
      createCharacter('人', renStrokes),
      createCharacter('大', daStrokes),
      createCharacter('中', zhongStrokes)
    ]
  },
  {
    id: 'duota',
    name: '多宝塔碑',
    dynasty: '唐',
    author: '颜真卿',
    year: '公元752年',
    thumbnail: 'duota',
    description: '颜体楷书，端庄雄伟，气势开张',
    characters: [
      createCharacter('永', yongStrokes),
      createCharacter('天', tianStrokes),
      createCharacter('人', renStrokes),
      createCharacter('大', daStrokes),
      createCharacter('中', zhongStrokes)
    ]
  },
  {
    id: 'xuanmita',
    name: '玄秘塔碑',
    dynasty: '唐',
    author: '柳公权',
    year: '公元841年',
    thumbnail: 'xuanmita',
    description: '柳体楷书，骨力遒劲，结体严紧',
    characters: [
      createCharacter('永', yongStrokes),
      createCharacter('天', tianStrokes),
      createCharacter('人', renStrokes),
      createCharacter('大', daStrokes),
      createCharacter('中', zhongStrokes)
    ]
  },
  {
    id: 'husushiye',
    name: '寒食帖',
    dynasty: '宋',
    author: '苏轼',
    year: '公元1082年',
    thumbnail: 'husushiye',
    description: '天下第三行书，情感跌宕，奔放洒脱',
    characters: [
      createCharacter('永', yongStrokes),
      createCharacter('天', tianStrokes),
      createCharacter('人', renStrokes),
      createCharacter('大', daStrokes),
      createCharacter('中', zhongStrokes)
    ]
  }
];
