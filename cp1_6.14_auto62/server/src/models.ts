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
    nickname,
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
  await db.read();
  const challenge: Challenge = {
    id: uuidv4(),
    name,
    duration,
    dailyGoal,
    unit,
    startDate,
    inviteCode,
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
  if (challenge.inviteCode && challenge.inviteCode !== inviteCode) {
    throw new Error('邀请码错误');
  }
  if (!challenge.participantIds.includes(userId)) {
    challenge.participantIds.push(userId);
    await db.write();
  }
  return challenge;
}

export async function createDailyRecord(userId: string, challengeId: string, date: string, count: number): Promise<DailyRecord> {
  await db.read();
  const existing = db.data.dailyRecords.find(
    r => r.userId === userId && r.challengeId === challengeId && r.date === date
  );
  if (existing) {
    throw new Error('今日已提交记录');
  }
  const record: DailyRecord = {
    id: uuidv4(),
    userId,
    challengeId,
    date,
    count,
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

export { db };
