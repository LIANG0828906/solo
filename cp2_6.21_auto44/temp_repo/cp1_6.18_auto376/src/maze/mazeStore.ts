import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateMaze, MazeData } from './mazeGenerator';

export interface Fragment {
  id: string;
  position: { x: number; y: number };
  text: string;
  storyLine: string;
  order: number;
  prerequisites: string[];
  nextFragments: string[];
  collected: boolean;
}

export interface StoryLine {
  id: string;
  name: string;
  fragments: string[];
  ending: {
    type: 'victory' | 'sorrow' | 'neutral';
    text: string;
  };
  unlocked: boolean;
}

export interface PlayerState {
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number };
  collectedFragments: string[];
}

export interface NarrativeEvent {
  type: 'fragment_collected' | 'ending_unlocked';
  payload: unknown;
  timestamp: number;
}

interface MazeStore {
  maze: MazeData | null;
  fragments: Fragment[];
  storyLines: StoryLine[];
  playerState: PlayerState;
  activeFragment: Fragment | null;
  activeEnding: StoryLine | null;
  narrativeEvents: NarrativeEvent[];
  generateNewMaze: (seed?: number) => void;
  collectFragment: (id: string) => void;
  setPlayerPosition: (pos: PlayerState['position']) => void;
  setPlayerRotation: (rot: PlayerState['rotation']) => void;
  setActiveFragment: (f: Fragment | null) => void;
  checkStoryLineCompletion: () => void;
  triggerEnding: (storyLineId: string) => void;
  resetGame: () => void;
}

const FRAGMENT_TEXTS = {
  awakening: [
    '意识在虚空中苏醒...你还记得自己是谁吗？',
    '眼前闪烁的数据洪流似乎在呼唤某个名字...',
    '一段记忆碎片浮现：一场大雨，一把黑色的伞。',
    '霓虹灯下的小巷，有人在等你。但你记不起是谁。',
    '服务器节点 #0723 发出警告：记忆完整性 37%。',
  ],
  betrayal: [
    '他伸出的手，指尖却沾着你的血。',
    '"这是为了更大的利益。"她的声音在回荡。',
    '信任的代码被恶意改写，系统防火墙从内部崩塌。',
    '那扇门背后，是你最不愿意面对的真相。',
    '数据库记录：最后一次连接来自...你自己的账号。',
  ],
  redemption: [
    '在最深的黑暗中，你找到了那束光。',
    '"一切还来得及。"镜中的自己这样说道。',
    '修复程序启动，被删除的记忆正在重建...',
    '你终于明白，迷宫的出口一直都在心里。',
    '系统重启完成。新世界正在加载...',
  ],
};

function generateFragments(maze: MazeData): Fragment[] {
  const fragments: Fragment[] = [];
  const solution = maze.solutionPath;
  if (solution.length < 8) return fragments;

  const stories: Array<{ key: keyof typeof FRAGMENT_TEXTS; name: string; endingType: 'victory' | 'sorrow' | 'neutral'; endingText: string }> = [
    { key: 'awakening', name: '觉醒', endingType: 'neutral', endingText: '你终于记起了自己。记忆迷宫的旅程才刚刚开始...' },
    { key: 'betrayal', name: '背叛', endingType: 'sorrow', endingText: '真相比迷宫更令人迷失。但伤痛让你变得更加强大。' },
    { key: 'redemption', name: '救赎', endingType: 'victory', endingText: '恭喜你！你穿越了所有迷雾，找到了真正的自我。记忆完整度 100%。' },
  ];

  const step = Math.floor(solution.length / 16);
  let idx = 1;

  const storyLineIds: Record<string, string[]> = {};

  for (const story of stories) {
    const ids: string[] = [];
    const texts = FRAGMENT_TEXTS[story.key];
    for (let i = 0; i < texts.length; i++) {
      const posIdx = Math.min(idx * step + i, solution.length - 2);
      const pos = solution[posIdx];
      const id = uuidv4();
      ids.push(id);
      fragments.push({
        id,
        position: { x: pos.x, y: pos.y },
        text: texts[i],
        storyLine: story.name,
        order: i,
        prerequisites: i === 0 ? [] : [ids[i - 1]],
        nextFragments: i === texts.length - 1 ? [] : [],
        collected: false,
      });
      idx++;
    }
    storyLineIds[story.name] = ids;
  }

  for (const f of fragments) {
    const allIds = storyLineIds[f.storyLine];
    const currentIdx = allIds.indexOf(f.id);
    if (currentIdx < allIds.length - 1) {
      f.nextFragments = [allIds[currentIdx + 1]];
    }
  }

  return fragments;
}

function generateStoryLines(fragments: Fragment[]): StoryLine[] {
  const map: Record<string, Fragment[]> = {};
  for (const f of fragments) {
    if (!map[f.storyLine]) map[f.storyLine] = [];
    map[f.storyLine].push(f);
  }

  const endings: Record<string, { type: 'victory' | 'sorrow' | 'neutral'; text: string }> = {
    '觉醒': { type: 'neutral', text: '你终于记起了自己。记忆迷宫的旅程才刚刚开始...' },
    '背叛': { type: 'sorrow', text: '真相比迷宫更令人迷失。但伤痛让你变得更加强大。' },
    '救赎': { type: 'victory', text: '恭喜你！你穿越了所有迷雾，找到了真正的自我。记忆完整度 100%。' },
  };

  const lines: StoryLine[] = [];
  for (const name of Object.keys(map)) {
    const sorted = map[name].sort((a, b) => a.order - b.order);
    lines.push({
      id: uuidv4(),
      name,
      fragments: sorted.map(f => f.id),
      ending: endings[name] ?? { type: 'neutral', text: '故事结束。' },
      unlocked: false,
    });
  }
  return lines;
}

const initialPlayerState: PlayerState = {
  position: { x: 0, y: 0.5, z: 0 },
  rotation: { yaw: 0, pitch: 0 },
  collectedFragments: [],
};

export const useMazeStore = create<MazeStore>((set, get) => ({
  maze: null,
  fragments: [],
  storyLines: [],
  playerState: initialPlayerState,
  activeFragment: null,
  activeEnding: null,
  narrativeEvents: [],

  generateNewMaze: (seed) => {
    const maze = generateMaze(11, 11, seed);
    const fragments = generateFragments(maze);
    const storyLines = generateStoryLines(fragments);
    set({
      maze,
      fragments,
      storyLines,
      playerState: { ...initialPlayerState },
      activeFragment: null,
      activeEnding: null,
      narrativeEvents: [],
    });
  },

  collectFragment: (id) => {
    const state = get();
    const fragment = state.fragments.find(f => f.id === id);
    if (!fragment || fragment.collected) return;

    const newFragments = state.fragments.map(f =>
      f.id === id ? { ...f, collected: true } : f
    );
    const newCollected = [...state.playerState.collectedFragments, id];
    const event: NarrativeEvent = {
      type: 'fragment_collected',
      payload: { fragmentId: id, storyLine: fragment.storyLine },
      timestamp: Date.now(),
    };

    set({
      fragments: newFragments,
      playerState: { ...state.playerState, collectedFragments: newCollected },
      narrativeEvents: [...state.narrativeEvents, event],
    });

    get().checkStoryLineCompletion();
  },

  setPlayerPosition: (pos) => {
    set(state => ({
      playerState: { ...state.playerState, position: pos },
    }));
  },

  setPlayerRotation: (rot) => {
    set(state => ({
      playerState: { ...state.playerState, rotation: rot },
    }));
  },

  setActiveFragment: (f) => {
    set({ activeFragment: f });
  },

  checkStoryLineCompletion: () => {
    const state = get();
    const updatedLines = state.storyLines.map(line => {
      const allCollected = line.fragments.every(id =>
        state.playerState.collectedFragments.includes(id)
      );
      if (allCollected && !line.unlocked) {
        const event: NarrativeEvent = {
          type: 'ending_unlocked',
          payload: { storyLineId: line.id, storyLineName: line.name },
          timestamp: Date.now(),
        };
        set(s => ({ narrativeEvents: [...s.narrativeEvents, event] }));
        return { ...line, unlocked: true };
      }
      return line;
    });
    set({ storyLines: updatedLines });
  },

  triggerEnding: (storyLineId) => {
    const line = get().storyLines.find(l => l.id === storyLineId);
    if (line && line.unlocked) {
      set({ activeEnding: line });
    }
  },

  resetGame: () => {
    get().generateNewMaze();
  },
}));
