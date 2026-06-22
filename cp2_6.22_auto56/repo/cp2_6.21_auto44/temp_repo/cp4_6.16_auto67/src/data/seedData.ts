import { v4 as uuidv4 } from 'uuid';
import type { Work, Vote, Milestone } from '../types';

export interface SeedWorkConfig {
  id: string;
  title: string;
  lyrics: string;
  createdAt: string;
  status: 'draft' | 'published';
  coverColor: string;
  milestones: Omit<Milestone, 'id' | 'workId'>[];
  audioNotes: { freq: number; duration: number }[];
}

export const seedWorkConfigs: SeedWorkConfig[] = [
  {
    id: uuidv4(),
    title: '午夜公路',
    lyrics: '车灯划破黑夜的沉默\n风吹过耳边像首歌\n我们驶向未知的出口\n寻找传说中的自由',
    createdAt: '2024-03-15',
    status: 'published',
    coverColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    milestones: [
      {
        type: 'writing',
        title: '灵感萌发',
        description: '深夜巡演归来，在高速公路上捕捉到最初的旋律动机。用手机语音备忘录记录了副歌的雏形。',
        date: '2024-03-15',
      },
      {
        type: 'arrangement',
        title: '编曲完成',
        description: '确定了复古合成器的基调，加入了标志性的吉他 riff。节奏部分采用了 disco 风格的鼓点。',
        date: '2024-04-02',
      },
      {
        type: 'recording',
        title: '人声录制',
        description: '在排练室完成了主唱和和声的录制。主唱尝试了三种不同的演绎方式，最终选择了最具叙事感的版本。',
        date: '2024-04-20',
      },
      {
        type: 'mixing',
        title: '混音阶段',
        description: '经过七版混音调整，最终定版。特别突出了副歌部分的层次感和空间感。',
        date: '2024-05-10',
      },
      {
        type: 'release',
        title: '正式发布',
        description: '作为专辑首支单曲发布，首日播放量突破十万。乐评人称其为"年度最具画面感的摇滚作品"。',
        date: '2024-06-01',
      },
    ],
    audioNotes: [
      { freq: 261.63, duration: 0.3 },
      { freq: 293.66, duration: 0.3 },
      { freq: 329.63, duration: 0.3 },
      { freq: 349.23, duration: 0.4 },
      { freq: 392.0, duration: 0.3 },
      { freq: 440.0, duration: 0.3 },
      { freq: 493.88, duration: 0.3 },
      { freq: 523.25, duration: 0.6 },
      { freq: 493.88, duration: 0.3 },
      { freq: 440.0, duration: 0.3 },
      { freq: 392.0, duration: 0.3 },
      { freq: 349.23, duration: 0.4 },
      { freq: 329.63, duration: 0.3 },
      { freq: 293.66, duration: 0.3 },
      { freq: 261.63, duration: 0.6 },
    ],
  },
  {
    id: uuidv4(),
    title: '城市雨滴',
    lyrics: '玻璃窗上滑落的雨滴\n像谁未说完的话语\n霓虹在水中晕开了\n这座城市的秘密',
    createdAt: '2024-07-20',
    status: 'published',
    coverColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    milestones: [
      {
        type: 'writing',
        title: '雨天创作',
        description: '梅雨季的某个下午，看着窗外的雨写下了这首歌。钢琴旋律是即兴弹出来的。',
        date: '2024-07-20',
      },
      {
        type: 'arrangement',
        title: '氛围化编曲',
        description: '尝试用环境音效打底，加入真实的雨声采样。弦乐部分采用了极简的编配方式。',
        date: '2024-08-05',
      },
      {
        type: 'recording',
        title: '同期录音',
        description: '钢琴与人声采用同期录音的方式，保留了最自然的呼吸感和情感流动。',
        date: '2024-08-25',
      },
      {
        type: 'release',
        title: '数字发行',
        description: '作为数字单曲 surprise release，在午夜零点上线。粉丝称其为"最适合雨夜循环的歌"。',
        date: '2024-09-15',
      },
    ],
    audioNotes: [
      { freq: 293.66, duration: 0.4 },
      { freq: 329.63, duration: 0.4 },
      { freq: 392.0, duration: 0.6 },
      { freq: 349.23, duration: 0.4 },
      { freq: 329.63, duration: 0.4 },
      { freq: 293.66, duration: 0.6 },
      { freq: 261.63, duration: 0.4 },
      { freq: 293.66, duration: 0.4 },
      { freq: 349.23, duration: 0.6 },
      { freq: 392.0, duration: 0.4 },
      { freq: 440.0, duration: 0.4 },
      { freq: 392.0, duration: 0.6 },
    ],
  },
  {
    id: uuidv4(),
    title: '火星便利店',
    lyrics: '霓虹招牌还在闪烁\n货架上摆满了寂寞\n24小时营业的梦\n等你来选购',
    createdAt: '2024-10-01',
    status: 'draft',
    coverColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    milestones: [
      {
        type: 'writing',
        title: '科幻概念',
        description: '构思了一个发生在火星便利店的科幻爱情故事。歌词带有复古未来主义的色彩。',
        date: '2024-10-01',
      },
      {
        type: 'arrangement',
        title: '电子编曲实验',
        description: '尝试融合 city pop 与 synthwave 的风格。目前编曲还在调整中，待定副歌的音色。',
        date: '2024-10-20',
      },
      {
        type: 'recording',
        title: 'Demo 录制',
        description: '完成了主唱 demo，副歌部分还需要再打磨。和声设计了三层，效果有待评估。',
        date: '2024-11-05',
      },
    ],
    audioNotes: [
      { freq: 329.63, duration: 0.25 },
      { freq: 392.0, duration: 0.25 },
      { freq: 440.0, duration: 0.25 },
      { freq: 523.25, duration: 0.5 },
      { freq: 440.0, duration: 0.25 },
      { freq: 392.0, duration: 0.25 },
      { freq: 349.23, duration: 0.5 },
      { freq: 329.63, duration: 0.25 },
      { freq: 293.66, duration: 0.25 },
      { freq: 329.63, duration: 0.25 },
      { freq: 392.0, duration: 0.5 },
    ],
  },
  {
    id: uuidv4(),
    title: '海边的卡夫卡',
    lyrics: '海浪拍打着旧时光\n沙滩上脚印几行\n你说要去远方\n我没敢说会想',
    createdAt: '2024-12-01',
    status: 'draft',
    coverColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    milestones: [
      {
        type: 'writing',
        title: '海边采风',
        description: '在南方海边驻演期间创作的民谣小品。灵感来自清晨在沙滩上看到的孤独旅人。',
        date: '2024-12-01',
      },
      {
        type: 'arrangement',
        title: '民谣编曲',
        description: '以木吉他为主，加入口琴间奏。整体走简约清新的路线，不做过多修饰。',
        date: '2024-12-15',
      },
    ],
    audioNotes: [
      { freq: 261.63, duration: 0.35 },
      { freq: 329.63, duration: 0.35 },
      { freq: 392.0, duration: 0.7 },
      { freq: 349.23, duration: 0.35 },
      { freq: 293.66, duration: 0.35 },
      { freq: 261.63, duration: 0.7 },
      { freq: 220.0, duration: 0.35 },
      { freq: 261.63, duration: 0.35 },
      { freq: 329.63, duration: 0.7 },
    ],
  },
  {
    id: uuidv4(),
    title: '电子羊',
    lyrics: '在这钢铁的森林里\n我做着柔软的梦\n梦见绿色的草原\n和会笑的天空',
    createdAt: '2025-01-10',
    status: 'draft',
    coverColor: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    milestones: [
      {
        type: 'writing',
        title: '赛博朋克主题',
        description: '受《仿生人会梦见电子羊吗》启发，探讨科技时代的人性与情感。歌词带有哲学思考。',
        date: '2025-01-10',
      },
    ],
    audioNotes: [
      { freq: 196.0, duration: 0.3 },
      { freq: 246.94, duration: 0.3 },
      { freq: 293.66, duration: 0.3 },
      { freq: 329.63, duration: 0.3 },
      { freq: 392.0, duration: 0.6 },
      { freq: 349.23, duration: 0.3 },
      { freq: 293.66, duration: 0.3 },
      { freq: 261.63, duration: 0.6 },
    ],
  },
];

export const seedVotes: Omit<Vote, 'id'>[] = [
  { workId: '', score: 5, comment: '副歌太抓耳了！循环了一整天', createdAt: '2024-06-05' },
  { workId: '', score: 4, comment: '编曲很有层次感，期待现场版', createdAt: '2024-06-10' },
  { workId: '', score: 5, comment: '歌词写得太好了，很有画面感', createdAt: '2024-06-15' },
  { workId: '', score: 4, comment: '吉他solo那段绝了', createdAt: '2024-07-01' },
  { workId: '', score: 5, comment: '深夜听这首会哭', createdAt: '2024-07-10' },
  { workId: '', score: 5, comment: '雨声采样太绝了，很有氛围感', createdAt: '2024-09-20' },
  { workId: '', score: 4, comment: '适合雨夜一个人听', createdAt: '2024-09-25' },
  { workId: '', score: 5, comment: '钢琴弹得真美', createdAt: '2024-10-01' },
  { workId: '', score: 4, comment: '很有潜力的一首歌，期待完整版', createdAt: '2024-11-10' },
  { workId: '', score: 5, comment: '副歌的旋律一直在脑子里转', createdAt: '2024-11-15' },
  { workId: '', score: 3, comment: '感觉还可以再打磨一下', createdAt: '2024-11-20' },
  { workId: '', score: 4, comment: '喜欢这种复古合成器的感觉', createdAt: '2024-12-01' },
];

export function generateVotesForWorks(works: Work[]): Vote[] {
  const votes: Vote[] = [];
  let voteIndex = 0;

  works.forEach((work, workIndex) => {
    const voteCount = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < voteCount && voteIndex < seedVotes.length; i++) {
      const seedVote = seedVotes[voteIndex % seedVotes.length];
      votes.push({
        id: uuidv4(),
        workId: work.id,
        score: seedVote.score,
        comment: seedVote.comment,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      voteIndex++;
    }
  });

  return votes;
}
