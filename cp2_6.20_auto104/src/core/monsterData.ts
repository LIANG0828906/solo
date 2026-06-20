export type MonsterType = 'skeleton' | 'frost_spider' | 'fire_elemental' | 'shadow_assassin' | 'goblin_mage';

export interface Monster {
  id: string;
  type: MonsterType;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  gridX: number;
  gridY: number;
  svgAvatar: string;
  patrolPath: { x: number; y: number }[];
  color: string;
}

export interface MonsterTemplate {
  type: MonsterType;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  svgAvatar: string;
  color: string;
}

export const monsters: MonsterTemplate[] = [
  {
    type: 'skeleton',
    name: '骷髅兵',
    hp: 120,
    attack: 15,
    speed: 2,
    color: '#c8c8c8',
    svgAvatar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="12" r="8" fill="#c8c8c8" stroke="#888" stroke-width="1"/>
      <rect x="10" y="9" width="4" height="3" rx="1" fill="#333"/>
      <rect x="18" y="9" width="4" height="3" rx="1" fill="#333"/>
      <rect x="13" y="14" width="6" height="2" rx="1" fill="#555"/>
      <line x1="14" y1="14" x2="14" y2="16" stroke="#555" stroke-width="1"/>
      <line x1="16" y1="14" x2="16" y2="16" stroke="#555" stroke-width="1"/>
      <line x1="18" y1="14" x2="18" y2="16" stroke="#555" stroke-width="1"/>
      <rect x="12" y="20" width="8" height="10" rx="2" fill="#c8c8c8" stroke="#888" stroke-width="1"/>
      <line x1="16" y1="20" x2="16" y2="30" stroke="#999" stroke-width="0.5"/>
    </svg>`,
  },
  {
    type: 'frost_spider',
    name: '冰霜蜘蛛',
    hp: 80,
    attack: 25,
    speed: 4,
    color: '#88ccff',
    svgAvatar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="16" rx="8" ry="6" fill="#88ccff" stroke="#4499cc" stroke-width="1"/>
      <circle cx="14" cy="14" r="2" fill="#2266aa"/>
      <circle cx="18" cy="14" r="2" fill="#2266aa"/>
      <line x1="8" y1="12" x2="2" y2="6" stroke="#88ccff" stroke-width="1.5"/>
      <line x1="8" y1="18" x2="2" y2="22" stroke="#88ccff" stroke-width="1.5"/>
      <line x1="24" y1="12" x2="30" y2="6" stroke="#88ccff" stroke-width="1.5"/>
      <line x1="24" y1="18" x2="30" y2="22" stroke="#88ccff" stroke-width="1.5"/>
      <line x1="10" y1="10" x2="4" y2="4" stroke="#88ccff" stroke-width="1"/>
      <line x1="22" y1="10" x2="28" y2="4" stroke="#88ccff" stroke-width="1"/>
      <line x1="10" y1="20" x2="4" y2="26" stroke="#88ccff" stroke-width="1"/>
      <line x1="22" y1="20" x2="28" y2="26" stroke="#88ccff" stroke-width="1"/>
      <circle cx="14" cy="14" r="1" fill="#fff"/>
      <circle cx="18" cy="14" r="1" fill="#fff"/>
    </svg>`,
  },
  {
    type: 'fire_elemental',
    name: '火焰元素',
    hp: 200,
    attack: 40,
    speed: 2,
    color: '#ff6633',
    svgAvatar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4 C20 10 24 12 24 18 C24 24 20 28 16 28 C12 28 8 24 8 18 C8 12 12 10 16 4Z" fill="#ff6633" stroke="#cc3300" stroke-width="1"/>
      <path d="M16 10 C18 14 20 15 20 19 C20 22 18 24 16 24 C14 24 12 22 12 19 C12 15 14 14 16 10Z" fill="#ffaa33" stroke="none"/>
      <path d="M16 16 C17 18 18 18 18 20 C18 21 17 22 16 22 C15 22 14 21 14 20 C14 18 15 18 16 16Z" fill="#ffdd66" stroke="none"/>
    </svg>`,
  },
  {
    type: 'shadow_assassin',
    name: '暗影刺客',
    hp: 60,
    attack: 45,
    speed: 5,
    color: '#9933cc',
    svgAvatar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4 L12 12 L8 14 L10 18 L8 28 L16 24 L24 28 L22 18 L24 14 L20 12 Z" fill="#9933cc" stroke="#660099" stroke-width="1"/>
      <ellipse cx="14" cy="13" rx="1.5" ry="2" fill="#cc66ff"/>
      <ellipse cx="18" cy="13" rx="1.5" ry="2" fill="#cc66ff"/>
      <path d="M14 18 L16 20 L18 18" fill="none" stroke="#cc66ff" stroke-width="1"/>
    </svg>`,
  },
  {
    type: 'goblin_mage',
    name: '哥布林法师',
    hp: 90,
    attack: 35,
    speed: 3,
    color: '#33cc66',
    svgAvatar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="14" rx="7" ry="8" fill="#33cc66" stroke="#1a8844" stroke-width="1"/>
      <polygon points="10,8 8,2 12,6" fill="#33cc66" stroke="#1a8844" stroke-width="0.5"/>
      <polygon points="22,8 24,2 20,6" fill="#33cc66" stroke="#1a8844" stroke-width="0.5"/>
      <circle cx="14" cy="12" r="2" fill="#ff0"/>
      <circle cx="18" cy="12" r="2" fill="#ff0"/>
      <circle cx="14" cy="12" r="1" fill="#000"/>
      <circle cx="18" cy="12" r="1" fill="#000"/>
      <path d="M13 17 Q16 19 19 17" fill="none" stroke="#1a8844" stroke-width="1"/>
      <rect x="22" y="6" width="2" height="16" rx="1" fill="#8B4513" stroke="#5C2E00" stroke-width="0.5"/>
      <circle cx="23" cy="5" r="3" fill="#8833ff" stroke="#6611cc" stroke-width="0.5"/>
      <circle cx="23" cy="5" r="1.5" fill="#cc88ff"/>
    </svg>`,
  },
];
