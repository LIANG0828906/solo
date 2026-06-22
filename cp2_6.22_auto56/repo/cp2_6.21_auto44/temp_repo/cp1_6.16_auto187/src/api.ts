import { v4 as uuidv4 } from 'uuid';
import type { SportEvent, User, Bet, PlaceBetRequest, ApiResponse } from './types';

const delay = (min: number = 100, max: number = 300): Promise<void> => {
  const time = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, time));
};

const generateOdds = (): number[] => {
  const odds: number[] = [];
  let total = 0;
  for (let i = 0; i < 3; i++) {
    const odd = +(1.5 + Math.random() * 3).toFixed(2);
    odds.push(odd);
    total += 1 / odd;
  }
  if (total >= 1) {
    return odds.map(o => +(o * 1.1).toFixed(2));
  }
  return odds;
};

const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const mockEvents: SportEvent[] = [
  {
    id: 'event-1',
    name: '国际马拉松锦标赛',
    startTime: now + 2 * MIN,
    status: 'upcoming',
    options: [
      { id: 'opt-1-1', name: '选手A胜', odds: generateOdds()[0] },
      { id: 'opt-1-2', name: '选手B胜', odds: generateOdds()[1] },
      { id: 'opt-1-3', name: '平局', odds: generateOdds()[2] },
    ],
  },
  {
    id: 'event-2',
    name: '职业篮球联赛决赛',
    startTime: now + 5 * MIN,
    status: 'upcoming',
    options: [
      { id: 'opt-2-1', name: '主队胜', odds: generateOdds()[0] },
      { id: 'opt-2-2', name: '客队胜', odds: generateOdds()[1] },
      { id: 'opt-2-3', name: '加时赛', odds: generateOdds()[2] },
    ],
  },
  {
    id: 'event-3',
    name: '电竞全球总决赛',
    startTime: now + 30 * MIN,
    status: 'upcoming',
    options: [
      { id: 'opt-3-1', name: '红队胜', odds: generateOdds()[0] },
      { id: 'opt-3-2', name: '蓝队胜', odds: generateOdds()[1] },
      { id: 'opt-3-3', name: '五局打满', odds: generateOdds()[2] },
    ],
  },
  {
    id: 'event-4',
    name: '足球冠军联赛',
    startTime: now + 1 * HOUR,
    status: 'upcoming',
    options: [
      { id: 'opt-4-1', name: '胜', odds: generateOdds()[0] },
      { id: 'opt-4-2', name: '负', odds: generateOdds()[1] },
      { id: 'opt-4-3', name: '平', odds: generateOdds()[2] },
    ],
  },
  {
    id: 'event-5',
    name: '网球大满贯决赛',
    startTime: now + 2 * HOUR,
    status: 'upcoming',
    options: [
      { id: 'opt-5-1', name: '选手1胜', odds: generateOdds()[0] },
      { id: 'opt-5-2', name: '选手2胜', odds: generateOdds()[1] },
      { id: 'opt-5-3', name: '五盘大战', odds: generateOdds()[2] },
    ],
  },
  {
    id: 'event-6',
    name: 'F1赛车大奖赛',
    startTime: now + 3 * HOUR,
    status: 'upcoming',
    options: [
      { id: 'opt-6-1', name: '汉密尔顿冠军', odds: generateOdds()[0] },
      { id: 'opt-6-2', name: '维斯塔潘冠军', odds: generateOdds()[1] },
      { id: 'opt-6-3', name: '其他车手', odds: generateOdds()[2] },
    ],
  },
];

const mockUsers: User[] = [
  { id: 'user-current', name: '您', points: 1000, wins: 0, totalBets: 0 },
  { id: 'user-2', name: '竞猜王者', points: 2350, wins: 15, totalBets: 28 },
  { id: 'user-3', name: '幸运星', points: 1890, wins: 12, totalBets: 25 },
  { id: 'user-4', name: '分析师', points: 1560, wins: 10, totalBets: 22 },
  { id: 'user-5', name: '新手玩家', points: 980, wins: 5, totalBets: 15 },
  { id: 'user-6', name: '概率大师', points: 1420, wins: 8, totalBets: 18 },
  { id: 'user-7', name: '体育迷', points: 760, wins: 4, totalBets: 12 },
  { id: 'user-8', name: '电竞达人', points: 1150, wins: 7, totalBets: 14 },
];

let mockBets: Bet[] = [];
let eventsStore = [...mockEvents];
let usersStore = [...mockUsers];

export const fetchEvents = async (): Promise<ApiResponse<SportEvent[]>> => {
  await delay();
  return { success: true, data: eventsStore };
};

export const fetchEvent = async (id: string): Promise<ApiResponse<SportEvent>> => {
  await delay();
  const event = eventsStore.find(e => e.id === id);
  if (!event) return { success: false, message: '赛事不存在' };
  return { success: true, data: event };
};

export const fetchLeaderboard = async (): Promise<ApiResponse<User[]>> => {
  await delay();
  const sorted = [...usersStore].sort((a, b) => b.points - a.points);
  return { success: true, data: sorted };
};

export const fetchCurrentUser = async (): Promise<ApiResponse<User>> => {
  await delay();
  const user = usersStore.find(u => u.id === 'user-current');
  if (!user) return { success: false, message: '用户不存在' };
  return { success: true, data: user };
};

export const fetchUserBets = async (userId: string): Promise<ApiResponse<Bet[]>> => {
  await delay();
  return { success: true, data: mockBets.filter(b => b.userId === userId) };
};

export const placeBet = async (req: PlaceBetRequest): Promise<ApiResponse<Bet>> => {
  await delay(1000, 2000);

  const user = usersStore.find(u => u.id === req.userId);
  const event = eventsStore.find(e => e.id === req.eventId);

  if (!user) return { success: false, message: '用户不存在' };
  if (!event) return { success: false, message: '赛事不存在' };
  if (event.status !== 'upcoming') return { success: false, message: '赛事已开始或结束，无法投注' };
  if (req.amount < 1 || req.amount > 100) return { success: false, message: '投注积分必须在1-100之间' };
  if (user.points < req.amount) return { success: false, message: '积分不足' };

  const existingBet = mockBets.find(b => b.userId === req.userId && b.eventId === req.eventId);
  if (existingBet) return { success: false, message: '您已对该赛事投注' };

  const bet: Bet = {
    id: uuidv4(),
    userId: req.userId,
    eventId: req.eventId,
    optionId: req.optionId,
    amount: req.amount,
    status: 'pending',
    createdAt: Date.now(),
  };

  mockBets.push(bet);
  user.points -= req.amount;
  user.totalBets += 1;

  return { success: true, data: bet };
};

export const settleEvent = async (eventId: string): Promise<ApiResponse<{ winners: string[] }>> => {
  await delay();
  const event = eventsStore.find(e => e.id === eventId);
  if (!event) return { success: false, message: '赛事不存在' };
  if (event.status === 'finished') return { success: false, message: '赛事已结算' };

  const winnerIdx = Math.floor(Math.random() * event.options.length);
  const winnerOption = event.options[winnerIdx];
  event.result = winnerOption.id;
  event.status = 'finished';

  const winners: string[] = [];
  const eventBets = mockBets.filter(b => b.eventId === eventId);

  for (const bet of eventBets) {
    const user = usersStore.find(u => u.id === bet.userId);
    if (!user) continue;

    if (bet.optionId === winnerOption.id) {
      bet.status = 'won';
      const winAmount = Math.floor(bet.amount * winnerOption.odds);
      user.points += winAmount;
      user.wins += 1;
      winners.push(bet.userId);
    } else {
      bet.status = 'lost';
    }
  }

  return { success: true, data: { winners } };
};

export const updateEventStatus = (eventId: string, status: 'upcoming' | 'live' | 'finished'): void => {
  const event = eventsStore.find(e => e.id === eventId);
  if (event) {
    event.status = status;
  }
};

export const startExpressServer = () => {
  // 由于用户要求在api.ts中模拟Express后端，此函数保留供未来真实服务器使用
  // 当前所有API调用均为Promise模拟
};
