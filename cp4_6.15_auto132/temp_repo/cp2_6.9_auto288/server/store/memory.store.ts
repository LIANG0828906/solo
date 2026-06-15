import type { User, Artifact } from '../../src/types';

interface MemoryStore {
  users: Map<string, User>;
  artifacts: Map<string, Artifact>;
  usernameToId: Map<string, string>;
}

export const memoryStore: MemoryStore = {
  users: new Map(),
  artifacts: new Map(),
  usernameToId: new Map(),
};

export const userStore = {
  create: (user: User): User => {
    memoryStore.users.set(user.id, user);
    memoryStore.usernameToId.set(user.username, user.id);
    return user;
  },
  
  findByUsername: (username: string): User | undefined => {
    const id = memoryStore.usernameToId.get(username);
    return id ? memoryStore.users.get(id) : undefined;
  },
  
  findById: (id: string): User | undefined => {
    return memoryStore.users.get(id);
  },
  
  exists: (username: string): boolean => {
    return memoryStore.usernameToId.has(username);
  },
};

export const artifactStore = {
  create: (artifact: Artifact): Artifact => {
    memoryStore.artifacts.set(artifact.id, artifact);
    return artifact;
  },
  
  findById: (id: string): Artifact | undefined => {
    return memoryStore.artifacts.get(id);
  },
  
  findByUserId: (userId: string): Artifact[] => {
    return Array.from(memoryStore.artifacts.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },
  
  update: (id: string, updates: Partial<Artifact>): Artifact | undefined => {
    const artifact = memoryStore.artifacts.get(id);
    if (!artifact) return undefined;
    
    const updated = { ...artifact, ...updates };
    memoryStore.artifacts.set(id, updated);
    return updated;
  },
  
  delete: (id: string): boolean => {
    return memoryStore.artifacts.delete(id);
  },
};
