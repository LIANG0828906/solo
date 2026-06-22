import type { Member, Piece, Rehearsal, VoicePart } from '../types';

const VOICE_PARTS: VoicePart[] = ['Soprano', 'Alto', 'Tenor', 'Bass'];

export const PART_COLORS: Record<VoicePart, string> = {
  Soprano: '#FF8A80',
  Alto: '#82B1FF',
  Tenor: '#B9F6CA',
  Bass: '#D1C4E9',
};

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const seedMembers: Member[] = [
  {
    id: 'm1',
    name: '林晓薇',
    primaryPart: 'Soprano',
    skillLevel: 4,
    availableSlots: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    id: 'm2',
    name: '张雅琴',
    primaryPart: 'Soprano',
    secondaryPart: 'Alto',
    skillLevel: 3,
    availableSlots: [
      { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' },
      { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
    ],
  },
  {
    id: 'm3',
    name: '王诗涵',
    primaryPart: 'Alto',
    skillLevel: 5,
    availableSlots: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 0, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    id: 'm4',
    name: '陈思雨',
    primaryPart: 'Alto',
    secondaryPart: 'Soprano',
    skillLevel: 3,
    availableSlots: [
      { dayOfWeek: 1, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 5, startTime: '19:00', endTime: '22:00' },
    ],
  },
  {
    id: 'm5',
    name: '李志远',
    primaryPart: 'Tenor',
    skillLevel: 4,
    availableSlots: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    id: 'm6',
    name: '赵天佑',
    primaryPart: 'Tenor',
    skillLevel: 2,
    availableSlots: [
      { dayOfWeek: 3, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '12:00' },
    ],
  },
  {
    id: 'm7',
    name: '刘浩然',
    primaryPart: 'Bass',
    secondaryPart: 'Tenor',
    skillLevel: 5,
    availableSlots: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    id: 'm8',
    name: '孙嘉铭',
    primaryPart: 'Bass',
    skillLevel: 3,
    availableSlots: [
      { dayOfWeek: 1, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 3, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 5, startTime: '19:00', endTime: '22:00' },
    ],
  },
  {
    id: 'm9',
    name: '周美玲',
    primaryPart: 'Soprano',
    skillLevel: 2,
    availableSlots: [
      { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 0, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    id: 'm10',
    name: '吴鹏飞',
    primaryPart: 'Bass',
    skillLevel: 4,
    availableSlots: [
      { dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
      { dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
    ],
  },
];

export const seedPieces: Piece[] = [
  {
    id: 'p1',
    name: '圣母颂',
    composer: '巴赫/古诺',
    key: 'C Major',
    bpm: 72,
    requiredParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    practiceProgress: {
      Soprano: { practicedMinutes: 180, targetMinutes: 240 },
      Alto: { practicedMinutes: 150, targetMinutes: 240 },
      Tenor: { practicedMinutes: 120, targetMinutes: 240 },
      Bass: { practicedMinutes: 90, targetMinutes: 240 },
    },
  },
  {
    id: 'p2',
    name: '茉莉花',
    composer: '中国民歌',
    key: 'G Major',
    bpm: 84,
    requiredParts: ['Soprano', 'Alto', 'Tenor'],
    practiceProgress: {
      Soprano: { practicedMinutes: 200, targetMinutes: 200 },
      Alto: { practicedMinutes: 180, targetMinutes: 200 },
      Tenor: { practicedMinutes: 140, targetMinutes: 200 },
    },
  },
  {
    id: 'p3',
    name: '喀秋莎',
    composer: '布朗介尔',
    key: 'a minor',
    bpm: 108,
    requiredParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    practiceProgress: {
      Soprano: { practicedMinutes: 160, targetMinutes: 300 },
      Alto: { practicedMinutes: 140, targetMinutes: 300 },
      Tenor: { practicedMinutes: 100, targetMinutes: 300 },
      Bass: { practicedMinutes: 80, targetMinutes: 300 },
    },
  },
  {
    id: 'p4',
    name: '欢乐颂',
    composer: '贝多芬',
    key: 'D Major',
    bpm: 96,
    requiredParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    practiceProgress: {
      Soprano: { practicedMinutes: 220, targetMinutes: 260 },
      Alto: { practicedMinutes: 200, targetMinutes: 260 },
      Tenor: { practicedMinutes: 240, targetMinutes: 260 },
      Bass: { practicedMinutes: 260, targetMinutes: 260 },
    },
  },
  {
    id: 'p5',
    name: '月亮代表我的心',
    composer: '翁清溪',
    key: 'F Major',
    bpm: 68,
    requiredParts: ['Soprano', 'Tenor'],
    practiceProgress: {
      Soprano: { practicedMinutes: 120, targetMinutes: 180 },
      Tenor: { practicedMinutes: 90, targetMinutes: 180 },
    },
  },
  {
    id: 'p6',
    name: '天空之城',
    composer: '久石让',
    key: 'E Major',
    bpm: 76,
    requiredParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    practiceProgress: {
      Soprano: { practicedMinutes: 80, targetMinutes: 280 },
      Alto: { practicedMinutes: 60, targetMinutes: 280 },
      Tenor: { practicedMinutes: 40, targetMinutes: 280 },
      Bass: { practicedMinutes: 50, targetMinutes: 280 },
    },
  },
  {
    id: 'p7',
    name: '摇篮曲',
    composer: '勃拉姆斯',
    key: 'F Major',
    bpm: 60,
    requiredParts: ['Soprano', 'Alto'],
    practiceProgress: {
      Soprano: { practicedMinutes: 140, targetMinutes: 160 },
      Alto: { practicedMinutes: 130, targetMinutes: 160 },
    },
  },
  {
    id: 'p8',
    name: '保卫黄河',
    composer: '冼星海',
    key: 'C Major',
    bpm: 132,
    requiredParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    practiceProgress: {
      Soprano: { practicedMinutes: 100, targetMinutes: 320 },
      Alto: { practicedMinutes: 90, targetMinutes: 320 },
      Tenor: { practicedMinutes: 110, targetMinutes: 320 },
      Bass: { practicedMinutes: 80, targetMinutes: 320 },
    },
  },
];

export const seedRehearsals: Rehearsal[] = [
  {
    id: 'r1',
    title: '周末综合排练',
    date: '2026-06-21',
    startTime: '14:00',
    durationMinutes: 180,
    participantIds: ['m1', 'm3', 'm5', 'm7', 'm2', 'm8'],
    pieceIds: ['p1', 'p3'],
    conflicts: [],
  },
  {
    id: 'r2',
    title: '女声声部练习',
    date: '2026-06-23',
    startTime: '19:00',
    durationMinutes: 120,
    participantIds: ['m1', 'm2', 'm3', 'm4'],
    pieceIds: ['p2', 'p7'],
    conflicts: [],
  },
  {
    id: 'r3',
    title: '男声声部练习',
    date: '2026-06-24',
    startTime: '19:00',
    durationMinutes: 120,
    participantIds: ['m5', 'm6', 'm7', 'm8'],
    pieceIds: ['p4', 'p8'],
    conflicts: [],
  },
  {
    id: 'r4',
    title: '冲突测试排练',
    date: '2026-06-21',
    startTime: '15:00',
    durationMinutes: 90,
    participantIds: ['m1', 'm3'],
    pieceIds: ['p5'],
    conflicts: [],
  },
];
