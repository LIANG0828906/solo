import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { seedWorkConfigs } from '../../data/seedData';
import { STORAGE_KEYS } from '../../utils/constants';
import type { Work, Milestone, WorkStatus, MilestoneType } from '../../types';

export class WorksManager {
  private works: Work[] = [];
  private listeners = new Set<(works: Work[]) => void>();

  subscribe(listener: (works: Work[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.works);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.works]));
  }

  getWorks(): Work[] {
    return [...this.works];
  }

  getWorkById(id: string): Work | undefined {
    return this.works.find((w) => w.id === id);
  }

  async loadFromStorage(): Promise<void> {
    try {
      const storedWorks = await get<Work[]>(STORAGE_KEYS.works);
      if (storedWorks && storedWorks.length > 0) {
        this.works = storedWorks;
      } else {
        await this.initializeSeedData();
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load works from IndexedDB:', error);
      await this.initializeSeedData();
      this.notifyListeners();
    }
  }

  private async initializeSeedData(): Promise<void> {
    this.works = seedWorkConfigs.map((config) => ({
      id: config.id,
      title: config.title,
      lyrics: config.lyrics,
      createdAt: config.createdAt,
      status: config.status,
      audioBase64: '',
      audioDuration: config.audioNotes.reduce((sum, n) => sum + n.duration, 0),
      coverColor: config.coverColor,
      milestones: config.milestones.map((m) => ({
        id: uuidv4(),
        workId: config.id,
        type: m.type as MilestoneType,
        title: m.title,
        description: m.description,
        date: m.date,
      })),
    }));
    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    try {
      await set(STORAGE_KEYS.works, this.works);
    } catch (error) {
      console.error('Failed to save works to IndexedDB:', error);
    }
  }

  async addWork(work: Omit<Work, 'id'>): Promise<Work> {
    const newWork: Work = {
      ...work,
      id: uuidv4(),
      milestones: work.milestones.map((m) => ({ ...m, id: uuidv4() })),
    };
    this.works.push(newWork);
    await this.saveToStorage();
    this.notifyListeners();
    return newWork;
  }

  async updateWork(id: string, updates: Partial<Work>): Promise<Work | null> {
    const index = this.works.findIndex((w) => w.id === id);
    if (index === -1) return null;

    this.works[index] = { ...this.works[index], ...updates };
    await this.saveToStorage();
    this.notifyListeners();
    return this.works[index];
  }

  async deleteWork(id: string): Promise<boolean> {
    const index = this.works.findIndex((w) => w.id === id);
    if (index === -1) return false;

    this.works.splice(index, 1);
    await this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  async addMilestone(
    workId: string,
    milestone: Omit<Milestone, 'id' | 'workId'>,
  ): Promise<Milestone | null> {
    const work = this.works.find((w) => w.id === workId);
    if (!work) return null;

    const newMilestone: Milestone = {
      ...milestone,
      id: uuidv4(),
      workId,
    };
    work.milestones.push(newMilestone);
    work.milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await this.saveToStorage();
    this.notifyListeners();
    return newMilestone;
  }

  filterWorks(status?: WorkStatus | 'all', dateRange?: { start: string | null; end: string | null }): Work[] {
    let filtered = [...this.works];

    if (status && status !== 'all') {
      filtered = filtered.filter((w) => w.status === status);
    }

    if (dateRange?.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter((w) => new Date(w.createdAt) >= startDate);
    }

    if (dateRange?.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((w) => new Date(w.createdAt) <= endDate);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAudioNotesForWork(workId: string): { freq: number; duration: number }[] {
    const config = seedWorkConfigs.find((c) => c.id === workId);
    if (config) {
      return config.audioNotes;
    }
    return [{ freq: 440, duration: 1 }];
  }
}

export const worksManager = new WorksManager();
