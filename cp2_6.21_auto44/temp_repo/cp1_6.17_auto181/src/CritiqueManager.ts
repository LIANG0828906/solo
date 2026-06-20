import axios from 'axios';

export interface Critique {
  id: string;
  workId: string;
  x: number;
  y: number;
  text: string;
  color: 'red' | 'yellow' | 'blue' | 'green';
  userId: string;
  userName: string;
  createdAt: string;
  replies: CritiqueReply[];
}

export interface CritiqueReply {
  id: string;
  critiqueId: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
  level: number;
  parentId: string;
}

export interface CritiqueStats {
  total: number;
  byColor: {
    red: number;
    yellow: number;
    blue: number;
    green: number;
  };
}

const COLOR_MAP: Record<string, string> = {
  red: '#C23B22',
  yellow: '#D4A373',
  blue: '#4A7C59',
  green: '#4A7C59'
};

export class CritiqueManager {
  private critiques: Critique[] = [];
  private workId: string;
  private onCritiquesChange?: (critiques: Critique[]) => void;

  constructor(workId: string) {
    this.workId = workId;
  }

  setOnCritiquesChange(callback: (critiques: Critique[]) => void): void {
    this.onCritiquesChange = callback;
  }

  getCritiques(): Critique[] {
    return this.critiques;
  }

  async loadCritiques(): Promise<Critique[]> {
    try {
      const response = await axios.get(`/api/critiques/${this.workId}`);
      this.critiques = response.data;
      if (this.onCritiquesChange) {
        this.onCritiquesChange(this.critiques);
      }
      return this.critiques;
    } catch (error) {
      console.error('Failed to load critiques:', error);
      return [];
    }
  }

  async addCritique(data: {
    x: number;
    y: number;
    text: string;
    color: 'red' | 'yellow' | 'blue' | 'green';
    userId: string;
    userName: string;
  }): Promise<Critique | null> {
    try {
      const response = await axios.post('/api/critiques', {
        workId: this.workId,
        ...data
      });
      const newCritique = response.data;
      this.critiques.push(newCritique);
      if (this.onCritiquesChange) {
        this.onCritiquesChange(this.critiques);
      }
      return newCritique;
    } catch (error) {
      console.error('Failed to add critique:', error);
      return null;
    }
  }

  async addReply(data: {
    critiqueId: string;
    text: string;
    userId: string;
    userName: string;
    parentId: string;
    level: number;
  }): Promise<CritiqueReply | null> {
    try {
      const response = await axios.post('/api/critiques/reply', data);
      const reply = response.data;
      
      const critique = this.critiques.find(c => c.id === data.critiqueId);
      if (critique) {
        critique.replies.push(reply);
        if (this.onCritiquesChange) {
          this.onCritiquesChange(this.critiques);
        }
      }
      return reply;
    } catch (error) {
      console.error('Failed to add reply:', error);
      return null;
    }
  }

  getStats(): CritiqueStats {
    const stats: CritiqueStats = {
      total: this.critiques.length,
      byColor: { red: 0, yellow: 0, blue: 0, green: 0 }
    };

    for (const critique of this.critiques) {
      if (stats.byColor.hasOwnProperty(critique.color)) {
        stats.byColor[critique.color]++;
      }
    }

    return stats;
  }

  getColorHex(color: string): string {
    return COLOR_MAP[color] || '#C23B22';
  }

  resolveConflicts(newCritiques: Critique[]): Critique[] {
    const existingMap = new Map(this.critiques.map(c => [c.id, c]));
    
    for (const newCritique of newCritiques) {
      const existing = existingMap.get(newCritique.id);
      if (!existing) {
        this.critiques.push(newCritique);
      } else {
        if (new Date(newCritique.createdAt) > new Date(existing.createdAt)) {
          const index = this.critiques.findIndex(c => c.id === newCritique.id);
          if (index !== -1) {
            this.critiques[index] = newCritique;
          }
        }
      }
    }

    if (this.onCritiquesChange) {
      this.onCritiquesChange(this.critiques);
    }

    return this.critiques;
  }

  static getColorHex(color: string): string {
    return COLOR_MAP[color] || '#C23B22';
  }
}
