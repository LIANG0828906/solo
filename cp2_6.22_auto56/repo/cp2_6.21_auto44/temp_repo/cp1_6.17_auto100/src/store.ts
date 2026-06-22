import { create } from 'zustand';
import type { AppState, StoryNode, User } from './types';

const getNodePath = (nodes: StoryNode[], nodeId: string): string[] => {
  const path: string[] = [];
  let current = nodes.find(n => n.id === nodeId);
  while (current) {
    path.unshift(current.id);
    if (current.parentId) {
      current = nodes.find(n => n.id === current.parentId);
    } else {
      break;
    }
  }
  return path;
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  storyNodes: [],
  selectedNodeId: null,
  expandedNodeIds: new Set(),
  isLoginModalOpen: true,
  isAuthorPanelOpen: true,

  setCurrentUser: (user) => set({ currentUser: user }),
  setUsers: (users) => set({ users }),
  setStoryNodes: (nodes) => set({ storyNodes: nodes }),
  setSelectedNodeId: (id) => {
    if (id) {
      const { expandAllAncestors } = get();
      expandAllAncestors(id);
    }
    set({ selectedNodeId: id });
  },
  toggleNodeExpand: (id) => set((state) => {
    const newExpanded = new Set(state.expandedNodeIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    return { expandedNodeIds: newExpanded };
  }),
  expandAllAncestors: (nodeId) => set((state) => {
    const path = getNodePath(state.storyNodes, nodeId);
    const newExpanded = new Set(state.expandedNodeIds);
    path.forEach(id => {
      if (id !== nodeId) newExpanded.add(id);
    });
    return { expandedNodeIds: newExpanded };
  }),
  setIsLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
  setIsAuthorPanelOpen: (open) => set({ isAuthorPanelOpen: open }),
  toggleAuthorPanel: () => set((state) => ({ isAuthorPanelOpen: !state.isAuthorPanelOpen })),

  fetchUsers: async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      set({ users: data });
    } catch (e) {
      console.error('获取用户列表失败', e);
    }
  },

  fetchStoryNodes: async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      set({ storyNodes: data });
    } catch (e) {
      console.error('获取故事节点失败', e);
    }
  },

  login: async (nickname, avatarColor) => {
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, avatarColor })
      });
      const user = await res.json();
      set({ 
        currentUser: user, 
        isLoginModalOpen: false,
        expandedNodeIds: new Set(['node-1', 'node-2', 'node-3'])
      });
      await get().fetchUsers();
      await get().fetchStoryNodes();
    } catch (e) {
      console.error('登录失败', e);
      throw e;
    }
  },

  logout: async () => {
    const { currentUser, unlockAllOwnedNodes } = get();
    if (currentUser) {
      await unlockAllOwnedNodes();
      try {
        await fetch(`/api/users/${currentUser.id}/logout`, { method: 'POST' });
      } catch (e) {
        console.error('退出失败', e);
      }
    }
    set({ 
      currentUser: null, 
      isLoginModalOpen: true,
      selectedNodeId: null 
    });
  },

  updateNodeText: async (nodeId, text) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/stories/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId: currentUser.id,
          userName: currentUser.nickname
        })
      });
      if (!res.ok) {
        return false;
      }
      const updatedNode = await res.json();
      set((state) => ({
        storyNodes: state.storyNodes.map(n => 
          n.id === nodeId ? updatedNode : n
        )
      }));
      return true;
    } catch (e) {
      console.error('更新节点失败', e);
      return false;
    }
  },

  lockNode: async (nodeId) => {
    const { currentUser, storyNodes } = get();
    if (!currentUser) return false;
    const node = storyNodes.find(n => n.id === nodeId);
    if (node && node.lockOwner && node.lockOwner !== currentUser.id) {
      return false;
    }
    try {
      const res = await fetch(`/api/stories/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.nickname
        })
      });
      if (!res.ok) return false;
      const updatedNode = await res.json();
      set((state) => ({
        storyNodes: state.storyNodes.map(n => 
          n.id === nodeId ? updatedNode : n
        )
      }));
      return true;
    } catch (e) {
      console.error('锁定节点失败', e);
      return false;
    }
  },

  unlockNode: async (nodeId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/stories/${nodeId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const updatedNode = await res.json();
        set((state) => ({
          storyNodes: state.storyNodes.map(n => 
            n.id === nodeId ? updatedNode : n
          )
        }));
      }
    } catch (e) {
      console.error('解锁节点失败', e);
    }
  },

  unlockAllOwnedNodes: async () => {
    const { currentUser, storyNodes } = get();
    if (!currentUser) return;
    const ownedNodes = storyNodes.filter(n => n.lockOwner === currentUser.id);
    for (const node of ownedNodes) {
      await get().unlockNode(node.id);
    }
  },

  addChildNode: async (parentId, text) => {
    const { currentUser } = get();
    if (!currentUser) return null;
    try {
      const res = await fetch(`/api/stories/${parentId}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId: currentUser.id,
          userName: currentUser.nickname
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '创建分支失败');
        return null;
      }
      const newNode = await res.json();
      await get().fetchStoryNodes();
      set((state) => {
        const newExpanded = new Set(state.expandedNodeIds);
        newExpanded.add(parentId);
        return {
          selectedNodeId: newNode.id,
          expandedNodeIds: newExpanded
        };
      });
      return newNode.id;
    } catch (e) {
      console.error('添加子节点失败', e);
      return null;
    }
  }
}));
