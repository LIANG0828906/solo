import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../../utils/constants';
import { generateVotesForWorks } from '../../data/seedData';
import type { Vote, VoteStats, Work } from '../../types';

export class VoteManager {
  private votes: Vote[] = [];
  private listeners = new Set<(votes: Vote[]) => void>();
  private isSaving = false;
  private pendingVotes: Vote[] = [];
  private saveRetryCount = 0;

  subscribe(listener: (votes: Vote[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.votes);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.votes]));
  }

  getVotes(): Vote[] {
    return [...this.votes];
  }

  getVotesForWork(workId: string): Vote[] {
    return this.votes
      .filter((v) => v.workId === workId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getStatsForWork(workId: string): VoteStats {
    const workVotes = this.votes.filter((v) => v.workId === workId);
    if (workVotes.length === 0) {
      return { averageScore: 0, totalVotes: 0 };
    }
    const totalScore = workVotes.reduce((sum, v) => sum + v.score, 0);
    return {
      averageScore: Math.round((totalScore / workVotes.length) * 10) / 10,
      totalVotes: workVotes.length,
    };
  }

  async loadFromStorage(): Promise<void> {
    try {
      const storedVotes = await get<Vote[]>(STORAGE_KEYS.votes);
      if (storedVotes && storedVotes.length > 0) {
        this.votes = storedVotes;
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load votes from IndexedDB:', error);
      this.notifyListeners();
    }
  }

  async initializeSeedVotes(works: Work[]): Promise<void> {
    if (this.votes.length === 0 && works.length > 0) {
      this.votes = generateVotesForWorks(works);
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  private async saveToStorage(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    try {
      const allVotes = [...this.votes, ...this.pendingVotes];
      await set(STORAGE_KEYS.votes, allVotes);
      this.votes = allVotes;
      this.pendingVotes = [];
      this.saveRetryCount = 0;
    } catch (error) {
      console.error('Failed to save votes to IndexedDB:', error);
      this.saveRetryCount++;
      if (this.saveRetryCount < 3) {
        setTimeout(() => {
          this.isSaving = false;
          this.saveToStorage();
        }, 100 * this.saveRetryCount);
        return;
      }
      this.saveRetryCount = 0;
    } finally {
      if (this.saveRetryCount === 0) {
        this.isSaving = false;
      }
    }
  }

  private async processPendingVotes(): Promise<void> {
    if (this.pendingVotes.length > 0 && !this.isSaving) {
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  async addVote(workId: string, score: number, comment: string = ''): Promise<Vote> {
    const newVote: Vote = {
      id: uuidv4(),
      workId,
      score: Math.max(1, Math.min(5, score)),
      comment: comment.slice(0, 200),
      createdAt: new Date().toISOString(),
    };

    this.pendingVotes.push(newVote);
    const optimisticVotes = [...this.votes, ...this.pendingVotes];
    this.listeners.forEach((listener) => listener([...optimisticVotes]));

    if (!this.isSaving) {
      await this.saveToStorage();
      this.notifyListeners();
    } else {
      setTimeout(() => this.processPendingVotes(), 100);
    }

    return newVote;
  }

  async deleteVote(voteId: string): Promise<boolean> {
    const index = this.votes.findIndex((v) => v.id === voteId);
    if (index === -1) return false;

    this.votes.splice(index, 1);
    await this.saveToStorage();
    this.notifyListeners();
    return true;
  }
}

export const voteManager = new VoteManager();
