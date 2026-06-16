import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Client, Project } from './types';

interface ClientState {
  clients: Client[];
  projects: Project[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>) => void;
  deleteClient: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
  getProjectsByClient: (clientId: string) => Project[];
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  projects: [],
  loading: false,

  addClient: (client) => {
    const newClient: Client = {
      ...client,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ clients: [...state.clients, newClient] }));
    void get().saveToDB();
  },

  updateClient: (id, updates) => {
    set((state) => ({
      clients: state.clients.map((client) =>
        client.id === id ? { ...client, ...updates } : client
      ),
    }));
    void get().saveToDB();
  },

  deleteClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
      projects: state.projects.filter((project) => project.clientId !== id),
    }));
    void get().saveToDB();
  },

  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
    void get().saveToDB();
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      ),
    }));
    void get().saveToDB();
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }));
    void get().saveToDB();
  },

  getProjectsByClient: (clientId) => {
    return get().projects.filter((project) => project.clientId === clientId);
  },

  loadFromDB: async () => {
    set({ loading: true });
    try {
      const [clientsData, projectsData] = await Promise.all([
        idbGet('freelance_clients'),
        idbGet('freelance_projects'),
      ]);
      set({
        clients: (clientsData as Client[]) ?? [],
        projects: (projectsData as Project[]) ?? [],
      });
    } finally {
      set({ loading: false });
    }
  },

  saveToDB: async () => {
    const { clients, projects } = get();
    await Promise.all([
      idbSet('freelance_clients', clients),
      idbSet('freelance_projects', projects),
    ]);
  },
}));
