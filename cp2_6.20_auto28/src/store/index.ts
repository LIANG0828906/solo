import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  StoryNode,
  StoryEdge,
  Character,
  CharacterRelation,
  CollaboratorCursor,
  StoryVersion,
  SimulationResult,
  RightPanelTab,
  User,
  BranchCondition,
  VersionDiff,
  Dialogue,
} from '@/types';

interface EditorHistory {
  nodes: StoryNode[];
  edges: StoryEdge[];
  characters: Character[];
  relations: CharacterRelation[];
}

interface EditorState {
  storyId: string;
  storyTitle: string;
  nodes: StoryNode[];
  edges: StoryEdge[];
  characters: Character[];
  relations: CharacterRelation[];
  versions: StoryVersion[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  collaborators: CollaboratorCursor[];
  currentUser: User;
  rightPanelTab: RightPanelTab;

  simulationRunning: boolean;
  simulationCurrentNodeId: string | null;
  simulationPath: string[];
  simulationResult: SimulationResult | null;

  comparingVersionId: string | null;
  versionDiff: VersionDiff | null;

  history: EditorHistory[];
  historyIndex: number;

  wsConnected: boolean;

  setStory: (id: string, title: string) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setWsConnected: (connected: boolean) => void;

  addNode: (position?: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<StoryNode>) => void;
  deleteNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  addDialogue: (nodeId: string, characterId: string, text: string) => void;

  addEdge: (sourceId: string, targetId: string, condition?: BranchCondition) => void;
  updateEdge: (id: string, updates: Partial<StoryEdge>) => void;
  deleteEdge: (id: string) => void;

  addCharacter: (name: string, color: string, avatar: string) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addRelation: (sourceId: string, targetId: string, type: CharacterRelation['type']) => void;
  updateRelation: (id: string, type: CharacterRelation['type']) => void;
  deleteRelation: (id: string) => void;

  updateCollaborator: (cursor: CollaboratorCursor) => void;
  removeCollaborator: (userId: string) => void;

  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  saveVersion: () => void;
  setComparingVersion: (versionId: string | null) => void;
  computeVersionDiff: (versionId: string) => void;

  startSimulation: (startNodeId: string) => void;
  advanceSimulation: (edgeId: string) => void;
  autoSimulate: (startNodeId: string) => void;
  resetSimulation: () => void;
}

const AVATAR_COLORS = ['#e94560', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];

const generateAvatar = (seed: number) => {
  const svgs = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#16213e"/><circle cx="50" cy="38" r="18" fill="#e2e8f0"/><ellipse cx="50" cy="85" rx="30" ry="22" fill="#e2e8f0"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#0f3460"/><path d="M50 20 Q30 20 28 45 Q28 55 40 55 Q42 50 50 50 Q58 50 60 55 Q72 55 72 45 Q70 20 50 20Z" fill="#e2e8f0"/><circle cx="40" cy="40" r="4" fill="#1a1a2e"/><circle cx="60" cy="40" r="4" fill="#1a1a2e"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#16213e"/><circle cx="50" cy="45" r="20" fill="#e2e8f0"/><rect x="35" y="65" width="30" height="18" rx="4" fill="#e2e8f0"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#0f3460"/><path d="M25 45 L50 25 L75 45 L75 70 Q75 85 50 85 Q25 85 25 70 Z" fill="#e2e8f0"/></svg>`,
  ];
  return `data:image/svg+xml;base64,${btoa(svgs[seed % svgs.length])}`;
};

const createMockData = () => {
  const now = Date.now();
  const nodeA: StoryNode = {
    id: 'node-a',
    title: '序章：神秘来信',
    description: '主角在一个阴雨连绵的早晨收到了一封没有署名的信件，信中写着一个古老家族的秘密...',
    dialogues: [
      { id: 'd1', characterId: 'char-1', text: '这封信...是从哪里寄来的？邮戳都模糊不清了。' },
    ],
    position: { x: 100, y: 150 },
    createdAt: now,
    updatedAt: now,
  };

  const nodeB: StoryNode = {
    id: 'node-b',
    title: '前往古堡',
    description: '按照信中的指引，主角来到了郊外的一座废弃古堡，大门缓缓开启...',
    dialogues: [
      { id: 'd2', characterId: 'char-2', text: '欢迎来到我的宅邸，我已经等你很久了。' },
    ],
    position: { x: 500, y: 80 },
    createdAt: now,
    updatedAt: now,
  };

  const nodeC: StoryNode = {
    id: 'node-c',
    title: '求助警方',
    description: '主角认为这可能是个陷阱，决定前往警察局寻求帮助...',
    dialogues: [
      { id: 'd3', characterId: 'char-3', text: '年轻人，这种恶作剧信件我们每周都能收到十几封。' },
    ],
    position: { x: 500, y: 280 },
    createdAt: now,
    updatedAt: now,
  };

  const nodeD: StoryNode = {
    id: 'node-d',
    title: '真相揭露',
    description: '在古堡的地下室里，主角发现了隐藏已久的家族秘密和传说中的宝藏...',
    dialogues: [
      { id: 'd4', characterId: 'char-2', text: '现在，你已经知道了一切，接下来你打算怎么做？' },
    ],
    position: { x: 900, y: 150 },
    createdAt: now,
    updatedAt: now,
  };

  const edges: StoryEdge[] = [
    {
      id: 'edge-1',
      sourceId: 'node-a',
      targetId: 'node-b',
      condition: { type: 'has_item', itemId: 'letter', itemName: '神秘信件' },
      createdAt: now,
    },
    {
      id: 'edge-2',
      sourceId: 'node-a',
      targetId: 'node-c',
      condition: { type: 'read_node', targetNodeId: undefined },
      createdAt: now,
    },
    {
      id: 'edge-3',
      sourceId: 'node-b',
      targetId: 'node-d',
      condition: { type: 'read_node', targetNodeId: 'node-b' },
      createdAt: now,
    },
  ];

  const characters: Character[] = [
    { id: 'char-1', name: '林墨', avatar: generateAvatar(0), color: AVATAR_COLORS[0] },
    { id: 'char-2', name: '神秘老者', avatar: generateAvatar(1), color: AVATAR_COLORS[1] },
    { id: 'char-3', name: '张警官', avatar: generateAvatar(2), color: AVATAR_COLORS[2] },
    { id: 'char-4', name: '苏雅', avatar: generateAvatar(3), color: AVATAR_COLORS[3] },
  ];

  const relations: CharacterRelation[] = [
    { id: 'rel-1', sourceId: 'char-1', targetId: 'char-4', type: 'lover' },
    { id: 'rel-2', sourceId: 'char-1', targetId: 'char-3', type: 'ally' },
    { id: 'rel-3', sourceId: 'char-1', targetId: 'char-2', type: 'unknown' },
    { id: 'rel-4', sourceId: 'char-2', targetId: 'char-3', type: 'enemy' },
  ];

  return {
    nodes: [nodeA, nodeB, nodeC, nodeD],
    edges,
    characters,
    relations,
  };
};

const mockData = createMockData();

const mockVersions: StoryVersion[] = [
  {
    id: 'v1',
    version: 1,
    createdAt: Date.now() - 86400000 * 3,
    creator: { id: 'u1', name: '编剧A', avatar: generateAvatar(0), color: AVATAR_COLORS[0] },
    nodes: [mockData.nodes[0], mockData.nodes[1]],
    edges: [mockData.edges[0]],
    characters: mockData.characters.slice(0, 2),
    relations: [],
  },
  {
    id: 'v2',
    version: 2,
    createdAt: Date.now() - 86400000,
    creator: { id: 'u2', name: '编剧B', avatar: generateAvatar(1), color: AVATAR_COLORS[1] },
    nodes: mockData.nodes.slice(0, 3),
    edges: mockData.edges.slice(0, 2),
    characters: mockData.characters.slice(0, 3),
    relations: mockData.relations.slice(0, 2),
  },
  {
    id: 'v3',
    version: 3,
    createdAt: Date.now() - 3600000,
    creator: { id: 'u1', name: '编剧A', avatar: generateAvatar(0), color: AVATAR_COLORS[0] },
    ...mockData,
  },
];

const initialHistory: EditorHistory = {
  nodes: mockData.nodes,
  edges: mockData.edges,
  characters: mockData.characters,
  relations: mockData.relations,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  storyId: 'story-1',
  storyTitle: '迷雾古堡',
  nodes: mockData.nodes,
  edges: mockData.edges,
  characters: mockData.characters,
  relations: mockData.relations,
  versions: mockVersions,
  selectedNodeId: null,
  selectedEdgeId: null,
  collaborators: [
    { userId: 'u2', userName: '编剧B', color: AVATAR_COLORS[4], x: 450, y: 180 },
    { userId: 'u3', userName: '策划C', color: AVATAR_COLORS[5], x: 720, y: 320 },
  ],
  currentUser: { id: 'u1', name: '编剧A', avatar: generateAvatar(0), color: AVATAR_COLORS[0] },
  rightPanelTab: 'graph',

  simulationRunning: false,
  simulationCurrentNodeId: null,
  simulationPath: [],
  simulationResult: null,

  comparingVersionId: null,
  versionDiff: null,

  history: [initialHistory],
  historyIndex: 0,

  wsConnected: true,

  setStory: (id, title) => set({ storyId: id, storyTitle: title }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setWsConnected: (connected) => set({ wsConnected: connected }),

  saveHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      characters: JSON.parse(JSON.stringify(state.characters)),
      relations: JSON.parse(JSON.stringify(state.relations)),
    });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addNode: (position) => {
    const state = get();
    const now = Date.now();
    const pos = position || {
      x: 200 + Math.random() * 300,
      y: 200 + Math.random() * 200,
    };
    const newNode: StoryNode = {
      id: uuidv4(),
      title: `新剧情节点 ${state.nodes.length + 1}`,
      description: '在这里描述你的剧情场景...',
      dialogues: [],
      position: pos,
      createdAt: now,
      updatedAt: now,
    };
    set({ nodes: [...state.nodes, newNode], selectedNodeId: newNode.id });
    state.saveHistory();
  },

  updateNode: (id, updates) => {
    const state = get();
    set({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } as StoryNode : n
      ),
    });
  },

  deleteNode: (id) => {
    const state = get();
    set({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    });
    state.saveHistory();
  },

  updateNodePosition: (id, x, y) => {
    const state = get();
    set({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position: { x, y } } : n
      ),
    });
  },

  addDialogue: (nodeId, characterId, text) => {
    const state = get();
    const dialogue: Dialogue = { id: uuidv4(), characterId, text };
    set({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, dialogues: [...n.dialogues, dialogue] } : n
      ),
    });
  },

  addEdge: (sourceId, targetId, condition = { type: 'read_node' }) => {
    const state = get();
    if (state.edges.some((e) => e.sourceId === sourceId && e.targetId === targetId)) return;
    const newEdge: StoryEdge = {
      id: uuidv4(),
      sourceId,
      targetId,
      condition,
      createdAt: Date.now(),
    };
    set({ edges: [...state.edges, newEdge] });
    state.saveHistory();
  },

  updateEdge: (id, updates) => {
    const state = get();
    set({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } as StoryEdge : e)),
    });
  },

  deleteEdge: (id) => {
    const state = get();
    set({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    });
    state.saveHistory();
  },

  addCharacter: (name, color, avatar) => {
    const state = get();
    const newChar: Character = { id: uuidv4(), name, color, avatar };
    set({ characters: [...state.characters, newChar] });
    state.saveHistory();
  },

  updateCharacter: (id, updates) => {
    const state = get();
    set({
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } as Character : c)),
    });
  },

  deleteCharacter: (id) => {
    const state = get();
    set({
      characters: state.characters.filter((c) => c.id !== id),
      relations: state.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
    });
    state.saveHistory();
  },

  addRelation: (sourceId, targetId, type) => {
    const state = get();
    if (state.relations.some((r) =>
      (r.sourceId === sourceId && r.targetId === targetId) ||
      (r.sourceId === targetId && r.targetId === sourceId)
    )) return;
    const newRel: CharacterRelation = { id: uuidv4(), sourceId, targetId, type };
    set({ relations: [...state.relations, newRel] });
    state.saveHistory();
  },

  updateRelation: (id, type) => {
    const state = get();
    set({
      relations: state.relations.map((r) => (r.id === id ? { ...r, type } : r)),
    });
  },

  deleteRelation: (id) => {
    const state = get();
    set({ relations: state.relations.filter((r) => r.id !== id) });
  },

  updateCollaborator: (cursor) => {
    const state = get();
    const existing = state.collaborators.find((c) => c.userId === cursor.userId);
    if (existing) {
      set({
        collaborators: state.collaborators.map((c) =>
          c.userId === cursor.userId ? cursor : c
        ),
      });
    } else {
      set({ collaborators: [...state.collaborators, cursor] });
    }
  },

  removeCollaborator: (userId) => {
    const state = get();
    set({ collaborators: state.collaborators.filter((c) => c.userId !== userId) });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const prev = state.history[state.historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(prev.nodes)),
        edges: JSON.parse(JSON.stringify(prev.edges)),
        characters: JSON.parse(JSON.stringify(prev.characters)),
        relations: JSON.parse(JSON.stringify(prev.relations)),
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const next = state.history[state.historyIndex + 1];
      set({
        nodes: JSON.parse(JSON.stringify(next.nodes)),
        edges: JSON.parse(JSON.stringify(next.edges)),
        characters: JSON.parse(JSON.stringify(next.characters)),
        relations: JSON.parse(JSON.stringify(next.relations)),
        historyIndex: state.historyIndex + 1,
      });
    }
  },

  saveVersion: () => {
    const state = get();
    const newVersion: StoryVersion = {
      id: uuidv4(),
      version: state.versions.length + 1,
      createdAt: Date.now(),
      creator: state.currentUser,
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      characters: JSON.parse(JSON.stringify(state.characters)),
      relations: JSON.parse(JSON.stringify(state.relations)),
    };
    set({ versions: [...state.versions, newVersion] });
  },

  setComparingVersion: (versionId) => {
    if (versionId) {
      get().computeVersionDiff(versionId);
    } else {
      set({ comparingVersionId: null, versionDiff: null });
    }
  },

  computeVersionDiff: (versionId) => {
    const state = get();
    const version = state.versions.find((v) => v.id === versionId);
    if (!version) return;

    const currentNodeIds = new Set(state.nodes.map((n) => n.id));
    const versionNodeIds = new Set(version.nodes.map((n) => n.id));

    const addedNodes = state.nodes.filter((n) => !versionNodeIds.has(n.id)).map((n) => n.id);
    const removedNodes = version.nodes.filter((n) => !currentNodeIds.has(n.id)).map((n) => n.id);
    const modifiedNodes: string[] = [];
    state.nodes.forEach((n) => {
      const vn = version.nodes.find((v) => v.id === n.id);
      if (vn && (vn.title !== n.title || vn.description !== n.description || vn.dialogues.length !== n.dialogues.length)) {
        modifiedNodes.push(n.id);
      }
    });

    const currentEdgeIds = new Set(state.edges.map((e) => e.id));
    const versionEdgeIds = new Set(version.edges.map((e) => e.id));
    const addedEdges = state.edges.filter((e) => !versionEdgeIds.has(e.id)).map((e) => e.id);
    const removedEdges = version.edges.filter((e) => !currentEdgeIds.has(e.id)).map((e) => e.id);

    set({
      comparingVersionId: versionId,
      versionDiff: { addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges },
    });
  },

  startSimulation: (startNodeId) => {
    set({
      simulationRunning: true,
      simulationCurrentNodeId: startNodeId,
      simulationPath: [startNodeId],
      simulationResult: null,
    });
  },

  advanceSimulation: (edgeId) => {
    const state = get();
    const edge = state.edges.find((e) => e.id === edgeId);
    if (!edge || edge.sourceId !== state.simulationCurrentNodeId) return;
    const newPath = [...state.simulationPath, edge.targetId];
    const nextEdges = state.edges.filter((e) => e.sourceId === edge.targetId);
    if (nextEdges.length === 0) {
      const choices = newPath.slice(0, -1).map((nodeId, idx) => ({
        nodeId,
        choice: idx === 0 ? '起点' : `选择第 ${idx + 1} 个分支`,
        edgeId: '',
      }));
      set({
        simulationCurrentNodeId: edge.targetId,
        simulationPath: newPath,
        simulationRunning: false,
        simulationResult: {
          path: newPath,
          choices,
          summary: `模拟完成：经过 ${newPath.length} 个剧情节点，最终抵达「${state.nodes.find(n => n.id === edge.targetId)?.title}」。关键转折：${state.nodes.filter(n => newPath.includes(n.id)).map(n => n.title).join(' → ')}`,
        },
      });
    } else {
      set({
        simulationCurrentNodeId: edge.targetId,
        simulationPath: newPath,
      });
    }
  },

  autoSimulate: (startNodeId) => {
    const state = get();
    const path: string[] = [startNodeId];
    let current = startNodeId;
    const maxSteps = 20;
    let steps = 0;
    const choices: { nodeId: string; choice: string; edgeId: string }[] = [];

    while (steps < maxSteps) {
      const outEdges = state.edges.filter((e) => e.sourceId === current);
      if (outEdges.length === 0) break;
      const edge = outEdges[Math.floor(Math.random() * outEdges.length)];
      choices.push({ nodeId: current, choice: `随机选择分支 ${path.length}`, edgeId: edge.id });
      path.push(edge.targetId);
      current = edge.targetId;
      steps++;
    }

    set({
      simulationPath: path,
      simulationCurrentNodeId: path[path.length - 1],
      simulationRunning: false,
      simulationResult: {
        path,
        choices,
        summary: `自动模拟完成：经过 ${path.length} 个剧情节点。路径：${path.map(id => state.nodes.find(n => n.id === id)?.title || id).join(' → ')}`,
      },
    });
  },

  resetSimulation: () => {
    set({
      simulationRunning: false,
      simulationCurrentNodeId: null,
      simulationPath: [],
      simulationResult: null,
    });
  },
}));
