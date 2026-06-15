export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeData {
  id: BadgeTier;
  name: string;
  description: string;
  threshold: number;
  color: string;
}

export const BADGE_DEFS: BadgeData[] = [
  {
    id: 'bronze',
    name: '铜音徽章',
    description: '节奏入门 · 1000分解锁',
    threshold: 1000,
    color: '#cd7f32'
  },
  {
    id: 'silver',
    name: '银星徽章',
    description: '节拍高手 · 2000分解锁',
    threshold: 2000,
    color: '#c0c0c0'
  },
  {
    id: 'gold',
    name: '金冠徽章',
    description: '舞台之王 · 3000分解锁',
    threshold: 3000,
    color: '#ffd700'
  }
];

export class BadgeManager {
  private unlocked: Set<BadgeTier> = new Set();
  private listeners: Set<(badges: BadgeTier[]) => void> = new Set();
  private lastScore = 0;

  reset(): void {
    this.unlocked.clear();
    this.lastScore = 0;
    this.emit();
  }

  updateScore(score: number): BadgeTier[] {
    this.lastScore = score;
    const newlyUnlocked: BadgeTier[] = [];
    for (const def of BADGE_DEFS) {
      if (score >= def.threshold && !this.unlocked.has(def.id)) {
        this.unlocked.add(def.id);
        newlyUnlocked.push(def.id);
      }
    }
    if (newlyUnlocked.length > 0) {
      this.emit();
    }
    return newlyUnlocked;
  }

  getUnlocked(): BadgeTier[] {
    return Array.from(this.unlocked);
  }

  isUnlocked(id: BadgeTier): boolean {
    return this.unlocked.has(id);
  }

  onUpdate(fn: (badges: BadgeTier[]) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const list = this.getUnlocked();
    for (const fn of this.listeners) fn(list);
  }

  renderBadgeSVG(id: BadgeTier, size = 64): string {
    const def = BADGE_DEFS.find(d => d.id === id)!;
    if (id === 'bronze') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="bronzeG" cx="50%" cy="40%">
            <stop offset="0%" stop-color="#e8a860"/>
            <stop offset="60%" stop-color="#cd7f32"/>
            <stop offset="100%" stop-color="#8b5a1f"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="url(#bronzeG)" stroke="#6b3e14" stroke-width="3"/>
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2"/>
        <text x="50" y="60" text-anchor="middle" font-size="38" fill="#3d1f08">♪</text>
      </svg>`;
    }
    if (id === 'silver') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="silverG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#d0d0d0"/>
            <stop offset="100%" stop-color="#8a8a8a"/>
          </linearGradient>
        </defs>
        <polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38"
                 fill="url(#silverG)" stroke="#5a5a5a" stroke-width="2"/>
        <text x="50" y="60" text-anchor="middle" font-size="26" fill="#3a3a3a">★</text>
      </svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="goldG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fff7a8"/>
          <stop offset="50%" stop-color="#ffd700"/>
          <stop offset="100%" stop-color="#c99400"/>
        </linearGradient>
      </defs>
      <path d="M20 70 L30 40 L40 55 L50 30 L60 55 L70 40 L80 70 Z"
            fill="url(#goldG)" stroke="#8a6200" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="50" cy="78" r="16" fill="url(#goldG)" stroke="#8a6200" stroke-width="2"/>
      <circle cx="30" cy="40" r="3.5" fill="#fff7a8"/>
      <circle cx="70" cy="40" r="3.5" fill="#fff7a8"/>
      <circle cx="50" cy="30" r="3.5" fill="#fff7a8"/>
      <text x="50" y="84" text-anchor="middle" font-size="16" fill="#6a4a00" font-weight="bold">♛</text>
    </svg>`;
  }
}

export const badgeManager = new BadgeManager();
