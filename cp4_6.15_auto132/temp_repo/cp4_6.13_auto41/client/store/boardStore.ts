import { create } from 'zustand';
import { Stroke, Sticky, MindNode } from '../modules/drawEngine';

export type ToolType = 'pen' | 'sticky' | 'node' | 'eraser' | 'select';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_color: string;
  message: string;
  timestamp: number;
}

export interface OnlineUser {
  userId: string;
  username: string;
  avatarColor: string;
}

export interface VersionInfo {
  id: string;
  timestamp: number;
  label: string | null;
  thumbnail: string | null;
}

interface BoardState {
  roomId: string;
  userId: string;
  username: string;
  avatarColor: string;
  isJoined: boolean;
  
  tool: ToolType;
  penColor: string;
  penWidth: number;
  
  strokes: Stroke[];
  stickies: Sticky[];
  nodes: MindNode[];
  
  selectedId: string | null;
  selectedType: 'stroke' | 'sticky' | 'node' | null;
  
  chats: ChatMessage[];
  onlineUsers: OnlineUser[];
  
  versions: VersionInfo[];
  showVersionPanel: boolean;
  showChatPanel: boolean;
  
  setRoomId: (id: string) => void;
  setUserId: (id: string) => void;
  setUsername: (name: string) => void;
  setAvatarColor: (color: string) => void;
  setIsJoined: (joined: boolean) => void;
  
  setTool: (tool: ToolType) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  
  setStrokes: (strokes: Stroke[]) => void;
  setStickies: (stickies: Sticky[]) => void;
  setNodes: (nodes: MindNode[]) => void;
  
  addStroke: (stroke: Stroke) => void;
  removeStroke: (id: string) => void;
  
  addSticky: (sticky: Sticky) => void;
  updateSticky: (id: string, updates: Partial<Sticky>) => void;
  removeSticky: (id: string) => void;
  
  addNode: (node: MindNode) => void;
  updateNode: (id: string, updates: Partial<MindNode>) => void;
  removeNode: (id: string) => void;
  
  setSelected: (id: string | null, type: 'stroke' | 'sticky' | 'node' | null) => void;
  
  addChat: (chat: ChatMessage) => void;
  setChats: (chats: ChatMessage[]) => void;
  
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  
  setVersions: (versions: VersionInfo[]) => void;
  setShowVersionPanel: (show: boolean) => void;
  setShowChatPanel: (show: boolean) => void;
  
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  roomId: '',
  userId: '',
  username: '',
  avatarColor: '#3182CE',
  isJoined: false,
  
  tool: 'pen',
  penColor: '#FFFFFF',
  penWidth: 3,
  
  strokes: [],
  stickies: [],
  nodes: [],
  
  selectedId: null,
  selectedType: null,
  
  chats: [],
  onlineUsers: [],
  
  versions: [],
  showVersionPanel: false,
  showChatPanel: true,
  
  setRoomId: (id) => set({ roomId: id }),
  setUserId: (id) => set({ userId: id }),
  setUsername: (name) => set({ username: name }),
  setAvatarColor: (color) => set({ avatarColor: color }),
  setIsJoined: (joined) => set({ isJoined: joined }),
  
  setTool: (tool) => set({ tool, selectedId: null, selectedType: null }),
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  
  setStrokes: (strokes) => set({ strokes }),
  setStickies: (stickies) => set({ stickies }),
  setNodes: (nodes) => set({ nodes }),
  
  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),
  removeStroke: (id) => set((state) => ({ strokes: state.strokes.filter(s => s.id !== id) })),
  
  addSticky: (sticky) => set((state) => ({ stickies: [...state.stickies, sticky] })),
  updateSticky: (id, updates) => set((state) => ({
    stickies: state.stickies.map(s => s.id === id ? { ...s, ...updates } : s),
  })),
  removeSticky: (id) => set((state) => ({ stickies: state.stickies.filter(s => s.id !== id) })),
  
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter(n => n.id !== id) })),
  
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  
  addChat: (chat) => set((state) => {
    const newChats = [...state.chats, chat];
    if (newChats.length > 50) {
      newChats.shift();
    }
    return { chats: newChats };
  }),
  setChats: (chats) => set({ chats }),
  
  addOnlineUser: (user) => set((state) => {
    if (state.onlineUsers.find(u => u.userId === user.userId)) {
      return state;
    }
    return { onlineUsers: [...state.onlineUsers, user] };
  }),
  removeOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(u => u.userId !== userId),
  })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  setVersions: (versions) => set({ versions }),
  setShowVersionPanel: (show) => set({ showVersionPanel: show }),
  setShowChatPanel: (show) => set({ showChatPanel: show }),
  
  clearBoard: () => set({ strokes: [], stickies: [], nodes: [] }),
}));
