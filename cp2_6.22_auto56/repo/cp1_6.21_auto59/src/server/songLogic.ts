export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  energy: number;
  valence: number;
  duration: number;
}

export interface SceneMoodMapping {
  energyRange: [number, number];
  valenceRange: [number, number];
  bpmRange: [number, number];
  preferredGenres: string[];
}

export const sceneMoodMap: Record<string, Record<string, SceneMoodMapping>> = {
  fitness: {
    excited: {
      energyRange: [0.7, 1.0],
      valenceRange: [0.5, 1.0],
      bpmRange: [120, 180],
      preferredGenres: ['电子', '摇滚', '嘻哈', '流行'],
    },
    relaxed: {
      energyRange: [0.4, 0.7],
      valenceRange: [0.4, 0.7],
      bpmRange: [90, 120],
      preferredGenres: ['流行', '电子', 'R&B'],
    },
    melancholy: {
      energyRange: [0.3, 0.6],
      valenceRange: [0.1, 0.4],
      bpmRange: [70, 100],
      preferredGenres: ['摇滚', '独立', '民谣'],
    },
  },
  reading: {
    excited: {
      energyRange: [0.3, 0.6],
      valenceRange: [0.5, 0.8],
      bpmRange: [80, 110],
      preferredGenres: ['轻音乐', '古典', '爵士', '民谣'],
    },
    relaxed: {
      energyRange: [0.1, 0.4],
      valenceRange: [0.4, 0.7],
      bpmRange: [60, 90],
      preferredGenres: ['轻音乐', '古典', '环境', '爵士'],
    },
    melancholy: {
      energyRange: [0.1, 0.3],
      valenceRange: [0.1, 0.4],
      bpmRange: [60, 85],
      preferredGenres: ['古典', '轻音乐', '独立'],
    },
  },
  commute: {
    excited: {
      energyRange: [0.5, 0.8],
      valenceRange: [0.5, 0.9],
      bpmRange: [100, 140],
      preferredGenres: ['流行', '电子', '嘻哈', '摇滚'],
    },
    relaxed: {
      energyRange: [0.3, 0.6],
      valenceRange: [0.4, 0.7],
      bpmRange: [80, 110],
      preferredGenres: ['流行', 'R&B', '爵士', '民谣'],
    },
    melancholy: {
      energyRange: [0.2, 0.5],
      valenceRange: [0.1, 0.4],
      bpmRange: [70, 100],
      preferredGenres: ['独立', '摇滚', '民谣'],
    },
  },
  party: {
    excited: {
      energyRange: [0.7, 1.0],
      valenceRange: [0.6, 1.0],
      bpmRange: [110, 170],
      preferredGenres: ['电子', '嘻哈', '流行', '摇滚'],
    },
    relaxed: {
      energyRange: [0.5, 0.8],
      valenceRange: [0.5, 0.8],
      bpmRange: [90, 120],
      preferredGenres: ['流行', 'R&B', '电子'],
    },
    melancholy: {
      energyRange: [0.4, 0.7],
      valenceRange: [0.2, 0.5],
      bpmRange: [80, 110],
      preferredGenres: ['摇滚', '独立', '流行'],
    },
  },
};

export const mockSongs: Song[] = [
  { id: '1', title: '午夜城市', artist: 'M83', genre: '电子', bpm: 120, energy: 0.85, valence: 0.7, duration: 240 },
  { id: '2', title: '夜空中最亮的星', artist: '逃跑计划', genre: '摇滚', bpm: 130, energy: 0.78, valence: 0.55, duration: 252 },
  { id: '3', title: '晴天', artist: '周杰伦', genre: '流行', bpm: 115, energy: 0.65, valence: 0.75, duration: 269 },
  { id: '4', title: '月光奏鸣曲', artist: '贝多芬', genre: '古典', bpm: 70, energy: 0.15, valence: 0.35, duration: 320 },
  { id: '5', title: '成都', artist: '赵雷', genre: '民谣', bpm: 85, energy: 0.35, valence: 0.45, duration: 328 },
  { id: '6', title: '海阔天空', artist: 'Beyond', genre: '摇滚', bpm: 140, energy: 0.82, valence: 0.6, duration: 326 },
  { id: '7', title: 'Closer', artist: 'The Chainsmokers', genre: '电子', bpm: 95, energy: 0.72, valence: 0.65, duration: 244 },
  { id: '8', title: '稻香', artist: '周杰伦', genre: '流行', bpm: 88, energy: 0.55, valence: 0.8, duration: 223 },
  { id: '9', title: 'River Flows in You', artist: 'Yiruma', genre: '轻音乐', bpm: 75, energy: 0.2, valence: 0.5, duration: 210 },
  { id: '10', title: 'Bad Guy', artist: 'Billie Eilish', genre: '流行', bpm: 135, energy: 0.68, valence: 0.55, duration: 194 },
  { id: '11', title: 'Bohemian Rhapsody', artist: 'Queen', genre: '摇滚', bpm: 72, energy: 0.5, valence: 0.3, duration: 354 },
  { id: '12', title: 'Shape of You', artist: 'Ed Sheeran', genre: '流行', bpm: 96, energy: 0.8, valence: 0.9, duration: 233 },
  { id: '13', title: 'Weightless', artist: 'Marconi Union', genre: '环境', bpm: 60, energy: 0.1, valence: 0.4, duration: 480 },
  { id: '14', title: 'Uptown Funk', artist: 'Bruno Mars', genre: '流行', bpm: 115, energy: 0.95, valence: 0.95, duration: 270 },
  { id: '15', title: '安河桥', artist: '宋冬野', genre: '民谣', bpm: 78, energy: 0.3, valence: 0.25, duration: 348 },
  { id: '16', title: 'Faded', artist: 'Alan Walker', genre: '电子', bpm: 90, energy: 0.6, valence: 0.35, duration: 212 },
  { id: '17', title: '青花瓷', artist: '周杰伦', genre: '流行', bpm: 80, energy: 0.45, valence: 0.6, duration: 239 },
  { id: '18', title: 'Take Five', artist: 'Dave Brubeck', genre: '爵士', bpm: 96, energy: 0.4, valence: 0.55, duration: 325 },
  { id: '19', title: 'Sicko Mode', artist: 'Travis Scott', genre: '嘻哈', bpm: 150, energy: 0.9, valence: 0.5, duration: 312 },
  { id: '20', title: '梦里水乡', artist: '江珊', genre: '流行', bpm: 72, energy: 0.35, valence: 0.5, duration: 275 },
  { id: '21', title: 'Strobe', artist: 'Deadmau5', genre: '电子', bpm: 128, energy: 0.75, valence: 0.65, duration: 630 },
  { id: '22', title: '平凡之路', artist: '朴树', genre: '独立', bpm: 92, energy: 0.5, valence: 0.35, duration: 290 },
  { id: '23', title: 'Blinding Lights', artist: 'The Weeknd', genre: '流行', bpm: 171, energy: 0.92, valence: 0.85, duration: 200 },
  { id: '24', title: '一生所爱', artist: '卢冠廷', genre: '流行', bpm: 68, energy: 0.25, valence: 0.2, duration: 264 },
  { id: '25', title: 'Canon in D', artist: 'Pachelbel', genre: '古典', bpm: 65, energy: 0.2, valence: 0.6, duration: 300 },
  { id: '26', title: 'Humble', artist: 'Kendrick Lamar', genre: '嘻哈', bpm: 150, energy: 0.88, valence: 0.4, duration: 177 },
  { id: '27', title: 'Breathe', artist: 'Telepopmusik', genre: '电子', bpm: 85, energy: 0.25, valence: 0.45, duration: 260 },
  { id: '28', title: '后会无期', artist: '邓紫棋', genre: '流行', bpm: 76, energy: 0.4, valence: 0.25, duration: 235 },
  { id: '29', title: 'So What', artist: 'Miles Davis', genre: '爵士', bpm: 110, energy: 0.55, valence: 0.65, duration: 560 },
  { id: '30', title: '蓝莲花', artist: '许巍', genre: '摇滚', bpm: 105, energy: 0.6, valence: 0.55, duration: 240 },
];

export function getMoodKey(mood: string): string {
  const moodMap: Record<string, string> = {
    '兴奋': 'excited',
    '放松': 'relaxed',
    '忧郁': 'melancholy',
    'excited': 'excited',
    'relaxed': 'relaxed',
    'melancholy': 'melancholy',
  };
  return moodMap[mood] || 'relaxed';
}

export function getSceneKey(scene: string): string {
  const sceneMap: Record<string, string> = {
    '健身': 'fitness',
    '阅读': 'reading',
    '通勤': 'commute',
    '聚会': 'party',
    'fitness': 'fitness',
    'reading': 'reading',
    'commute': 'commute',
    'party': 'party',
  };
  return sceneMap[scene] || 'reading';
}

function calculateScore(song: Song, mapping: SceneMoodMapping): number {
  let score = 0;
  const [minEnergy, maxEnergy] = mapping.energyRange;
  if (song.energy >= minEnergy && song.energy <= maxEnergy) {
    score += 30;
  } else {
    const energyDiff = Math.min(
      Math.abs(song.energy - minEnergy),
      Math.abs(song.energy - maxEnergy)
    );
    score += Math.max(0, 30 - energyDiff * 60);
  }

  const [minValence, maxValence] = mapping.valenceRange;
  if (song.valence >= minValence && song.valence <= maxValence) {
    score += 30;
  } else {
    const valenceDiff = Math.min(
      Math.abs(song.valence - minValence),
      Math.abs(song.valence - maxValence)
    );
    score += Math.max(0, 30 - valenceDiff * 60);
  }

  const [minBpm, maxBpm] = mapping.bpmRange;
  if (song.bpm >= minBpm && song.bpm <= maxBpm) {
    score += 20;
  } else {
    const bpmDiff = Math.min(
      Math.abs(song.bpm - minBpm),
      Math.abs(song.bpm - maxBpm)
    );
    score += Math.max(0, 20 - bpmDiff * 0.3);
  }

  if (mapping.preferredGenres.includes(song.genre)) {
    score += 20;
  }

  return score;
}

export function generatePlaylist(scene: string, mood: string, count: number = 5): Song[] {
  const sceneKey = getSceneKey(scene);
  const moodKey = getMoodKey(mood);
  
  const sceneMoods = sceneMoodMap[sceneKey];
  if (!sceneMoods) {
    return mockSongs.slice(0, count);
  }
  
  const mapping = sceneMoods[moodKey];
  if (!mapping) {
    return mockSongs.slice(0, count);
  }

  const scoredSongs = mockSongs.map(song => ({
    song,
    score: calculateScore(song, mapping),
  }));

  scoredSongs.sort((a, b) => b.score - a.score);

  return scoredSongs.slice(0, count).map(item => item.song);
}
