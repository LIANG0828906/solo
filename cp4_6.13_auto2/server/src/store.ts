import type { CollectionWord, LearningStats, SM2Metrics } from './types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_FILE = path.join(__dirname, '..', 'data', 'collections.json');

interface StoreState {
  collections: CollectionWord[];
  todayLearnedWords: Set<string>;
}

class WordStore {
  private state: StoreState;
  
  constructor() {
    this.state = {
      collections: [],
      todayLearnedWords: new Set()
    };
    this.loadFromStorage();
  }
  
  private loadFromStorage(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const stored = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(stored);
        this.state.collections = data.collections || [];
        this.state.todayLearnedWords = new Set(data.todayLearned || []);
      }
    } catch (e) {
      console.log('[Store] No existing data found, using memory storage');
    }
  }
  
  private saveToStorage(): void {
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE, JSON.stringify({
        collections: this.state.collections,
        todayLearned: Array.from(this.state.todayLearnedWords)
      }, null, 2));
    } catch (e) {
      console.log('[Store] Failed to save to file, using memory only');
    }
  }
  
  private calculateSM2(quality: number, metrics: SM2Metrics): SM2Metrics {
    let { easeFactor, interval, repetitions } = metrics;
    
    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }
    
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    
    return { easeFactor, interval, repetitions };
  }
  
  addWord(word: string, lemma: string, contextSentence: string): CollectionWord {
    const existingIndex = this.state.collections.findIndex(
      c => c.lemma === lemma || c.word === word
    );
    
    if (existingIndex >= 0) {
      const existing = this.state.collections[existingIndex];
      existing.collectedAt = Date.now();
      existing.contextSentence = contextSentence;
      this.saveToStorage();
      return existing;
    }
    
    const now = Date.now();
    const newWord: CollectionWord = {
      id: `col_${now}_${Math.random().toString(36).substr(2, 9)}`,
      word: word.toLowerCase(),
      lemma,
      contextSentence,
      collectedAt: now,
      reviewCount: 0,
      easeFactor: 2.5,
      interval: 1,
      nextReviewAt: now + 24 * 60 * 60 * 1000
    };
    
    this.state.collections.push(newWord);
    this.state.todayLearnedWords.add(lemma);
    this.saveToStorage();
    
    return newWord;
  }
  
  removeWord(id: string): boolean {
    const index = this.state.collections.findIndex(c => c.id === id);
    if (index >= 0) {
      this.state.collections.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }
  
  getCollections(): CollectionWord[] {
    return [...this.state.collections];
  }
  
  getDueWords(): CollectionWord[] {
    const now = Date.now();
    return this.state.collections.filter(c => c.nextReviewAt <= now);
  }
  
  updateReviewResult(id: string, quality: number): CollectionWord | null {
    const word = this.state.collections.find(c => c.id === id);
    if (!word) return null;
    
    const metrics: SM2Metrics = {
      easeFactor: word.easeFactor,
      interval: word.interval,
      repetitions: word.reviewCount
    };
    
    const newMetrics = this.calculateSM2(quality, metrics);
    
    word.reviewCount = newMetrics.repetitions;
    word.easeFactor = newMetrics.easeFactor;
    word.interval = newMetrics.interval;
    word.nextReviewAt = Date.now() + newMetrics.interval * 24 * 60 * 60 * 1000;
    word.lastReviewedAt = Date.now();
    
    this.saveToStorage();
    return word;
  }
  
  getStats(): LearningStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    
    const todayLearned = this.state.collections.filter(
      c => c.collectedAt >= todayStart
    ).length;
    
    const dueForReview = this.state.collections.filter(
      c => c.nextReviewAt <= Date.now()
    ).length;
    
    return {
      todayLearned,
      totalCollected: this.state.collections.length,
      dueForReview
    };
  }
  
  isWordCollected(lemma: string): boolean {
    return this.state.collections.some(c => c.lemma === lemma);
  }
}

export const wordStore = new WordStore();
