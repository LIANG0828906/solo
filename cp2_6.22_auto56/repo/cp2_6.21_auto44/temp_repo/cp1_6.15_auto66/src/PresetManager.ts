interface Track {
  id: string;
  name: string;
  audioBufferId: string;
  startTime: number;
  duration: number;
  muted: boolean;
  soloed: boolean;
  volume: number;
  pan: number;
  reverb: number;
  delay: number;
  compression: number;
}

interface Comment {
  id: string;
  time: number;
  trackId?: string;
  text: string;
  author: 'creator' | 'viewer';
  createdAt: number;
}

interface Preset {
  id: string;
  name: string;
  createdAt: number;
  bpm: number;
  loopEnabled: boolean;
  tracks: Track[];
  waveformSnapshot?: string;
  comments: Comment[];
}

interface ShareMode {
  readonly: boolean;
}

type SavePresetState = {
  bpm: number;
  loopEnabled: boolean;
  tracks: Track[];
};

type AddCommentInput = {
  time: number;
  trackId?: string;
  text: string;
  author?: 'creator' | 'viewer';
};

const STORAGE_QUOTA_WARNING_THRESHOLD = 4 * 1024 * 1024;

interface StorageUsage {
  used: number;
  total: number;
}

class PresetManager {
  private static _instance: PresetManager | null = null;
  private static readonly STORAGE_KEY = 'audiomix_presets';
  private static readonly COMMENTS_KEY_PREFIX = 'audiomix_comments_';

  private constructor() {}

  public static instance(): PresetManager {
    if (!PresetManager._instance) {
      PresetManager._instance = new PresetManager();
    }
    return PresetManager._instance;
  }

  public getAllPresets(): Preset[] {
    try {
      const raw = localStorage.getItem(PresetManager.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Preset[];
    } catch {
      return [];
    }
  }

  public estimateStorageUsage(): StorageUsage {
    const presets = this.getAllPresets();
    const used = JSON.stringify(presets).length;
    const total = STORAGE_QUOTA_WARNING_THRESHOLD;
    return { used, total };
  }

  public getPresetsSortedByDate(): Preset[] {
    const presets = this.getAllPresets();
    return [...presets].sort((a, b) => a.createdAt - b.createdAt);
  }

  private persistPresets(presets: Preset[]): boolean {
    try {
      localStorage.setItem(PresetManager.STORAGE_KEY, JSON.stringify(presets));
      return true;
    } catch {
      return false;
    }
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public savePreset(name: string, state: SavePresetState): Preset | null {
    const preset: Preset = {
      id: this.generateUUID(),
      name,
      createdAt: Date.now(),
      bpm: state.bpm,
      loopEnabled: state.loopEnabled,
      tracks: state.tracks,
      waveformSnapshot: '',
      comments: [],
    };

    const presets = this.getAllPresets();
    presets.unshift(preset);

    if (!this.persistPresets(presets)) {
      return null;
    }

    return preset;
  }

  public deletePreset(id: string): boolean {
    const presets = this.getAllPresets();
    const filtered = presets.filter((p) => p.id !== id);
    if (filtered.length === presets.length) return false;
    return this.persistPresets(filtered);
  }

  public loadPreset(id: string): Preset | null {
    const presets = this.getAllPresets();
    const found = presets.find((p) => p.id === id);
    return found || null;
  }

  private utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUtf8(base64: string): string {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  public generateShareLink(preset: Preset): string {
    try {
      const json = JSON.stringify(preset);
      const base64 = this.utf8ToBase64(json);
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}#share=${encodeURIComponent(base64)}`;
    } catch {
      return '';
    }
  }

  public parseShareLink(): Preset | null {
    try {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#')) return null;

      const params = new URLSearchParams(hash.slice(1));
      const shareBase64 = params.get('share');
      if (!shareBase64) return null;

      const decoded = decodeURIComponent(shareBase64);
      const json = this.base64ToUtf8(decoded);
      const parsed = JSON.parse(json) as Preset;

      if (!parsed || typeof parsed.id !== 'string' || !Array.isArray(parsed.tracks)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private getCommentsKey(shareId: string): string {
    return `${PresetManager.COMMENTS_KEY_PREFIX}${shareId}`;
  }

  public addComment(shareId: string, comment: AddCommentInput): Comment | null {
    const newComment: Comment = {
      id: this.generateUUID(),
      time: comment.time,
      trackId: comment.trackId,
      text: comment.text,
      author: comment.author || 'viewer',
      createdAt: Date.now(),
    };

    const comments = this.getComments(shareId);
    comments.push(newComment);

    try {
      localStorage.setItem(this.getCommentsKey(shareId), JSON.stringify(comments));
      return newComment;
    } catch {
      return null;
    }
  }

  public getComments(shareId: string): Comment[] {
    try {
      const raw = localStorage.getItem(this.getCommentsKey(shareId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Comment[];
    } catch {
      return [];
    }
  }

  public deleteComment(shareId: string, commentId: string): boolean {
    const comments = this.getComments(shareId);
    const filtered = comments.filter((c) => c.id !== commentId);
    if (filtered.length === comments.length) return false;
    try {
      localStorage.setItem(this.getCommentsKey(shareId), JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  public getAllCommentsForPreset(presetId: string): Comment[] {
    return this.getComments(presetId);
  }

  public isShareMode(): ShareMode {
    const preset = this.parseShareLink();
    return { readonly: preset !== null };
  }
}

export { PresetManager, STORAGE_QUOTA_WARNING_THRESHOLD };
export type { Track, Preset, Comment, ShareMode, SavePresetState, AddCommentInput, StorageUsage };
