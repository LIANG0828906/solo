import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface User {
  id: string;
  email: string;
  password: string;
  nickname: string;
  avatar: string;
  avatarColor: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  duration: 7 | 14 | 30;
  dailyGoal: number;
  unit: string;
  startDate: string;
  inviteCode?: string;
  creatorId: string;
  participantIds: string[];
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  createdAt: string;
}

interface Database {
  users: User[];
  challenges: Challenge[];
  dailyRecords: DailyRecord[];
}

const file = path.join(__dirname, '../../db.json');
const adapter = new JSONFile<Database>(file);
const defaultData: Database = { users: [], challenges: [], dailyRecords: [] };
const db = new Low<Database>(adapter, defaultData);

await db.read();

const colors = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#1dd1a1',
  '#ff8c00', '#ee5253', '#222f3e', '#576574',
];

export function validateEmail(email: string): boolean {
  const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个小写字母' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个大写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个特殊字符' };
  }
  if (password.length > 64) {
    return { valid: false, message: '密码长度不能超过64位' };
  }
  return { valid: true, message: '' };
}

export function validateStartDate(startDate: string): { valid: boolean; message: string } {
  const date = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(date.getTime())) {
    return { valid: false, message: '日期格式无效' };
  }
  if (date < today) {
    return { valid: false, message: '开始日期不能早于今天' };
  }
  return { valid: true, message: '' };
}

export function validateDailyGoal(goal: number): { valid: boolean; message: string } {
  if (typeof goal !== 'number' || goal <= 0) {
    return { valid: false, message: '每日目标必须是正数' };
  }
  if (!Number.isInteger(goal)) {
    return { valid: false, message: '每日目标必须是整数' };
  }
  return { valid: true, message: '' };
}

export function validateDuration(duration: number): duration is 7 | 14 | 30 {
  return duration === 7 || duration === 14 || duration === 30;
}

function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function generateInitialAvatar(nickname: string): string {
  const initial = nickname.charAt(0).toUpperCase();
  const color = getAvatarColor(nickname);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="36" font-family="Arial, sans-serif" font-weight="bold">${initial}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function createUser(email: string, password: string, nickname: string, avatar?: string): Promise<User> {
  if (!validateEmail(email)) {
    throw new Error('邮箱格式不正确');
  }
  
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.message);
  }
  
  if (nickname.trim().length < 2) {
    throw new Error('昵称长度至少2位');
  }

  await db.read();
  const exists = db.data.users.find(u => u.email === email);
  if (exists) {
    throw new Error('邮箱已存在');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarColor = getAvatarColor(nickname);
  const user: User = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    nickname: nickname.trim(),
    avatar: avatar || generateInitialAvatar(nickname),
    avatarColor,
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await db.write();
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await db.read();
  return db.data.users.find(u => u.email === email) || null;
}

export async function findUserById(id: string): Promise<User | null> {
  await db.read();
  return db.data.users.find(u => u.id === id) || null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export async function createChallenge(
  name: string,
  duration: 7 | 14 | 30,
  dailyGoal: number,
  unit: string,
  startDate: string,
  creatorId: string,
  inviteCode?: string
): Promise<Challenge> {
  if (!name.trim()) {
    throw new Error('挑战名称不能为空');
  }
  
  if (!validateDuration(duration)) {
    throw new Error('时长必须是7天、14天或30天');
  }
  
  const goalCheck = validateDailyGoal(dailyGoal);
  if (!goalCheck.valid) {
    throw new Error(goalCheck.message);
  }
  
  if (!unit.trim()) {
    throw new Error('单位不能为空');
  }
  
  const dateCheck = validateStartDate(startDate);
  if (!dateCheck.valid) {
    throw new Error(dateCheck.message);
  }

  await db.read();
  const challenge: Challenge = {
    id: uuidv4(),
    name: name.trim(),
    duration,
    dailyGoal,
    unit: unit.trim(),
    startDate,
    inviteCode: inviteCode?.trim() || undefined,
    creatorId,
    participantIds: [creatorId],
    createdAt: new Date().toISOString(),
  };
  db.data.challenges.push(challenge);
  await db.write();
  return challenge;
}

export async function getAllChallenges(): Promise<Challenge[]> {
  await db.read();
  return [...db.data.challenges].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function findChallengeById(id: string): Promise<Challenge | null> {
  await db.read();
  return db.data.challenges.find(c => c.id === id) || null;
}

export async function joinChallenge(challengeId: string, userId: string, inviteCode?: string): Promise<Challenge> {
  await db.read();
  const challenge = db.data.challenges.find(c => c.id === challengeId);
  if (!challenge) {
    throw new Error('挑战不存在');
  }
  if (challenge.inviteCode && challenge.inviteCode !== inviteCode?.trim()) {
    throw new Error('邀请码错误');
  }
  if (!challenge.participantIds.includes(userId)) {
    challenge.participantIds.push(userId);
    await db.write();
  }
  return challenge;
}

export async function createDailyRecord(userId: string, challengeId: string, date: string, count: number): Promise<DailyRecord> {
  if (typeof count !== 'number' || count < 0) {
    throw new Error('完成数量必须是非负整数');
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new Error('日期格式无效');
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recordDate = new Date(date);
  recordDate.setHours(0, 0, 0, 0);
  if (recordDate > today) {
    throw new Error('不能提交未来日期的记录');
  }

  await db.read();
  const existing = db.data.dailyRecords.find(
    r => r.userId === userId && r.challengeId === challengeId && r.date === date
  );
  if (existing) {
    throw new Error('今日已提交记录，不可修改');
  }
  
  const challenge = db.data.challenges.find(c => c.id === challengeId);
  if (!challenge) {
    throw new Error('挑战不存在');
  }
  if (!challenge.participantIds.includes(userId)) {
    throw new Error('您尚未加入此挑战');
  }

  const record: DailyRecord = {
    id: uuidv4(),
    userId,
    challengeId,
    date,
    count: Math.floor(count),
    createdAt: new Date().toISOString(),
  };
  db.data.dailyRecords.push(record);
  await db.write();
  return record;
}

export async function getDailyRecordsByUserAndChallenge(userId: string, challengeId: string): Promise<DailyRecord[]> {
  await db.read();
  return db.data.dailyRecords
    .filter(r => r.userId === userId && r.challengeId === challengeId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getDailyRecordsByChallenge(challengeId: string): Promise<DailyRecord[]> {
  await db.read();
  return db.data.dailyRecords.filter(r => r.challengeId === challengeId);
}

export async function getDailyRecordsByUser(userId: string): Promise<DailyRecord[]> {
  await db.read();
  return db.data.dailyRecords.filter(r => r.userId === userId);
}

export async function getTodayRecord(userId: string, challengeId: string): Promise<DailyRecord | null> {
  await db.read();
  const today = new Date().toISOString().split('T')[0];
  return db.data.dailyRecords.find(
    r => r.userId === userId && r.challengeId === challengeId && r.date === today
  ) || null;
}

export async function getUserLatestRecord(userId: string, challengeId: string): Promise<DailyRecord | null> {
  await db.read();
  const records = db.data.dailyRecords
    .filter(r => r.userId === userId && r.challengeId === challengeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return records[0] || null;
}

export async function getUserChallenges(userId: string): Promise<Challenge[]> {
  await db.read();
  return db.data.challenges.filter(c => c.participantIds.includes(userId));
}

export async function getLast30DaysRecords(userId: string): Promise<DailyRecord[]> {
  await db.read();
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return db.data.dailyRecords
    .filter(r => {
      const recordDate = new Date(r.date);
      return r.userId === userId && recordDate >= thirtyDaysAgo && recordDate <= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getLeaderboardWithRank(challengeId: string): Promise<Array<{ user: User | null; total: number; previousRank: number; currentRank: number }>> {
  await db.read();
  const challenge = db.data.challenges.find(c => c.id === challengeId);
  if (!challenge) {
    return [];
  }

  const records = db.data.dailyRecords.filter(r => r.challengeId === challengeId);
  const participants = await Promise.all(
    challenge.participantIds.map(async (uid) => {
      const user = await findUserById(uid);
      return { userId: uid, user };
    })
  );

  const leaderboard = participants
    .map(({ userId, user }) => {
      const userRecords = records.filter(r => r.userId === userId);
      const total = userRecords.reduce((sum, r) => sum + r.count, 0);
      return { user, total, previousRank: 0, currentRank: 0 };
    })
    .sort((a, b) => b.total - a.total);

  leaderboard.forEach((item, index) => {
    item.currentRank = index + 1;
    item.previousRank = index + 1;
  });

  return leaderboard;
}

export { db };
