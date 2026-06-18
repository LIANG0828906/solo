import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Project,
  Screen,
  Component,
  Connection,
  Member,
  Comment,
  MemberRole,
  ComponentInteraction,
} from '../types';
import { generateId } from '../utils/helpers';

interface PrototypeState {
  projects: Project[];
  currentProjectId: string | null;
  currentScreenId: string | null;
  selectedComponentId: string | null;
  components: Component[];
  screens: Screen[];
  connections: Connection[];
  members: Member[];
  comments: Comment[];
  activeTool: string | null;
  connectingFromId: string | null;
}

interface PrototypeActions {
  setActiveTool: (tool: string | null) => void;
  setConnectingFromId: (id: string | null) => void;
  setCurrentProject: (id: string | null) => void;
  setCurrentScreen: (id: string | null) => void;
  selectComponent: (id: string | null) => void;
  addProject: (name: string, description: string) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addScreen: (projectId: string, name?: string) => Screen;
  updateScreen: (id: string, data: Partial<Screen>) => void;
  deleteScreen: (id: string) => void;
  addComponent: (component: Omit<Component, 'id'>) => Component;
  updateComponent: (id: string, data: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  setComponentInteraction: (id: string, interaction: ComponentInteraction | undefined) => void;
  duplicateComponent: (id: string) => Component | null;
  addConnection: (fromComponentId: string, toScreenId: string) => Connection;
  deleteConnection: (id: string) => void;
  addMember: (projectId: string, email: string, role: MemberRole) => Member;
  updateMember: (id: string, role: MemberRole) => void;
  removeMember: (id: string) => void;
  addComment: (componentId: string, userId: string, text: string) => Comment;
  deleteComment: (id: string) => void;
  toggleComponentLock: (id: string) => void;
  loadProjectData: (projectId: string) => void;
  clearCurrentProject: () => void;
}

export type PrototypeStore = PrototypeState & PrototypeActions;

const getCurrentUserId = (): string => {
  return 'user-' + (localStorage.getItem('userId') || generateId().slice(0, 8));
};

const ensureUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = generateId().slice(0, 8);
    localStorage.setItem('userId', userId);
  }
  return 'user-' + userId;
};

export const usePrototypeStore = create<PrototypeStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentScreenId: null,
      selectedComponentId: null,
      components: [],
      screens: [],
      connections: [],
      members: [],
      comments: [],
      activeTool: null,
      connectingFromId: null,

      setActiveTool: (tool) => set({ activeTool: tool }),
      setConnectingFromId: (id) => set({ connectingFromId: id }),

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
        if (id) {
          get().loadProjectData(id);
        }
      },

      setCurrentScreen: (id) => {
        set({ currentScreenId: id, selectedComponentId: null });
      },

      selectComponent: (id) => set({ selectedComponentId: id }),

      addProject: (name, description) => {
        const userId = ensureUserId();
        const project: Project = {
          id: generateId(),
          name,
          description,
          ownerId: getCurrentUserId(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: [...state.projects, project],
        }));

        const screen = get().addScreen(project.id, '首页');
        get().addMember(project.id, 'owner@protoflow.com', 'owner');
        get().setCurrentProject(project.id);
        get().setCurrentScreen(screen.id);

        return project;
      },

      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (id) => {
        const state = get();
        set({
          projects: state.projects.filter((p) => p.id !== id),
          components: state.components.filter((c) => {
            const screen = state.screens.find((s) => s.id === c.screenId);
            return screen?.projectId !== id;
          }),
          screens: state.screens.filter((s) => s.projectId !== id),
          connections: state.connections.filter((c) => c.projectId !== id),
          members: state.members.filter((m) => m.projectId !== id),
          comments: state.comments.filter((c) => {
            const component = state.components.find((comp) => comp.id === c.componentId);
            const screen = component && state.screens.find((s) => s.id === component.screenId);
            return screen?.projectId !== id;
          }),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
          currentScreenId: null,
          selectedComponentId: null,
        });
      },

      addScreen: (projectId, name = '新屏幕') => {
        const state = get();
        const projectScreens = state.screens.filter((s) => s.projectId === projectId);
        const screen: Screen = {
          id: generateId(),
          projectId,
          name: name || `屏幕 ${projectScreens.length + 1}`,
          order: projectScreens.length,
        };
        set((state) => ({
          screens: [...state.screens, screen],
          currentScreenId: screen.id,
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        return screen;
      },

      updateScreen: (id, data) =>
        set((state) => ({
          screens: state.screens.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      deleteScreen: (id) => {
        const state = get();
        const screenToDelete = state.screens.find((s) => s.id === id);
        if (!screenToDelete) return;

        const remainingScreens = state.screens
          .filter((s) => s.projectId === screenToDelete.projectId && s.id !== id)
          .sort((a, b) => a.order - b.order);

        set({
          screens: state.screens
            .filter((s) => s.id !== id)
            .map((s) => {
              if (s.projectId === screenToDelete.projectId) {
                const newIndex = remainingScreens.findIndex((rs) => rs.id === s.id);
                return newIndex >= 0 ? { ...s, order: newIndex } : s;
              }
              return s;
            }),
          components: state.components.filter((c) => c.screenId !== id),
          connections: state.connections.filter(
            (c) => c.toScreenId !== id
          ),
          comments: state.comments.filter((c) => {
            const comp = state.components.find((comp) => comp.id === c.componentId);
            return comp?.screenId !== id;
          }),
          currentScreenId: state.currentScreenId === id
            ? remainingScreens[0]?.id || null
            : state.currentScreenId,
        });
      },

      addComponent: (component) => {
        const newComponent: Component = {
          ...component,
          id: generateId(),
        };
        set((state) => ({
          components: [...state.components, newComponent],
          selectedComponentId: newComponent.id,
          projects: state.projects.map((p) => {
            const screen = state.screens.find((s) => s.id === component.screenId);
            return screen?.projectId === p.id
              ? { ...p, updatedAt: new Date().toISOString() }
              : p;
          }),
        }));
        return newComponent;
      },

      updateComponent: (id, data) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      deleteComponent: (id) => {
        const state = get();
        set({
          components: state.components.filter((c) => c.id !== id),
          connections: state.connections.filter((c) => c.fromComponentId !== id),
          comments: state.comments.filter((c) => c.componentId !== id),
          selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
        });
      },

      setComponentInteraction: (id, interaction) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, interaction } : c
          ),
        })),

      duplicateComponent: (id) => {
        const state = get();
        const component = state.components.find((c) => c.id === id);
        if (!component) return null;

        const duplicated: Component = {
          ...component,
          id: generateId(),
          x: component.x + 20,
          y: component.y + 20,
          interaction: undefined,
        };

        set((state) => ({
          components: [...state.components, duplicated],
          selectedComponentId: duplicated.id,
        }));

        return duplicated;
      },

      addConnection: (fromComponentId, toScreenId) => {
        const state = get();
        const component = state.components.find((c) => c.id === fromComponentId);
        if (!component) throw new Error('Component not found');

        const screen = state.screens.find((s) => s.id === component.screenId);
        if (!screen) throw new Error('Screen not found');

        const connection: Connection = {
          id: generateId(),
          projectId: screen.projectId,
          fromComponentId,
          toScreenId,
        };

        set((state) => ({
          connections: [...state.connections, connection],
          connectingFromId: null,
          activeTool: null,
        }));

        return connection;
      },

      deleteConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        })),

      addMember: (projectId, email, role) => {
        const member: Member = {
          id: generateId(),
          projectId,
          email,
          role,
        };
        set((state) => ({
          members: [...state.members, member],
        }));
        return member;
      },

      updateMember: (id, role) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, role } : m
          ),
        })),

      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        })),

      addComment: (componentId, userId, text) => {
        const comment: Comment = {
          id: generateId(),
          componentId,
          userId,
          text,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          comments: [...state.comments, comment],
        }));
        return comment;
      },

      deleteComment: (id) =>
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== id),
        })),

      toggleComponentLock: (id) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, locked: !c.locked } : c
          ),
        })),

      loadProjectData: (projectId) => {
        const state = get();
        const projectScreens = state.screens
          .filter((s) => s.projectId === projectId)
          .sort((a, b) => a.order - b.order);
        const screenIds = projectScreens.map((s) => s.id);
        const projectComponents = state.components.filter((c) =>
          screenIds.includes(c.screenId)
        );
        const componentIds = projectComponents.map((c) => c.id);

        set({
          currentScreenId: projectScreens[0]?.id || null,
          selectedComponentId: null,
        });
      },

      clearCurrentProject: () => {
        set({
          currentProjectId: null,
          currentScreenId: null,
          selectedComponentId: null,
          activeTool: null,
          connectingFromId: null,
        });
      },
    }),
    {
      name: 'protoflow-storage',
      partialize: (state) => ({
        projects: state.projects,
        components: state.components,
        screens: state.screens,
        connections: state.connections,
        members: state.members,
        comments: state.comments,
      }),
    }
  )
);
