import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Choice {
  label: string;
  nextSceneId: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  choices: [Choice, Choice];
}

export interface VoteData {
  optionA: number;
  optionB: number;
}

export interface PathEntry {
  sceneId: string;
  selectedChoice: 'A' | 'B' | null;
}

interface SceneState {
  scenes: Scene[];
  currentSceneIndex: number;
  votes: Record<string, VoteData>;
  path: PathEntry[];
  userId: string;
  setCurrentSceneIndex: (index: number) => void;
  selectChoice: (sceneId: string, choice: 'A' | 'B') => void;
  jumpToScene: (index: number) => void;
  refreshVotes: (sceneId: string) => void;
}

const SCENES: Scene[] = [
  {
    id: 'scene-1',
    title: '迷雾之夜',
    description:
      '大雨倾盆的深夜，你独自驾车行驶在荒无人烟的山路上。前方突然出现一个模糊的人影，雨刮器疯狂摆动却看不清对方的脸。你的心跳加速，方向盘微微颤抖……',
    choices: [
      { label: '停下车查看', nextSceneId: 'scene-2' },
      { label: '加速驶离', nextSceneId: 'scene-3' },
    ],
  },
  {
    id: 'scene-2',
    title: '路边的陌生人',
    description:
      '你缓缓停下车，雨幕中走出一个穿着旧风衣的老人。他的眼神深邃而平静，仿佛等待你已久。"你有两个选择，"他低声说道，"一个通向真相，一个通向安宁。"',
    choices: [
      { label: '选择真相', nextSceneId: 'scene-4' },
      { label: '选择安宁', nextSceneId: 'scene-5' },
    ],
  },
  {
    id: 'scene-3',
    title: '逃离之路',
    description:
      '你踩下油门冲过人影，后视镜里一切消失不见。然而前方道路开始分岔——左边是通往小镇的平坦公路，右边是深入森林的蜿蜒小径，远处传来若有若无的求救声。',
    choices: [
      { label: '驶向小镇', nextSceneId: 'scene-4' },
      { label: '进入森林', nextSceneId: 'scene-5' },
    ],
  },
  {
    id: 'scene-4',
    title: '真相浮现',
    description:
      '你终于来到了一座废弃的庄园前。大门半开，门厅的壁灯在风中摇曳。桌上放着一本日记，泛黄的纸页记录着一段被遗忘的往事——关于这个小镇，关于那场消失的实验……',
    choices: [
      { label: '翻开日记', nextSceneId: 'scene-1' },
      { label: '深入庄园', nextSceneId: 'scene-2' },
    ],
  },
  {
    id: 'scene-5',
    title: '最终的抉择',
    description:
      '你站在悬崖边缘，海风呼啸。身后的追兵越来越近，面前是无尽的深渊。你口袋里的手机亮了——一条来自未知号码的短信："跳下去，你会找到答案。"',
    choices: [
      { label: '纵身跃下', nextSceneId: 'scene-3' },
      { label: '转身面对', nextSceneId: 'scene-4' },
    ],
  },
];

function generateInitialVotes(): Record<string, VoteData> {
  const votes: Record<string, VoteData> = {};
  for (const scene of SCENES) {
    votes[scene.id] = {
      optionA: Math.floor(Math.random() * 5) + 1,
      optionB: Math.floor(Math.random() * 5) + 1,
    };
  }
  return votes;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: SCENES,
  currentSceneIndex: 0,
  votes: generateInitialVotes(),
  path: SCENES.map((s) => ({ sceneId: s.id, selectedChoice: null })),
  userId: uuidv4(),

  setCurrentSceneIndex: (index: number) => {
    set({ currentSceneIndex: index });
  },

  selectChoice: (sceneId: string, choice: 'A' | 'B') => {
    const state = get();
    const sceneIndex = state.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex === -1) return;

    const scene = state.scenes[sceneIndex];
    const nextSceneId = choice === 'A' ? scene.choices[0].nextSceneId : scene.choices[1].nextSceneId;
    const nextIndex = state.scenes.findIndex((s) => s.id === nextSceneId);

    const newPath = [...state.path];
    newPath[sceneIndex] = { sceneId, selectedChoice: choice };

    set({
      currentSceneIndex: nextIndex !== -1 ? nextIndex : sceneIndex,
      path: newPath,
    });
  },

  jumpToScene: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.scenes.length) return;
    set({ currentSceneIndex: index });
  },

  refreshVotes: (sceneId: string) => {
    const state = get();
    const current = state.votes[sceneId] || { optionA: 1, optionB: 1 };
    const deltaA = Math.floor(Math.random() * 3) - 1;
    const deltaB = Math.floor(Math.random() * 3) - 1;
    set({
      votes: {
        ...state.votes,
        [sceneId]: {
          optionA: Math.max(1, current.optionA + deltaA),
          optionB: Math.max(1, current.optionB + deltaB),
        },
      },
    });
  },
}));
