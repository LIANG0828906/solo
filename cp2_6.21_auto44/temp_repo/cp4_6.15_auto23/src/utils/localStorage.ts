import {
  SoundClip,
  Comment,
  UserProfile,
  UserRating,
} from '../types';

const SOUNDS_KEY = 'city_sound_map_sounds';
const COMMENTS_KEY = 'city_sound_map_comments';
const PROFILE_KEY = 'city_sound_map_profile';
const RATINGS_KEY = 'city_sound_map_ratings';

export function getSoundClips(): SoundClip[] {
  const data = localStorage.getItem(SOUNDS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return getDefaultSounds();
    }
  }
  return getDefaultSounds();
}

export function saveSoundClip(clip: SoundClip): void {
  const clips = getSoundClips();
  clips.push(clip);
  localStorage.setItem(SOUNDS_KEY, JSON.stringify(clips));
}

export function updateSoundClip(updated: SoundClip): void {
  const clips = getSoundClips().map((c) => (c.id === updated.id ? updated : c));
  localStorage.setItem(SOUNDS_KEY, JSON.stringify(clips));
}

export function deleteSoundClip(id: string): void {
  const clips = getSoundClips().filter((c) => c.id !== id);
  localStorage.setItem(SOUNDS_KEY, JSON.stringify(clips));
  const comments = getComments().filter((c) => c.soundClipId !== id);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

export function getComments(soundClipId?: string): Comment[] {
  const data = localStorage.getItem(COMMENTS_KEY);
  const all: Comment[] = data ? JSON.parse(data) : [];
  return soundClipId ? all.filter((c) => c.soundClipId === soundClipId) : all;
}

export function saveComment(comment: Comment): void {
  const comments = getComments();
  comments.push(comment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

export function getUserRatings(): UserRating[] {
  const data = localStorage.getItem(RATINGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function setUserRating(soundClipId: string, rating: number): void {
  const ratings = getUserRatings().filter((r) => r.soundClipId !== soundClipId);
  ratings.push({ soundClipId, rating });
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

export function getUserRating(soundClipId: string): number {
  const ratings = getUserRatings();
  const found = ratings.find((r) => r.soundClipId === soundClipId);
  return found ? found.rating : 0;
}

export function getUserProfile(): UserProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return createDefaultProfile();
    }
  }
  return createDefaultProfile();
}

function createDefaultProfile(): UserProfile {
  const profile: UserProfile = {
    id: 'user_1',
    name: '探索者',
    avatar: '🌍',
    clips: [],
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function updateUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function incrementPlayCount(soundClipId: string): void {
  const clips = getSoundClips();
  const clip = clips.find((c) => c.id === soundClipId);
  if (clip) {
    clip.playCount = (clip.playCount || 0) + 1;
    localStorage.setItem(SOUNDS_KEY, JSON.stringify(clips));
  }
}

function getDefaultSounds(): SoundClip[] {
  const defaults: SoundClip[] = [
    {
      id: 'demo_1',
      lat: 48.8566,
      lng: 2.3522,
      name: '巴黎地铁广播',
      category: 'traffic',
      description: '巴黎地铁站的经典广播提示音，伴随着列车进站的呼啸声',
      rating: 4.5,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      userId: 'user_1',
      playCount: 128,
    },
    {
      id: 'demo_2',
      lat: 35.6762,
      lng: 139.6503,
      name: '涩谷十字路口',
      category: 'crowd',
      description: '世界上最繁忙的十字路口，信号灯变化时千人同时穿越的壮观声响',
      rating: 4.8,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      userId: 'user_1',
      playCount: 256,
    },
    {
      id: 'demo_3',
      lat: 39.9042,
      lng: 116.4074,
      name: '北京胡同鸽哨',
      category: 'nature',
      description: '老北京胡同上空盘旋的鸽群，鸽哨声悠扬回荡',
      rating: 4.2,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      userId: 'user_1',
      playCount: 89,
    },
    {
      id: 'demo_4',
      lat: 40.7128,
      lng: -74.006,
      name: '纽约地铁站艺人',
      category: 'street_music',
      description: '纽约地铁站里即兴演奏的萨克斯风，旋律在站台上回响',
      rating: 4.7,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      userId: 'user_1',
      playCount: 312,
    },
    {
      id: 'demo_5',
      lat: -22.9068,
      lng: -43.1729,
      name: '里约桑巴鼓点',
      category: 'street_music',
      description: '里约街头即兴桑巴鼓表演，节奏热情奔放',
      rating: 4.6,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      userId: 'user_1',
      playCount: 178,
    },
    {
      id: 'demo_6',
      lat: 51.5074,
      lng: -0.1278,
      name: '伦敦大本钟',
      category: 'mechanical',
      description: '大本钟整点报时的钟声，伦敦的标志性声音',
      rating: 4.9,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      userId: 'user_1',
      playCount: 420,
    },
    {
      id: 'demo_7',
      lat: 31.2304,
      lng: 121.4737,
      name: '上海弄堂叫卖声',
      category: 'crowd',
      description: '老上海弄堂里小贩的吆喝声，充满市井烟火气',
      rating: 4.3,
      audioUrl: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      userId: 'user_1',
      playCount: 145,
    },
    {
      id: 'demo_8',
      lat: 13.7563,
      lng: 100.5018,
      name: '曼谷嘟嘟车引擎',
      category: 'mechanical',
      description: '曼谷街头嘟嘟车穿梭的引擎轰鸣声',
      rating: 3.8,
      audioUrl: '',
      createdAt: new Date().toISOString(),
      userId: 'user_1',
      playCount: 67,
    },
  ];
  localStorage.setItem(SOUNDS_KEY, JSON.stringify(defaults));
  return defaults;
}
