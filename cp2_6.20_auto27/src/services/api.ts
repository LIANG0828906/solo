import axios from 'axios';
import type { Habit, HabitRecord, CreateHabitPayload, Challenge, ChallengeParticipant, StatsData } from '../modules/habits/types';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MOCK_HABITS: Habit[] = [
  {
    id: '1',
    name: '晨间锻炼',
    frequency: 'daily',
    targetCount: 1,
    reminderTimes: ['07:00'],
    createdAt: '2025-01-01',
    completionRate: 0.85,
    streak: 12,
  },
  {
    id: '2',
    name: '阅读30分钟',
    frequency: 'daily',
    targetCount: 1,
    reminderTimes: ['21:00'],
    createdAt: '2025-01-05',
    completionRate: 0.72,
    streak: 5,
  },
  {
    id: '3',
    name: '喝8杯水',
    frequency: 'daily',
    targetCount: 8,
    reminderTimes: ['09:00', '12:00', '15:00', '18:00'],
    createdAt: '2025-01-10',
    completionRate: 0.65,
    streak: 3,
  },
  {
    id: '4',
    name: '冥想',
    frequency: 'daily',
    targetCount: 1,
    reminderTimes: ['08:00', '22:00'],
    createdAt: '2025-02-01',
    completionRate: 0.45,
    streak: 0,
  },
];

let mockHabits = [...MOCK_HABITS];

const generateMockRecords = (): HabitRecord[] => {
  const records: HabitRecord[] = [];
  const today = new Date();
  
  mockHabits.forEach((habit) => {
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completed = Math.random() > 0.3;
      if (completed) {
        records.push({
          id: uuidv4(),
          habitId: habit.id,
          date: dateStr,
          completed: true,
          completedAt: `${dateStr}T${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
        });
      }
    }
  });
  
  return records;
};

let mockRecords = generateMockRecords();

const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    title: '30天早起挑战',
    description: '每天早上7点前起床，坚持30天养成早睡早起的好习惯！',
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    participantCount: 1256,
    progress: 65,
    joined: false,
    participants: [
      { id: 'p1', name: '小明', progress: 90, rank: 1 },
      { id: 'p2', name: '花儿', progress: 85, rank: 2 },
      { id: 'p3', name: '阿杰', progress: 78, rank: 3 },
      { id: 'p4', name: '我', progress: 65, rank: 156 },
    ],
  },
  {
    id: 'c2',
    title: '21天阅读计划',
    description: '每天阅读30分钟，21天后你会看到不一样的自己。',
    startDate: '2025-06-10',
    endDate: '2025-06-30',
    participantCount: 892,
    progress: 50,
    joined: true,
    participants: [
      { id: 'p1', name: '书虫达人', progress: 95, rank: 1 },
      { id: 'p2', name: '阅读爱好者', progress: 88, rank: 2 },
      { id: 'p3', name: '我', progress: 50, rank: 120 },
      { id: 'p4', name: '萌新读者', progress: 35, rank: 200 },
    ],
  },
  {
    id: 'c3',
    title: '每日喝水挑战',
    description: '每天喝够8杯水，保持健康生活方式。',
    startDate: '2025-06-01',
    endDate: '2025-07-01',
    participantCount: 2341,
    progress: 72,
    joined: false,
    participants: [
      { id: 'p1', name: '健康达人', progress: 98, rank: 1 },
      { id: 'p2', name: '水杯侠', progress: 92, rank: 2 },
      { id: 'p3', name: '水壶王', progress: 85, rank: 3 },
    ],
  },
  {
    id: 'c4',
    title: '健身打卡30天',
    description: '坚持运动30天，每天锻炼至少30分钟，见证身体的蜕变！',
    startDate: '2025-06-15',
    endDate: '2025-07-15',
    participantCount: 567,
    progress: 30,
    joined: false,
    participants: [
      { id: 'p1', name: '健身教练', progress: 100, rank: 1 },
      { id: 'p2', name: '运动达人', progress: 80, rank: 2 },
    ],
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const habitApi = {
  getHabits: async (): Promise<Habit[]> => {
    try {
      const response = await api.get<Habit[]>('/habits');
      return response.data;
    } catch {
      await delay(300);
      return mockHabits;
    }
  },

  createHabit: async (habit: CreateHabitPayload): Promise<Habit> => {
    try {
      const response = await api.post<Habit>('/habits', habit);
      return response.data;
    } catch {
      await delay(200);
      const newHabit: Habit = {
        ...habit,
        id: uuidv4(),
        createdAt: new Date().toISOString().split('T')[0],
        completionRate: 0,
        streak: 0,
      };
      mockHabits = [newHabit, ...mockHabits];
      return newHabit;
    }
  },

  updateHabit: async (id: string, habit: Partial<Habit>): Promise<Habit> => {
    try {
      const response = await api.put<Habit>(`/habits/${id}`, habit);
      return response.data;
    } catch {
      await delay(200);
      const index = mockHabits.findIndex(h => h.id === id);
      if (index !== -1) {
        mockHabits[index] = { ...mockHabits[index], ...habit };
        return mockHabits[index];
      }
      throw new Error('Habit not found');
    }
  },

  deleteHabit: async (id: string): Promise<void> => {
    try {
      await api.delete(`/habits/${id}`);
    } catch {
      await delay(200);
      mockHabits = mockHabits.filter(h => h.id !== id);
    }
  },
};

export const recordApi = {
  getRecordsByDate: async (date: string): Promise<HabitRecord[]> => {
    try {
      const response = await api.get<HabitRecord[]>('/records', { params: { date } });
      return response.data;
    } catch {
      await delay(150);
      return mockRecords.filter(r => r.date === date);
    }
  },

  getRecordsByDateRange: async (startDate: string, endDate: string): Promise<HabitRecord[]> => {
    try {
      const response = await api.get<HabitRecord[]>('/records/range', { params: { startDate, endDate } });
      return response.data;
    } catch {
      await delay(200);
      return mockRecords.filter(r => r.date >= startDate && r.date <= endDate);
    }
  },

  toggleRecord: async (habitId: string, date: string): Promise<HabitRecord> => {
    try {
      const response = await api.post<HabitRecord>('/records/toggle', { habitId, date });
      return response.data;
    } catch {
      await delay(100);
      const existingIndex = mockRecords.findIndex(r => r.habitId === habitId && r.date === date);
      
      if (existingIndex !== -1) {
        mockRecords.splice(existingIndex, 1);
        return { id: '', habitId, date, completed: false };
      } else {
        const newRecord: HabitRecord = {
          id: uuidv4(),
          habitId,
          date,
          completed: true,
          completedAt: new Date().toISOString(),
        };
        mockRecords.push(newRecord);
        return newRecord;
      }
    }
  },
};

export const statsApi = {
  getStats: async (days: number = 30): Promise<StatsData> => {
    try {
      const response = await api.get<StatsData>('/stats', { params: { days } });
      return response.data;
    } catch {
      await delay(300);
      
      const today = new Date();
      const completionRateByDay = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const rate = 0.4 + Math.random() * 0.5;
        completionRateByDay.push({ date: dateStr, rate: Math.min(1, rate) });
      }

      const heatmapData = [];
      for (let hour = 0; hour <= 23; hour++) {
        for (let weekday = 0; weekday < 7; weekday++) {
          const count = Math.floor(Math.random() * 10);
          const completionRate = Math.random() * 0.8 + 0.2;
          if (count > 1) {
            heatmapData.push({ hour, weekday, count, completionRate });
          }
        }
      }

      const habitHeatmapData = [];
      mockHabits.forEach(habit => {
        for (let hour = 0; hour <= 23; hour++) {
          const count = Math.floor(Math.random() * 8);
          const completionRate = Math.random() * 0.7 + 0.3;
          if (count > 1) {
            habitHeatmapData.push({
              hour,
              habitId: habit.id,
              habitName: habit.name,
              count,
              completionRate,
            });
          }
        }
      });

      const streakRanking = mockHabits
        .map(h => ({ habitName: h.name, streak: h.streak, habitId: h.id }))
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5);

      const habits = mockHabits.map(h => ({ id: h.id, name: h.name }));

      return {
        completionRateByDay,
        heatmapData,
        habitHeatmapData,
        streakRanking,
        habits,
      };
    }
  },
};

export const challengeApi = {
  getChallenges: async (): Promise<Challenge[]> => {
    try {
      const response = await api.get<Challenge[]>('/challenges');
      return response.data;
    } catch {
      await delay(300);
      return mockChallenges;
    }
  },

  joinChallenge: async (challengeId: string): Promise<Challenge> => {
    try {
      const response = await api.post<Challenge>(`/challenges/${challengeId}/join`);
      return response.data;
    } catch {
      await delay(200);
      const challenge = mockChallenges.find(c => c.id === challengeId);
      if (challenge) {
        challenge.joined = true;
        challenge.participantCount += 1;
        return challenge;
      }
      throw new Error('Challenge not found');
    }
  },

  getChallengeRanking: async (challengeId: string): Promise<ChallengeParticipant[]> => {
    try {
      const response = await api.get<ChallengeParticipant[]>(`/challenges/${challengeId}/ranking`);
      return response.data;
    } catch {
      await delay(200);
      const challenge = mockChallenges.find(c => c.id === challengeId);
      return challenge?.participants || [];
    }
  },
};
