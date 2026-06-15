export type EmotionType = 'happy' | 'moved' | 'funny' | 'warm';

export interface Blessing {
  id: string;
  nickname: string;
  content: string;
  photos: string[];
  emotion: EmotionType;
  likes: number;
  createdAt: number;
  ip: string;
  likedByMe?: boolean;
}

export interface CheckinRecord {
  id: string;
  nickname: string;
  createdAt: number;
  ip: string;
}

export interface AppConfig {
  brideName: string;
  groomName: string;
  weddingDate: string;
  adminPassword: string;
  heroImage: string;
}

const KEY_BLESSINGS = 'wedding_blessings';
const KEY_CHECKINS = 'wedding_checkins';
const KEY_CONFIG = 'wedding_config';
const KEY_LIKES = 'wedding_my_likes';

const DEFAULT_CONFIG: AppConfig = {
  brideName: '李女士',
  groomName: '张先生',
  weddingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  adminPassword: 'admin',
  heroImage: ''
};

const IP_POOL = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉',
  '西安', '重庆', '苏州', '天津', '长沙', '青岛', '厦门', '大连'
];

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function randomIP(): string {
  return IP_POOL[Math.floor(Math.random() * IP_POOL.length)];
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export class DataManager {
  static getConfig(): AppConfig {
    const raw = localStorage.getItem(KEY_CONFIG);
    const cfg = safeParse<Partial<AppConfig>>(raw, {});
    return { ...DEFAULT_CONFIG, ...cfg };
  }

  static saveConfig(cfg: Partial<AppConfig>): void {
    const current = DataManager.getConfig();
    localStorage.setItem(KEY_CONFIG, JSON.stringify({ ...current, ...cfg }));
  }

  static getBlessings(): Blessing[] {
    const list = safeParse<Blessing[]>(localStorage.getItem(KEY_BLESSINGS), []);
    const myLikes = DataManager.getMyLikes();
    return list.map(b => ({ ...b, likedByMe: myLikes.has(b.id) }));
  }

  static addBlessing(b: Omit<Blessing, 'id' | 'likes' | 'createdAt' | 'ip'>): Blessing {
    const list = safeParse<Blessing[]>(localStorage.getItem(KEY_BLESSINGS), []);
    const blessing: Blessing = {
      ...b,
      id: genId(),
      likes: 0,
      createdAt: Date.now(),
      ip: randomIP()
    };
    list.unshift(blessing);
    localStorage.setItem(KEY_BLESSINGS, JSON.stringify(list));
    DataManager.addCheckin(b.nickname);
    return blessing;
  }

  static deleteBlessings(ids: string[]): void {
    const set = new Set(ids);
    const list = safeParse<Blessing[]>(localStorage.getItem(KEY_BLESSINGS), [])
      .filter(b => !set.has(b.id));
    localStorage.setItem(KEY_BLESSINGS, JSON.stringify(list));
  }

  static searchBlessings(keyword: string, emotion?: EmotionType): Blessing[] {
    let list = DataManager.getBlessings();
    if (emotion) list = list.filter(b => b.emotion === emotion);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(b =>
        b.nickname.toLowerCase().includes(kw) ||
        b.content.toLowerCase().includes(kw)
      );
    }
    return list;
  }

  private static getMyLikes(): Set<string> {
    return new Set(safeParse<string[]>(localStorage.getItem(KEY_LIKES), []));
  }

  private static saveMyLikes(set: Set<string>): void {
    localStorage.setItem(KEY_LIKES, JSON.stringify(Array.from(set)));
  }

  static likeBlessing(id: string): { liked: boolean; likes: number } {
    const list = safeParse<Blessing[]>(localStorage.getItem(KEY_BLESSINGS), []);
    const myLikes = DataManager.getMyLikes();
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) return { liked: false, likes: 0 };
    let liked: boolean;
    if (myLikes.has(id)) {
      myLikes.delete(id);
      list[idx].likes = Math.max(0, list[idx].likes - 1);
      liked = false;
    } else {
      myLikes.add(id);
      list[idx].likes = list[idx].likes + 1;
      liked = true;
    }
    DataManager.saveMyLikes(myLikes);
    localStorage.setItem(KEY_BLESSINGS, JSON.stringify(list));
    return { liked, likes: list[idx].likes };
  }

  static getCheckins(): CheckinRecord[] {
    return safeParse<CheckinRecord[]>(localStorage.getItem(KEY_CHECKINS), []);
  }

  static addCheckin(nickname: string): CheckinRecord {
    const list = DataManager.getCheckins();
    const rec: CheckinRecord = {
      id: genId(),
      nickname,
      createdAt: Date.now(),
      ip: randomIP()
    };
    list.unshift(rec);
    localStorage.setItem(KEY_CHECKINS, JSON.stringify(list));
    return rec;
  }

  static exportBlessingsJSON(): string {
    const data = {
      exportAt: new Date().toISOString(),
      blessings: DataManager.getBlessings()
    };
    return JSON.stringify(data, null, 2);
  }

  static exportCheckinsCSV(): string {
    const list = DataManager.getCheckins();
    const header = ['昵称', '签到时间', 'IP属地'];
    const rows = list.map(r => [
      r.nickname,
      new Date(r.createdAt).toLocaleString('zh-CN'),
      r.ip
    ]);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
  }

  static getStats(): { totalBlessings: number; totalPhotos: number; avgWords: number } {
    const list = DataManager.getBlessings();
    const totalBlessings = list.length;
    const totalPhotos = list.reduce((s, b) => s + b.photos.length, 0);
    const totalWords = list.reduce((s, b) => s + b.content.length, 0);
    const avgWords = totalBlessings > 0 ? Math.round(totalWords / totalBlessings) : 0;
    return { totalBlessings, totalPhotos, avgWords };
  }

  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const EMOTION_META: Record<EmotionType, { label: string; emoji: string; bg: string; color: string }> = {
  happy:  { label: '开心',  emoji: '😊', bg: '#fff0f0', color: '#ff6b6b' },
  moved:  { label: '感动',  emoji: '🥹', bg: '#eef2ff', color: '#6366f1' },
  funny:  { label: '搞笑',  emoji: '😂', bg: '#fef9c3', color: '#d97706' },
  warm:   { label: '温馨',  emoji: '💖', bg: '#fce7f3', color: '#db2777' }
};
