import {
  ProjectData,
  deserializeProject,
  serializeProject,
  createDefaultProject,
  OnlineUser,
  generateId,
  getRandomColor
} from '../data/project';

const STORAGE_KEY = 'music-collab-project';
const USER_KEY = 'music-collab-user';
const SYNC_INTERVAL = 5000;
const USER_TIMEOUT = 15000;

export interface SyncCallbacks {
  onProjectChange: (project: ProjectData) => void;
  onUsersChange: (users: OnlineUser[]) => void;
  onRemoteNoteChange?: (noteIds: string[]) => void;
}

export class CollaborationSync {
  private userId: string;
  private userName: string;
  private userColor: string;
  private callbacks: SyncCallbacks;
  private syncTimer: number | null = null;
  private lastSyncedHash: string = '';
  private storageHandler: ((e: StorageEvent) => void) | null = null;
  private pendingRemoteNotes: Set<string> = new Set();

  constructor(callbacks: SyncCallbacks) {
    this.callbacks = callbacks;
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      this.userId = parsed.id;
      this.userName = parsed.name;
      this.userColor = parsed.color;
    } else {
      this.userId = generateId();
      this.userName = `用户${Math.floor(Math.random() * 9000) + 1000}`;
      this.userColor = getRandomColor();
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          id: this.userId,
          name: this.userName,
          color: this.userColor
        })
      );
    }
  }

  getCurrentUser(): OnlineUser {
    return {
      id: this.userId,
      name: this.userName,
      color: this.userColor,
      lastActive: Date.now()
    };
  }

  start(): void {
    this.initializeProject();
    this.startAutoSync();
    this.startStorageListener();
    this.updateOnlineUsers();
  }

  stop(): void {
    if (this.syncTimer !== null) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    this.removeCurrentUser();
  }

  private initializeProject(): void {
    const existing = this.readSync();
    if (existing) {
      this.lastSyncedHash = this.hash(serializeProject(existing));
      this.callbacks.onProjectChange(existing);
    } else {
      const newProject = createDefaultProject(this.userId);
      newProject.onlineUsers = [this.getCurrentUser()];
      this.writeSync(newProject);
      this.callbacks.onProjectChange(newProject);
    }
  }

  private startAutoSync(): void {
    this.syncTimer = window.setInterval(() => {
      this.updateOnlineUsers();
      this.checkForRemoteChanges();
    }, SYNC_INTERVAL);
  }

  private startStorageListener(): void {
    this.storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newHash = this.hash(e.newValue);
        if (newHash !== this.lastSyncedHash) {
          this.lastSyncedHash = newHash;
          const project = deserializeProject(e.newValue);
          if (project) {
            const currentProjectStr = serializeProject(
              this.getCurrentProjectFromState()
            );
            const currentHash = this.hash(currentProjectStr);

            if (newHash !== currentHash) {
              const remoteNotes = this.extractNewNoteIds(
                this.getCurrentProjectFromState(),
                project
              );
              if (remoteNotes.length > 0) {
                remoteNotes.forEach(id => this.pendingRemoteNotes.add(id));
                this.callbacks.onRemoteNoteChange?.(remoteNotes);
                setTimeout(() => {
                  remoteNotes.forEach(id => this.pendingRemoteNotes.delete(id));
                }, 500);
              }
              this.callbacks.onProjectChange(project);
            }
          }
        }
      }
    };
    window.addEventListener('storage', this.storageHandler);
  }

  private getCurrentProjectFromState(): ProjectData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = deserializeProject(stored);
      if (parsed) return parsed;
    }
    return createDefaultProject(this.userId);
  }

  private extractNewNoteIds(
    oldProject: ProjectData,
    newProject: ProjectData
  ): string[] {
    const oldNoteIds = new Set<string>();
    oldProject.tracks.forEach(t => t.notes.forEach(n => oldNoteIds.add(n.id)));

    const newNotes: string[] = [];
    newProject.tracks.forEach(t => {
      t.notes.forEach(n => {
        if (!oldNoteIds.has(n.id) && n.createdBy !== this.userId) {
          newNotes.push(n.id);
        }
      });
    });
    return newNotes;
  }

  private checkForRemoteChanges(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const newHash = this.hash(stored);
    if (newHash !== this.lastSyncedHash) {
      this.lastSyncedHash = newHash;
      const project = deserializeProject(stored);
      if (project) {
        this.callbacks.onProjectChange(project);
      }
    }
  }

  private updateOnlineUsers(): void {
    const project = this.readSync();
    if (!project) return;

    const now = Date.now();
    const currentUser = this.getCurrentUser();

    const activeUsers = project.onlineUsers.filter(
      u => now - u.lastActive < USER_TIMEOUT || u.id === this.userId
    );

    const existingIndex = activeUsers.findIndex(u => u.id === this.userId);
    if (existingIndex >= 0) {
      activeUsers[existingIndex] = currentUser;
    } else {
      if (activeUsers.length < 4) {
        activeUsers.push(currentUser);
      }
    }

    project.onlineUsers = activeUsers;
    project.meta.updatedAt = now;

    this.writeSyncRaw(project);
    this.callbacks.onUsersChange(activeUsers);
  }

  private removeCurrentUser(): void {
    const project = this.readSync();
    if (!project) return;

    project.onlineUsers = project.onlineUsers.filter(
      u => u.id !== this.userId
    );
    project.meta.updatedAt = Date.now();
    this.writeSyncRaw(project);
  }

  readSync(): ProjectData | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return deserializeProject(data);
  }

  writeSync(project: ProjectData): void {
    project.meta.updatedAt = Date.now();
    this.writeSyncRaw(project);
  }

  private writeSyncRaw(project: ProjectData): void {
    const serialized = serializeProject(project);
    this.lastSyncedHash = this.hash(serialized);
    localStorage.setItem(STORAGE_KEY, serialized);
  }

  immediateSync(project: ProjectData): void {
    this.writeSync(project);
    this.checkForRemoteChanges();
  }

  isRemoteNote(noteId: string): boolean {
    return this.pendingRemoteNotes.has(noteId);
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

let syncInstance: CollaborationSync | null = null;

export function initSync(callbacks: SyncCallbacks): CollaborationSync {
  if (syncInstance) {
    syncInstance.stop();
  }
  syncInstance = new CollaborationSync(callbacks);
  syncInstance.start();
  return syncInstance;
}

export function getSync(): CollaborationSync | null {
  return syncInstance;
}
