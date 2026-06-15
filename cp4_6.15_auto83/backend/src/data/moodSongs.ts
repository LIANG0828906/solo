import { v4 as uuidv4 } from 'uuid';

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  previewUrl: string;
}

export interface Mood {
  id: string;
  name: string;
  label: string;
  emoji: string;
  gradient: string;
  color: string;
}

const songTitles: Record<string, string[]> = {
  happy: [
    '阳光明媚', '快乐颂', '开心每一天', '欢笑时光',
    '甜蜜心情', '欢乐节拍', '春暖花开', '幸福的味道'
  ],
  sad: [
    '夜深人静', '离别的季节', '泪流成河', '失落的梦',
    '独自等待', '灰色天空', '心碎的声音', '往事随风'
  ],
  relaxed: [
    '午后咖啡', '海边漫步', '微风轻拂', '田园时光',
    '星空下', '宁静湖泊', '悠闲午后', '森林低语'
  ],
  anxious: [
    '心跳加速', '迷雾重重', '忐忑不安', '风暴前夕',
    '紧绷的弦', '夜色迷离', '漩涡之中', '破晓之前'
  ],
  excited: [
    '燃爆全场', '极限挑战', '热血沸腾', '青春飞扬',
    '势不可挡', '超越梦想', '光芒万丈', '速度与激情'
  ],
  calm: [
    '静水微澜', '晨曦微光', '云淡风轻', '禅意人生',
    '月朗风清', '静谧时光', '心如止水', '安详之夜'
  ]
};

const artists: Record<string, string[]> = {
  happy: ['周杰伦', '林俊杰', '邓紫棋', '王力宏', '陈奕迅', '王菲', '李荣浩', '薛之谦'],
  sad: ['陈奕迅', '周杰伦', '林俊杰', '薛之谦', '邓紫棋', '王菲', '李荣浩', '毛不易'],
  relaxed: ['李健', '王菲', '许巍', '朴树', '陈绮贞', '曹方', '程璧', '小娟'],
  anxious: ['华晨宇', '邓紫棋', '张杰', '周杰伦', '林俊杰', '陈奕迅', '李荣浩', '薛之谦'],
  excited: ['周杰伦', '华晨宇', '张杰', '邓紫棋', '王力宏', '林俊杰', '潘玮柏', '罗志祥'],
  calm: ['李健', '许巍', '朴树', '王菲', '陈绮贞', '程璧', '小娟', '曹方']
};

function generateSongs(mood: string): Song[] {
  const songs: Song[] = [];
  for (let i = 0; i < 8; i++) {
    const songNum = (i % 16) + 1;
    songs.push({
      id: uuidv4(),
      title: songTitles[mood][i],
      artist: artists[mood][i],
      coverUrl: `https://picsum.photos/seed/${mood}${i + 1}/300/300`,
      duration: 180 + Math.floor(Math.random() * 120),
      previewUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNum}.mp3`
    });
  }
  return songs;
}

export const moods: Mood[] = [
  { id: uuidv4(), name: 'happy', label: '快乐', emoji: '😊', gradient: 'from-yellow-400 to-orange-400', color: '#facc15' },
  { id: uuidv4(), name: 'sad', label: '悲伤', emoji: '😢', gradient: 'from-blue-400 to-indigo-500', color: '#60a5fa' },
  { id: uuidv4(), name: 'relaxed', label: '放松', emoji: '😌', gradient: 'from-green-400 to-teal-400', color: '#4ade80' },
  { id: uuidv4(), name: 'anxious', label: '焦虑', emoji: '😰', gradient: 'from-red-400 to-pink-500', color: '#f87171' },
  { id: uuidv4(), name: 'excited', label: '兴奋', emoji: '🤩', gradient: 'from-purple-500 to-pink-500', color: '#a855f7' },
  { id: uuidv4(), name: 'calm', label: '平静', emoji: '😇', gradient: 'from-cyan-400 to-blue-400', color: '#22d3ee' }
];

export const moodSongs: Map<string, Song[]> = new Map();

moods.forEach((mood) => {
  moodSongs.set(mood.name, generateSongs(mood.name));
});
