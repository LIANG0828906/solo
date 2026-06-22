export interface Podcast {
  id: string;
  title: string;
  audioUrl: string;
  coverColor: string;
  duration: number;
  createdAt: number;
}

export interface Note {
  id: string;
  podcastId: string;
  timestamp: number;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ListeningSession {
  id: string;
  podcastId: string;
  date: string;
  duration: number;
}

export interface WeeklyStat {
  week: string;
  hours: number;
}

export interface PodcastNoteStat {
  podcast: string;
  count: number;
}

export interface TotalStats {
  totalListeningHours: number;
  totalNotes: number;
}

export interface FilterOptions {
  podcastId?: string;
  tag?: string;
  searchText?: string;
}

const COVER_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#F97316'
];

export const PLACEHOLDER_AUDIOS = [
  { title: '技术前沿播客', filename: 'tech-podcast.mp3', duration: 1800 },
  { title: '商业思维访谈', filename: 'business-podcast.mp3', duration: 2400 },
  { title: '人文历史漫谈', filename: 'history-podcast.mp3', duration: 2100 },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getRandomCoverColor(): string {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const year = monday.getFullYear();
  const month = (monday.getMonth() + 1).toString().padStart(2, '0');
  const dayNum = monday.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${dayNum}`;
}

export class NoteManager {
  private notes: Note[] = [];
  private podcasts: Podcast[] = [];
  private listeningSessions: ListeningSession[] = [];
  private readonly storageKey = 'podnotes_data';
  private saveTimeout: number | null = null;
  private readonly SAVE_DEBOUNCE = 300;

  constructor() {
    this.loadFromStorage();
    if (this.podcasts.length === 0) {
      this.initializeSampleData();
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.notes = parsed.notes || [];
        this.podcasts = parsed.podcasts || [];
        this.listeningSessions = parsed.listeningSessions || [];
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
      this.notes = [];
      this.podcasts = [];
      this.listeningSessions = [];
    }
  }

  private saveToStorage(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      try {
        const data = {
          notes: this.notes,
          podcasts: this.podcasts,
          listeningSessions: this.listeningSessions
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save to storage:', e);
      }
    }, this.SAVE_DEBOUNCE);
  }

  private initializeSampleData(): void {
    const now = Date.now();
    
    PLACEHOLDER_AUDIOS.forEach((audio, index) => {
      const podcast: Podcast = {
        id: generateId(),
        title: audio.title,
        audioUrl: this.createSilentAudio(audio.duration),
        coverColor: getRandomCoverColor(),
        duration: audio.duration,
        createdAt: now - (PLACEHOLDER_AUDIOS.length - index) * 86400000
      };
      this.podcasts.push(podcast);

      const sampleNotes = [
        { timestamp: 120, content: '这个观点很有启发性，值得深入研究', tags: ['重要', '观点'] },
        { timestamp: 350, content: '提到的方法论可以应用到实际工作中', tags: ['方法论', '实践'] },
        { timestamp: 600, content: '案例分析很精彩，记录下来', tags: ['案例'] },
      ];

      sampleNotes.forEach((note, noteIndex) => {
        if (Math.random() > 0.3) {
          this.notes.push({
            id: generateId(),
            podcastId: podcast.id,
            timestamp: note.timestamp,
            content: note.content,
            tags: note.tags,
            createdAt: now - (3 - noteIndex) * 3600000,
            updatedAt: now - (3 - noteIndex) * 3600000
          });
        }
      });

      for (let i = 0; i < 4; i++) {
        const date = new Date(now - i * 86400000 * 2);
        this.listeningSessions.push({
          id: generateId(),
          podcastId: podcast.id,
          date: date.toISOString().split('T')[0],
          duration: Math.floor(Math.random() * 600) + 300
        });
      }
    });

    this.saveToStorage();
  }

  private createSilentAudio(duration: number): string {
    const sampleRate = 44100;
    const numChannels = 1;
    const bytesPerSample = 2;
    const byteRate = sampleRate * numChannels * bytesPerSample;
    const dataSize = duration * sampleRate * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  addPodcast(podcast: Omit<Podcast, 'id' | 'createdAt' | 'coverColor'>): Podcast {
    const newPodcast: Podcast = {
      ...podcast,
      id: generateId(),
      coverColor: getRandomCoverColor(),
      createdAt: Date.now()
    };
    this.podcasts.push(newPodcast);
    this.saveToStorage();
    return newPodcast;
  }

  getPodcasts(): Podcast[] {
    return [...this.podcasts].sort((a, b) => b.createdAt - a.createdAt);
  }

  getPodcastById(id: string): Podcast | undefined {
    return this.podcasts.find(p => p.id === id);
  }

  addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const now = Date.now();
    const newNote: Note = {
      ...note,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };
    this.notes.push(newNote);
    this.saveToStorage();
    return newNote;
  }

  updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'podcastId'>>): Note | undefined {
    const index = this.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      const updatedNote = {
        ...this.notes[index],
        ...updates,
        updatedAt: Date.now()
      };
      this.notes[index] = updatedNote;
      this.saveToStorage();
      return updatedNote;
    }
    return undefined;
  }

  deleteNote(id: string): boolean {
    const index = this.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getNotesByPodcast(podcastId: string): Note[] {
    return this.notes
      .filter(n => n.podcastId === podcastId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getNoteById(id: string): Note | undefined {
    return this.notes.find(n => n.id === id);
  }

  filterNotes(options: FilterOptions): Note[] {
    let result = [...this.notes];

    if (options.podcastId) {
      result = result.filter(n => n.podcastId === options.podcastId);
    }

    if (options.tag) {
      const tagLower = options.tag.toLowerCase();
      result = result.filter(n => 
        n.tags.some(t => t.toLowerCase().includes(tagLower))
      );
    }

    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      result = result.filter(n => 
        n.content.toLowerCase().includes(searchLower) ||
        n.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  getWeeklyListeningStats(): WeeklyStat[] {
    const weekMap = new Map<string, number>();

    this.listeningSessions.forEach(session => {
      const weekKey = getWeekKey(new Date(session.date));
      const current = weekMap.get(weekKey) || 0;
      weekMap.set(weekKey, current + session.duration);
    });

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, seconds]) => ({
        week,
        hours: Math.round((seconds / 3600) * 100) / 100
      }));

    return weeks;
  }

  getPodcastNoteStats(): PodcastNoteStat[] {
    const podcastNoteMap = new Map<string, number>();

    this.podcasts.forEach(podcast => {
      podcastNoteMap.set(podcast.id, 0);
    });

    this.notes.forEach(note => {
      const current = podcastNoteMap.get(note.podcastId) || 0;
      podcastNoteMap.set(note.podcastId, current + 1);
    });

    return this.podcasts.map(podcast => ({
      podcast: podcast.title.length > 8 ? podcast.title.substring(0, 8) + '...' : podcast.title,
      count: podcastNoteMap.get(podcast.id) || 0
    }));
  }

  getTotalStats(): TotalStats {
    const totalListeningSeconds = this.listeningSessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );

    return {
      totalListeningHours: Math.round((totalListeningSeconds / 3600) * 100) / 100,
      totalNotes: this.notes.length
    };
  }

  addListeningSession(session: Omit<ListeningSession, 'id'>): void {
    const newSession: ListeningSession = {
      ...session,
      id: generateId()
    };
    this.listeningSessions.push(newSession);
    this.saveToStorage();
  }

  getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }
}
