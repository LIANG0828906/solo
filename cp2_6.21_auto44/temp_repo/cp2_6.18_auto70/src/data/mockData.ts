import { v4 as uuidv4 } from 'uuid';
import type { Collaborator, Project, Track, Version, Comment } from '../types';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const randomWaveform = (): number[] => Array.from({ length: 80 }, () => Math.random());

export const collaborators: Collaborator[] = [
  { id: uuidv4(), name: '李明', color: randomColor() },
  { id: uuidv4(), name: '张华', color: randomColor() },
  { id: uuidv4(), name: '王芳', color: randomColor() },
];

const collab1 = collaborators[0];
const collab2 = collaborators[1];
const collab3 = collaborators[2];

export const projects: Project[] = [
  {
    id: uuidv4(),
    name: '夏日晚风专辑',
    clientName: '独立音乐人小王',
    genres: ['流行', '民谣'],
    bpmRange: { min: 80, max: 120 },
    trackIds: [],
    collaborators: [collab1, collab2],
    createdAt: new Date('2026-05-01'),
  },
  {
    id: uuidv4(),
    name: '电影配乐Demo',
    clientName: '星空影业',
    genres: ['古典', '电子'],
    bpmRange: { min: 90, max: 150 },
    trackIds: [],
    collaborators: [collab2, collab3],
    createdAt: new Date('2026-05-15'),
  },
];

const project1 = projects[0];
const project2 = projects[1];

export const tracks: Track[] = [
  {
    id: uuidv4(),
    projectId: project1.id,
    name: '夏日晚风',
    description: '专辑主打歌，表达夏天夜晚的思念',
    status: 'finalized',
    versionIds: [],
    assigneeId: collab1.id,
    createdAt: new Date('2026-05-02'),
  },
  {
    id: uuidv4(),
    projectId: project1.id,
    name: '海边漫步',
    description: '轻快的民谣风格',
    status: 'mixing',
    versionIds: [],
    assigneeId: collab2.id,
    createdAt: new Date('2026-05-05'),
  },
  {
    id: uuidv4(),
    projectId: project1.id,
    name: '星空下',
    description: '温柔的情歌',
    status: 'recorded',
    versionIds: [],
    assigneeId: collab1.id,
    createdAt: new Date('2026-05-10'),
  },
  {
    id: uuidv4(),
    projectId: project2.id,
    name: '追逐黎明',
    description: '电影开场配乐，激昂振奋',
    status: 'mixing',
    versionIds: [],
    assigneeId: collab3.id,
    createdAt: new Date('2026-05-16'),
  },
  {
    id: uuidv4(),
    projectId: project2.id,
    name: '静谧之夜',
    description: '夜间场景配乐，神秘幽静',
    status: 'pending',
    versionIds: [],
    assigneeId: collab2.id,
    createdAt: new Date('2026-05-20'),
  },
];

project1.trackIds = [tracks[0].id, tracks[1].id, tracks[2].id];
project2.trackIds = [tracks[3].id, tracks[4].id];

export const versions: Version[] = [];
export const comments: Comment[] = [];

const trackVersionsConfig = [
  { track: tracks[0], count: 3 },
  { track: tracks[1], count: 2 },
  { track: tracks[2], count: 2 },
  { track: tracks[3], count: 3 },
  { track: tracks[4], count: 2 },
];

const commentContents = [
  '这段旋律非常动人！',
  '建议在副歌部分加入弦乐',
  '节奏感觉很好，保持住！',
  '人声可以再突出一点',
  '整体氛围很棒',
  '间奏部分可以再长一些',
  '期待最终成品！',
  '混音效果不错',
];

const emojis = ['👍', '❤️', '🔥', '🎵', '✨'];

trackVersionsConfig.forEach(({ track, count }) => {
  for (let i = 0; i < count; i++) {
    const versionId = uuidv4();
    const versionStr = `v1.${i}`;
    const uploader = collaborators[i % collaborators.length];

    const version: Version = {
      id: versionId,
      trackId: track.id,
      version: versionStr,
      uploader: uploader.name,
      uploaderId: uploader.id,
      uploadTime: new Date(`2026-05-${10 + i * 3}`),
      note: `第${i + 1}版修改，优化了编曲和混音`,
      audioUrl: `https://example.com/audio/${track.id}/${versionStr}.mp3`,
      fileSize: Math.floor(Math.random() * 5000000) + 1000000,
      commentIds: [],
      waveformData: randomWaveform(),
    };
    versions.push(version);
    track.versionIds.push(versionId);

    const commentCount = i === count - 1 ? 2 : 1;
    for (let j = 0; j < commentCount; j++) {
      const commentAuthor = collaborators[(i + j + 1) % collaborators.length];
      const comment: Comment = {
        id: uuidv4(),
        versionId: versionId,
        author: commentAuthor.name,
        authorId: commentAuthor.id,
        content: commentContents[(i * 2 + j) % commentContents.length],
        emoji: emojis[(i + j) % emojis.length],
        timestamp: Math.floor(Math.random() * 100),
        createdAt: new Date(`2026-05-${12 + i * 3 + j}`),
      };
      comments.push(comment);
      version.commentIds.push(comment.id);
    }
  }
});
