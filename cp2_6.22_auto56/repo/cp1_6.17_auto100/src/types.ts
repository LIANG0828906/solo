export interface User {
  id: string;
  nickname: string;
  avatarColor: string;
  isOnline: boolean;
  editingNodeId: string | null;
}

export interface StoryNode {
  id: string;
  text: string;
  parentId: string | null;
  childrenIds: string[];
  lockOwner: string | null;
  lockOwnerName: string | null;
  lockExpireAt: number | null;
  createdAt: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  storyNodes: StoryNode[];
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
  isLoginModalOpen: boolean;
  isAuthorPanelOpen: boolean;

  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  setStoryNodes: (nodes: StoryNode[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  toggleNodeExpand: (id: string) => void;
  expandAllAncestors: (nodeId: string) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setIsAuthorPanelOpen: (open: boolean) => void;
  toggleAuthorPanel: () => void;

  fetchUsers: () => Promise<void>;
  fetchStoryNodes: () => Promise<void>;
  login: (nickname: string, avatarColor: string) => Promise<void>;
  logout: () => Promise<void>;
  updateNodeText: (nodeId: string, text: string) => Promise<boolean>;
  lockNode: (nodeId: string) => Promise<boolean>;
  unlockNode: (nodeId: string) => Promise<void>;
  unlockAllOwnedNodes: () => Promise<void>;
  addChildNode: (parentId: string, text: string) => Promise<string | null>;
}

export const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD'
];
