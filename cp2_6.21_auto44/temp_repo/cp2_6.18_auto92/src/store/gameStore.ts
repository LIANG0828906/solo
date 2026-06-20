import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  isTwinkling: boolean;
  isSelected: boolean;
  isMatched: boolean;
}

export interface Constellation {
  id: string;
  name: string;
  starPositions: { x: number; y: number }[];
  connections: [number, number][];
  story: {
    title: string;
    content: string;
    image: string;
  };
}

export interface UnlockedCard {
  id: string;
  constellationName: string;
  title: string;
  content: string;
  image: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  stars: Star[];
  currentConstellation: Constellation | null;
  selectedStars: string[];
  connectionPath: { x: number; y: number }[];
  trailPath: { x: number; y: number; alpha: number }[];
  score: number;
  displayScore: number;
  combo: number;
  timeRemaining: number;
  unlockedCards: UnlockedCard[];
  isCardModalOpen: boolean;
  currentCard: UnlockedCard | null;
  matchAnimation: boolean;
  matchedStars: string[];
  particles: Particle[];
  isDrawing: boolean;
  mousePos: { x: number; y: number } | null;

  setStars: (stars: Star[]) => void;
  setCurrentConstellation: (constellation: Constellation) => void;
  getConstellationStarIds: () => string[];
  selectStar: (starId: string) => void;
  clearSelection: () => void;
  addConnectionPoint: (x: number, y: number) => void;
  addTrailPoint: (x: number, y: number) => void;
  updateTrail: () => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setDisplayScore: (score: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  decrementTime: () => void;
  setTimeRemaining: (time: number) => void;
  unlockCard: (card: Omit<UnlockedCard, 'id'>) => UnlockedCard;
  openCardModal: (card: UnlockedCard) => void;
  closeCardModal: () => void;
  triggerMatchAnimation: (starIds: string[]) => void;
  clearMatchAnimation: () => void;
  addParticles: (x: number, y: number, count: number) => void;
  updateParticles: () => void;
  setIsDrawing: (drawing: boolean) => void;
  setMousePos: (pos: { x: number; y: number } | null) => void;
  resetGame: () => void;
  twinkleRandomStar: () => void;
}

const CONSTELLATIONS: Constellation[] = [
  {
    id: 'orion',
    name: '猎户座',
    starPositions: [
      { x: 0.3, y: 0.2 },
      { x: 0.35, y: 0.45 },
      { x: 0.45, y: 0.5 },
      { x: 0.55, y: 0.5 },
      { x: 0.65, y: 0.45 },
      { x: 0.7, y: 0.2 },
      { x: 0.5, y: 0.75 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [3, 6]],
    story: {
      title: '猎户座的传说',
      content: '猎户座源于希腊神话中的猎人俄里翁。他是海神波塞冬的儿子， boastful 地声称自己能杀死任何生物。大地女神盖亚听到后大怒，派出一只毒蝎杀死了俄里翁。宙斯将他升上天空成为猎户座，而毒蝎则成为天蝎座，永远在天空中追逐着猎户座。猎户座最醒目的标志是三颗排成一线的腰带星，在冬季的夜空中格外明亮。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=orion%20constellation%20greek%20mythology%20hunter%20with%20bow%20and%20arrow%20starry%20sky%20purple%20blue%20golden%20light&image_size=portrait_4_3',
    },
  },
  {
    id: 'ursa_major',
    name: '大熊座',
    starPositions: [
      { x: 0.25, y: 0.35 },
      { x: 0.35, y: 0.3 },
      { x: 0.45, y: 0.35 },
      { x: 0.55, y: 0.4 },
      { x: 0.6, y: 0.55 },
      { x: 0.5, y: 0.65 },
      { x: 0.35, y: 0.6 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2], [3, 6]],
    story: {
      title: '大熊座与北斗七星',
      content: '大熊座的故事与宙斯的情人卡利斯托有关。赫拉发现了宙斯与卡利斯托的私情，嫉妒地将卡利斯托变成了一只熊。多年后，卡利斯托的儿子阿尔卡斯在打猎时差点杀死了自己的母亲。宙斯为了保护他们，将母子二人升上天空，卡利斯托成为大熊座，阿尔卡斯成为小熊座。大熊座的尾巴就是著名的北斗七星，它是北半球最容易辨认的星群。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ursa%20major%20great%20bear%20constellation%20big%20dipper%20starry%20night%20sky%20ethereal%20purple%20blue&image_size=portrait_4_3',
    },
  },
  {
    id: 'cassiopeia',
    name: '仙后座',
    starPositions: [
      { x: 0.3, y: 0.3 },
      { x: 0.4, y: 0.45 },
      { x: 0.5, y: 0.35 },
      { x: 0.6, y: 0.45 },
      { x: 0.7, y: 0.3 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    story: {
      title: '虚荣的王后仙后座',
      content: '仙后座是埃塞俄比亚王后卡西欧佩亚的化身。她因虚荣而吹嘘自己和女儿安德洛墨达比海神涅柔斯的女儿们更美丽，这激怒了海神波塞冬。为了平息海神的愤怒，国王被迫将女儿安德洛墨达绑在岩石上献祭给海怪。幸好珀尔修斯及时出现拯救了公主。作为惩罚，波塞冬将卡西欧佩亚钉在椅子上，永远在天空中旋转，让她时而头朝下倒立，以此羞辱她。仙后座的五颗星星组成了独特的W或M形状。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cassiopeia%20constellation%20queen%20on%20throne%20starry%20sky%20W%20shape%20purple%20blue%20cosmic&image_size=portrait_4_3',
    },
  },
  {
    id: 'leo',
    name: '狮子座',
    starPositions: [
      { x: 0.25, y: 0.4 },
      { x: 0.35, y: 0.35 },
      { x: 0.45, y: 0.4 },
      { x: 0.55, y: 0.5 },
      { x: 0.65, y: 0.55 },
      { x: 0.7, y: 0.45 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 4]],
    story: {
      title: '狮子座与赫拉克勒斯',
      content: '狮子座代表的是涅墨亚狮子，这是希腊神话中赫拉克勒斯十二项任务的第一项。这头狮子拥有刀枪不入的金色皮毛，凶猛无比，祸害人间。赫拉克勒斯与狮子搏斗了整整一天，最终用双手勒死了狮子。为了纪念这次伟大的胜利，宙斯将狮子升上天空成为狮子座。狮子座最亮的星是轩辕十四（Regulus），它是狮子的心脏，也是天空中最亮的恒星之一。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leo%20constellation%20majestic%20lion%20golden%20mane%20starry%20sky%20greek%20mythology%20purple%20blue&image_size=portrait_4_3',
    },
  },
  {
    id: 'scorpius',
    name: '天蝎座',
    starPositions: [
      { x: 0.6, y: 0.25 },
      { x: 0.55, y: 0.35 },
      { x: 0.5, y: 0.45 },
      { x: 0.45, y: 0.55 },
      { x: 0.4, y: 0.6 },
      { x: 0.35, y: 0.65 },
      { x: 0.3, y: 0.7 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    story: {
      title: '天蝎座与猎户座的永恒追逐',
      content: '天蝎座是大地女神盖亚派去杀死猎人俄里翁的毒蝎。俄里翁曾吹嘘自己能杀死任何生物，盖亚为了惩罚他的傲慢，派出了这只巨大的毒蝎。毒蝎成功地杀死了俄里翁，但自己也受了重伤。宙斯将两者都升上天空，成为了猎户座和天蝎座。但为了防止他们继续争斗，宙斯将他们放在天空的两端，永远无法相见。当天蝎座从东方升起时，猎户座就会从西方落下，这场永恒的追逐在夜空中持续了千万年。天蝎座的心宿二（Antares）是一颗红超巨星，呈现出火红的颜色，如同毒蝎的心脏。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scorpius%20constellation%20giant%20scorpion%20red%20star%20antares%20starry%20night%20sky%20cosmic%20purple&image_size=portrait_4_3',
    },
  },
];

const generateStars = (constellation: Constellation, width: number, height: number): Star[] => {
  const stars: Star[] = [];
  const constellationStars: Star[] = constellation.starPositions.map((pos) => ({
    id: uuidv4(),
    x: pos.x * width + (Math.random() - 0.5) * 30,
    y: pos.y * height + (Math.random() - 0.5) * 30,
    size: 2.5 + Math.random() * 2,
    brightness: 0.8 + Math.random() * 0.2,
    isTwinkling: false,
    isSelected: false,
    isMatched: false,
  }));
  stars.push(...constellationStars);
  const extraStarsCount = Math.min(60 - constellationStars.length, 50);
  for (let i = 0; i < extraStarsCount; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = Math.random() * (width - 100) + 50;
      y = Math.random() * (height - 100) + 50;
      attempts++;
    } while (
      attempts < 50 &&
      stars.some((s) => Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2) < 40)
    );
    stars.push({
      id: uuidv4(),
      x,
      y,
      size: 1 + Math.random() * 2,
      brightness: 0.4 + Math.random() * 0.4,
      isTwinkling: false,
      isSelected: false,
      isMatched: false,
    });
  }
  return stars;
};

const getNextConstellation = (unlockedIds: string[]): Constellation | null => {
  const available = CONSTELLATIONS.filter((c) => !unlockedIds.includes(c.id));
  if (available.length === 0) return CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
  return available[Math.floor(Math.random() * available.length)];
};

export const useGameStore = create<GameState>((set, get) => ({
  stars: [],
  currentConstellation: null,
  selectedStars: [],
  connectionPath: [],
  trailPath: [],
  score: 0,
  displayScore: 0,
  combo: 0,
  timeRemaining: 180,
  unlockedCards: [],
  isCardModalOpen: false,
  currentCard: null,
  matchAnimation: false,
  matchedStars: [],
  particles: [],
  isDrawing: false,
  mousePos: null,

  setStars: (stars) => set({ stars }),

  getConstellationStarIds: () => {
    const state = get();
    if (!state.currentConstellation) return [];
    return state.stars
      .slice(0, state.currentConstellation.starPositions.length)
      .map((s) => s.id);
  },

  setCurrentConstellation: (constellation) => {
    const canvasWidth = window.innerWidth - 260;
    const canvasHeight = window.innerHeight;
    const stars = generateStars(constellation, canvasWidth, canvasHeight);
    set({
      currentConstellation: constellation,
      stars,
      selectedStars: [],
      connectionPath: [],
      trailPath: [],
      matchedStars: [],
    });
  },

  selectStar: (starId) => {
    const state = get();
    if (state.selectedStars.includes(starId)) return;
    const star = state.stars.find((s) => s.id === starId);
    if (!star) return;
    const newSelectedStars = [...state.selectedStars, starId];
    const newConnectionPath = [...state.connectionPath, { x: star.x, y: star.y }];
    set({
      selectedStars: newSelectedStars,
      connectionPath: newConnectionPath,
      stars: state.stars.map((s) =>
        s.id === starId ? { ...s, isSelected: true } : s
      ),
    });
  },

  clearSelection: () =>
    set((state) => ({
      selectedStars: [],
      connectionPath: [],
      trailPath: [],
      stars: state.stars.map((s) => ({ ...s, isSelected: false })),
    })),

  addConnectionPoint: (x, y) =>
    set((state) => ({
      connectionPath: [...state.connectionPath, { x, y }],
    })),

  addTrailPoint: (x, y) =>
    set((state) => ({
      trailPath: [...state.trailPath.slice(-20), { x, y, alpha: 1 }],
    })),

  updateTrail: () =>
    set((state) => ({
      trailPath: state.trailPath
        .map((t) => ({ ...t, alpha: t.alpha - 0.05 }))
        .filter((t) => t.alpha > 0),
    })),

  setScore: (score) => set({ score }),

  addScore: (points) => {
    const state = get();
    const multiplier = 1 + state.combo * 0.2;
    const finalPoints = Math.floor(points * multiplier);
    set({ score: state.score + finalPoints });
  },

  setDisplayScore: (score) => set({ displayScore: score }),

  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),

  resetCombo: () => set({ combo: 0 }),

  decrementTime: () => set((state) => ({ timeRemaining: state.timeRemaining - 1 })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  unlockCard: (card) => {
    const newCard: UnlockedCard = { ...card, id: uuidv4() };
    set((state) => ({
      unlockedCards: [...state.unlockedCards, newCard],
    }));
    return newCard as UnlockedCard;
  },

  openCardModal: (card) => set({ isCardModalOpen: true, currentCard: card }),

  closeCardModal: () => {
    const state = get();
    const unlockedIds = state.unlockedCards.map((c) => c.constellationName);
    const nextConstellation = getNextConstellation(unlockedIds);
    if (nextConstellation) {
      const canvasWidth = window.innerWidth - 260;
      const canvasHeight = window.innerHeight;
      const stars = generateStars(nextConstellation, canvasWidth, canvasHeight);
      set({
        isCardModalOpen: false,
        currentCard: null,
        currentConstellation: nextConstellation,
        stars,
        selectedStars: [],
        connectionPath: [],
        trailPath: [],
        matchedStars: [],
      });
    } else {
      set({ isCardModalOpen: false, currentCard: null });
    }
  },

  triggerMatchAnimation: (starIds) =>
    set((state) => ({
      matchAnimation: true,
      matchedStars: starIds,
      stars: state.stars.map((s) =>
        starIds.includes(s.id) ? { ...s, isMatched: true } : s
      ),
    })),

  clearMatchAnimation: () =>
    set((state) => ({
      matchAnimation: false,
      matchedStars: [],
      stars: state.stars.map((s) => ({ ...s, isMatched: false })),
    })),

  addParticles: (x, y, count) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 30,
        color: Math.random() > 0.5 ? '#00E5FF' : '#FFD700',
        size: 2 + Math.random() * 3,
      });
    }
    set((state) => ({ particles: [...state.particles, ...newParticles] }));
  },

  updateParticles: () =>
    set((state) => ({
      particles: state.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.05,
          life: p.life - 1 / p.maxLife,
        }))
        .filter((p) => p.life > 0),
    })),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  setMousePos: (pos) => set({ mousePos: pos }),

  resetGame: () => {
    const nextConstellation = getNextConstellation([]);
    if (nextConstellation) {
      const canvasWidth = window.innerWidth - 260;
      const canvasHeight = window.innerHeight;
      const stars = generateStars(nextConstellation, canvasWidth, canvasHeight);
      set({
        stars,
        currentConstellation: nextConstellation,
        selectedStars: [],
        connectionPath: [],
        trailPath: [],
        score: 0,
        displayScore: 0,
        combo: 0,
        timeRemaining: 180,
        unlockedCards: [],
        isCardModalOpen: false,
        currentCard: null,
        matchAnimation: false,
        matchedStars: [],
        particles: [],
        isDrawing: false,
        mousePos: null,
      });
    }
  },

  twinkleRandomStar: () =>
    set((state) => {
      if (state.stars.length === 0) return {};
      const randomIndex = Math.floor(Math.random() * state.stars.length);
      return {
        stars: state.stars.map((s, i) => ({
          ...s,
          isTwinkling: i === randomIndex,
        })),
      };
    }),
}));

export { CONSTELLATIONS };
