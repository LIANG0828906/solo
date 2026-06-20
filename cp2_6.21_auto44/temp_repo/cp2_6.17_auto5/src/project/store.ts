import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Project, ColorRules, ColorRole, Color } from '../utils/types';
import { usePaletteStore } from '../palette/store';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  isReadonlyMode: boolean;
  createProject: (name: string) => Project;
  setCurrentProject: (id: string) => void;
  updateRule: (role: ColorRole, colorId: string | null) => void;
  generateInviteLink: () => string;
  getCurrentProject: () => Project | null;
  getCurrentProjectColors: () => Color[];
  getRuleColor: (role: ColorRole) => Color | null;
  isReadonly: () => boolean;
  setReadonlyMode: (readonly: boolean) => void;
  loadProjectFromInvite: (projectId: string) => void;
}

const defaultRules: ColorRules = {
  background: null,
  cardBackground: null,
  button: null,
  textPrimary: null,
  textSecondary: null,
  accent: null
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isReadonlyMode: false,

  createProject: (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      colorIds: [],
      rules: { ...defaultRules },
      inviteLink: '',
      isReadonly: false
    };

    newProject.inviteLink = `${window.location.origin}/invite/${newProject.id}`;

    set(state => ({
      projects: [...state.projects, newProject],
      currentProjectId: newProject.id
    }));

    usePaletteStore.getState().clearColors();

    return newProject;
  },

  setCurrentProject: (id: string) => {
    const project = get().projects.find(p => p.id === id);
    if (!project) return;

    set({ currentProjectId: id });

    const paletteState = usePaletteStore.getState();
    const colors = paletteState.colors.filter(c => project.colorIds.includes(c.id));
    paletteState.setColors(colors);
  },

  updateRule: (role: ColorRole, colorId: string | null) => {
    const currentProjectId = get().currentProjectId;
    if (!currentProjectId) return;

    set(state => ({
      projects: state.projects.map(p => {
        if (p.id !== currentProjectId) return p;
        return {
          ...p,
          rules: {
            ...p.rules,
            [role]: colorId
          }
        };
      })
    }));

    const project = get().getCurrentProject();
    if (project) {
      const paletteColors = usePaletteStore.getState().colors;
      const color = paletteColors.find(c => c.id === colorId);
      if (color && !project.colorIds.includes(color.id)) {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== currentProjectId) return p;
            return {
              ...p,
              colorIds: [...p.colorIds, color.id]
            };
          })
        }));
      }
    }
  },

  generateInviteLink: () => {
    const project = get().getCurrentProject();
    if (!project) return '';

    const inviteLink = `${window.location.origin}/invite/${project.id}`;

    set(state => ({
      projects: state.projects.map(p => {
        if (p.id !== project.id) return p;
        return { ...p, inviteLink };
      })
    }));

    return inviteLink;
  },

  getCurrentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find(p => p.id === currentProjectId) || null;
  },

  getCurrentProjectColors: () => {
    const project = get().getCurrentProject();
    if (!project) return [];

    const paletteColors = usePaletteStore.getState().colors;
    return paletteColors.filter(c => project.colorIds.includes(c.id));
  },

  getRuleColor: (role: ColorRole) => {
    const project = get().getCurrentProject();
    if (!project) return null;

    const colorId = project.rules[role];
    if (!colorId) return null;

    return usePaletteStore.getState().getColorById(colorId) || null;
  },

  isReadonly: () => {
    return get().isReadonlyMode;
  },

  setReadonlyMode: (readonly: boolean) => {
    set({ isReadonlyMode: readonly });
  },

  loadProjectFromInvite: (projectId: string) => {
    const project = get().projects.find(p => p.id === projectId);
    if (project) {
      set({
        currentProjectId: projectId,
        isReadonlyMode: true
      });
    }
  }
}));
