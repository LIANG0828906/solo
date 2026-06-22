import { create } from 'zustand';
import type {
  StoryProject,
  Act,
  Scene,
  Paragraph,
  Annotation,
  Contributor,
} from '../types';

interface StoryState {
  project: StoryProject;
  searchQuery: string;
  setProject: (project: StoryProject) => void;
  addAct: (act: Omit<Act, 'id' | 'scenes' | 'order'>) => void;
  updateAct: (actId: string, data: Partial<Act>) => void;
  removeAct: (actId: string) => void;
  addScene: (actId: string, scene: Omit<Scene, 'id' | 'paragraphs' | 'annotations' | 'order'>) => void;
  updateScene: (actId: string, sceneId: string, data: Partial<Scene>) => void;
  removeScene: (actId: string, sceneId: string) => void;
  addParagraph: (actId: string, sceneId: string, content: string, authorId: string) => void;
  addAnnotation: (actId: string, sceneId: string, content: string, authorId: string) => void;
  addContributor: (contributor: Omit<Contributor, 'id'>) => void;
  setSearchQuery: (query: string) => void;
}

const avatarColors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];

const generateId = () => Math.random().toString(36).slice(2, 10);

const defaultContributors: Contributor[] = [
  { id: 'user-1', name: '张编剧', avatarColor: '#E74C3C' },
  { id: 'user-2', name: '李导演', avatarColor: '#3498DB' },
  { id: 'user-3', name: '王策划', avatarColor: '#2ECC71' },
];

const defaultProject: StoryProject = {
  id: 'project-1',
  title: '星际迷航：未知边境',
  description: '一个关于探索未知宇宙的科幻故事',
  contributors: defaultContributors,
  acts: [
    {
      id: 'act-1',
      title: '第一幕：启程',
      description: '船员们踏上探索之旅',
      order: 0,
      scenes: [
        {
          id: 'scene-1',
          title: '场景一：告别母星',
          description: '飞船从地球出发',
          ownerId: 'user-1',
          order: 0,
          paragraphs: [
            {
              id: 'p-1',
              content: '巨大的星际飞船"探索者号"缓缓驶离地球轨道，船长艾琳站在舰桥窗前，望着逐渐远去的蓝色星球。她知道，这一去可能就是一生。',
              authorId: 'user-1',
              createdAt: Date.now() - 86400000,
            },
            {
              id: 'p-2',
              content: '大副马克走到艾琳身边，递给他一杯咖啡。"船长，船员都已就位，跃迁引擎准备就绪。"艾琳点点头，目光依然凝视着远方。',
              authorId: 'user-2',
              createdAt: Date.now() - 72000000,
            },
          ],
          annotations: [
            {
              id: 'a-1',
              content: '这里需要更强烈的情感冲突',
              authorId: 'user-3',
              createdAt: Date.now() - 3600000,
            },
          ],
        },
        {
          id: 'scene-2',
          title: '场景二：神秘信号',
          description: '接收到不明信号',
          ownerId: 'user-2',
          order: 1,
          paragraphs: [
            {
              id: 'p-3',
              content: '航行的第三天，通讯官苏菲突然报告接收到一段有规律的神秘信号。信号来自一个未被标记的星域，所有人都紧张起来。',
              authorId: 'user-2',
              createdAt: Date.now() - 54000000,
            },
          ],
          annotations: [],
        },
      ],
    },
    {
      id: 'act-2',
      title: '第二幕：发现',
      description: '发现外星文明遗迹',
      order: 1,
      scenes: [
        {
          id: 'scene-3',
          title: '场景一：废弃空间站',
          description: '探索废弃的外星空间站',
          ownerId: 'user-1',
          order: 0,
          paragraphs: [
            {
              id: 'p-4',
              content: '探索者号抵达信号源，发现一座巨大的废弃空间站漂浮在黑暗中。艾琳和马克带领探索小队进入站内，苏菲留守飞船监测。',
              authorId: 'user-1',
              createdAt: Date.now() - 43200000,
            },
            {
              id: 'p-5',
              content: '空间站内部保存完好，仿佛主人们只是刚刚离开。墙上的壁画描绘着一个古老文明的兴衰，马克感到一阵不安。',
              authorId: 'user-3',
              createdAt: Date.now() - 21600000,
            },
          ],
          annotations: [
            {
              id: 'a-2',
              content: '苏菲和艾琳的关系可以更复杂一些',
              authorId: 'user-2',
              createdAt: Date.now() - 10800000,
            },
          ],
        },
      ],
    },
  ],
};

export const useStoryStore = create<StoryState>((set, get) => ({
  project: defaultProject,
  searchQuery: '',

  setProject: (project) => set({ project }),

  addAct: (act) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: [
          ...state.project.acts,
          { ...act, id: generateId(), scenes: [], order: state.project.acts.length },
        ],
      },
    })),

  updateAct: (actId, data) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.map((act) =>
          act.id === actId ? { ...act, ...data } : act
        ),
      },
    })),

  removeAct: (actId) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.filter((act) => act.id !== actId),
      },
    })),

  addScene: (actId, scene) =>
    set((state) => {
      const act = state.project.acts.find((a) => a.id === actId);
      if (!act) return state;
      return {
        project: {
          ...state.project,
          acts: state.project.acts.map((a) =>
            a.id === actId
              ? {
                  ...a,
                  scenes: [
                    ...a.scenes,
                    { ...scene, id: generateId(), paragraphs: [], annotations: [], order: a.scenes.length },
                  ],
                }
              : a
          ),
        },
      };
    }),

  updateScene: (actId, sceneId, data) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.map((act) =>
          act.id === actId
            ? {
                ...act,
                scenes: act.scenes.map((scene) =>
                  scene.id === sceneId ? { ...scene, ...data } : scene
                ),
              }
            : act
        ),
      },
    })),

  removeScene: (actId, sceneId) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.map((act) =>
          act.id === actId
            ? { ...act, scenes: act.scenes.filter((s) => s.id !== sceneId) }
            : act
        ),
      },
    })),

  addParagraph: (actId, sceneId, content, authorId) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.map((act) =>
          act.id === actId
            ? {
                ...act,
                scenes: act.scenes.map((scene) =>
                  scene.id === sceneId
                    ? {
                        ...scene,
                        paragraphs: [
                          ...scene.paragraphs,
                          {
                            id: generateId(),
                            content: content.slice(0, 500),
                            authorId,
                            createdAt: Date.now(),
                          },
                        ],
                      }
                    : scene
                ),
              }
            : act
        ),
      },
    })),

  addAnnotation: (actId, sceneId, content, authorId) =>
    set((state) => ({
      project: {
        ...state.project,
        acts: state.project.acts.map((act) =>
          act.id === actId
            ? {
                ...act,
                scenes: act.scenes.map((scene) =>
                  scene.id === sceneId
                    ? {
                        ...scene,
                        annotations: [
                          ...scene.annotations,
                          {
                            id: generateId(),
                            content: content.slice(0, 150),
                            authorId,
                            createdAt: Date.now(),
                          },
                        ],
                      }
                    : scene
                ),
              }
            : act
        ),
      },
    })),

  addContributor: (contributor) =>
    set((state) => ({
      project: {
        ...state.project,
        contributors: [
          ...state.project.contributors,
          { ...contributor, id: generateId() },
        ],
      },
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
