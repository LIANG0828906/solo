import type {
  WordDetail,
  Example,
  CollectionWord,
  LearningStats,
  LookupWordRequest,
  LookupWordResponse,
  CollectionRequest
} from '../types';

const API_BASE = '/api';

class WordService {
  private cache: Map<string, WordDetail> = new Map();
  private cacheSize = 100;

  async getWordDetail(word: string, context: string, paragraph: string): Promise<WordDetail | null> {
    const cacheKey = `${word.toLowerCase()}_${context.substring(0, 50)}`;
    
    if (this.cache.has(cacheKey)) {
      console.log(`[WordService] Cache hit for "${word}"`);
      return this.cache.get(cacheKey)!;
    }

    const startTime = performance.now();
    
    try {
      const requestBody: LookupWordRequest = { word, context, paragraph };
      
      const response = await fetch(`${API_BASE}/word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: LookupWordResponse = await response.json();
      
      const duration = performance.now() - startTime;
      console.log(`[WordService] API call completed in ${duration.toFixed(2)}ms`);

      if (data.success && data.data) {
        if (this.cache.size >= this.cacheSize) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey !== undefined) {
            this.cache.delete(firstKey);
          }
        }
        this.cache.set(cacheKey, data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[WordService] Error fetching word detail:', error);
      return null;
    }
  }

  async getSentenceExamples(word: string): Promise<Example[]> {
    try {
      const response = await fetch(`${API_BASE}/sentence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('[WordService] Error fetching examples:', error);
      return [];
    }
  }

  async addToCollection(word: string, lemma: string, contextSentence: string): Promise<CollectionWord | null> {
    try {
      const requestBody: CollectionRequest = { word, lemma, contextSentence };
      
      const response = await fetch(`${API_BASE}/collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[WordService] Error adding to collection:', error);
      return null;
    }
  }

  async removeFromCollection(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/collection/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('[WordService] Error removing from collection:', error);
      return false;
    }
  }

  async getCollections(): Promise<CollectionWord[]> {
    try {
      const response = await fetch(`${API_BASE}/collection`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('[WordService] Error fetching collections:', error);
      return [];
    }
  }

  async checkIfCollected(lemma: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/collection/check/${lemma}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.isCollected;
      }

      return false;
    } catch (error) {
      console.error('[WordService] Error checking collection status:', error);
      return false;
    }
  }

  async getStats(): Promise<LearningStats | null> {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[WordService] Error fetching stats:', error);
      return null;
    }
  }

  async getDueWords(): Promise<CollectionWord[]> {
    try {
      const response = await fetch(`${API_BASE}/stats/review`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('[WordService] Error fetching due words:', error);
      return [];
    }
  }

  async submitReviewResult(id: string, quality: number): Promise<CollectionWord | null> {
    try {
      const response = await fetch(`${API_BASE}/stats/review/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quality }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[WordService] Error submitting review result:', error);
      return null;
    }
  }

  async getArticle() {
    try {
      const response = await fetch(`${API_BASE}/article`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('[WordService] Error fetching article:', error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const wordService = new WordService();
