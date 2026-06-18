import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type { GroupBuy, Member, TimeSlot } from '../types';

const delay = <T>(data: T, min = 300, max = 800): Promise<T> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
};

const generateGroupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const mockMembers: Member[] = [
  { id: 'user-1', nickname: '小明', avatar: 'M', joinedAt: '' },
  { id: 'user-2', nickname: '小红', avatar: 'H', joinedAt: '' },
  { id: 'user-3', nickname: '小刚', avatar: 'G', joinedAt: '' },
  { id: 'user-4', nickname: '小美', avatar: 'A', joinedAt: '' },
  { id: 'user-5', nickname: '小李', avatar: 'L', joinedAt: '' },
];

export const createGroupBuyApi = async (
  data: Omit<GroupBuy, 'id' | 'code' | 'shareLink' | 'currentMembers' | 'creatorId' | 'status' | 'createdAt' | 'assignedSlot'>
): Promise<GroupBuy> => {
  const code = generateGroupCode();
  const currentUser = mockMembers[0];
  const newGroup: GroupBuy = {
    ...data,
    id: uuidv4(),
    code,
    shareLink: `https://tuan.example.com/join/${code}`,
    currentMembers: [{ ...currentUser, joinedAt: dayjs().toISOString() }],
    creatorId: currentUser.id,
    status: 'pending',
    createdAt: dayjs().toISOString(),
  };
  return delay(newGroup);
};

export const fetchGroupBuysApi = async (): Promise<GroupBuy[]> => {
  const now = dayjs();
  const sampleSlots: TimeSlot[] = [
    { id: 'slot-1', date: now.add(1, 'day').format('YYYY-MM-DD'), startTime: '09:00', endTime: '11:00', maxCapacity: 20, currentCount: 5 },
    { id: 'slot-2', date: now.add(1, 'day').format('YYYY-MM-DD'), startTime: '14:00', endTime: '16:00', maxCapacity: 20, currentCount: 12 },
    { id: 'slot-3', date: now.add(2, 'day').format('YYYY-MM-DD'), startTime: '09:00', endTime: '11:00', maxCapacity: 20, currentCount: 3 },
    { id: 'slot-4', date: now.add(2, 'day').format('YYYY-MM-DD'), startTime: '16:00', endTime: '18:00', maxCapacity: 20, currentCount: 8 },
  ];

  const mockData: GroupBuy[] = [
    {
      id: uuidv4(),
      code: generateGroupCode(),
      shareLink: `https://tuan.example.com/join/ABC123`,
      productName: '进口车厘子',
      description: '智利进口JJ级车厘子，新鲜直达，果大核小',
      originalPrice: 99,
      groupPrice: 69,
      minMembers: 5,
      currentMembers: [
        { ...mockMembers[0], joinedAt: now.toISOString() },
        { ...mockMembers[1], joinedAt: now.subtract(10, 'minute').toISOString() },
        { ...mockMembers[2], joinedAt: now.subtract(30, 'minute').toISOString() },
      ],
      creatorId: mockMembers[0].id,
      status: 'pending',
      createdAt: now.subtract(1, 'hour').toISOString(),
      endTime: now.add(2, 'hour').toISOString(),
      availableSlots: sampleSlots,
    },
    {
      id: uuidv4(),
      code: generateGroupCode(),
      shareLink: `https://tuan.example.com/join/DEF456`,
      productName: '有机草莓',
      description: '本地农场有机草莓，无农药，口感香甜',
      originalPrice: 49,
      groupPrice: 29,
      minMembers: 3,
      currentMembers: [
        { ...mockMembers[1], joinedAt: now.subtract(2, 'hour').toISOString() },
        { ...mockMembers[3], joinedAt: now.subtract(1, 'hour').toISOString() },
        { ...mockMembers[4], joinedAt: now.subtract(30, 'minute').toISOString() },
      ],
      creatorId: mockMembers[1].id,
      status: 'pending',
      createdAt: now.subtract(3, 'hour').toISOString(),
      endTime: now.add(1, 'hour').toISOString(),
      availableSlots: sampleSlots.slice(0, 2),
    },
    {
      id: uuidv4(),
      code: generateGroupCode(),
      shareLink: `https://tuan.example.com/join/GHI789`,
      productName: '新鲜牛奶',
      description: '每日鲜牛奶，巴氏杀菌，营养丰富',
      originalPrice: 25,
      groupPrice: 18,
      minMembers: 10,
      currentMembers: [
        { ...mockMembers[2], joinedAt: now.subtract(5, 'hour').toISOString() },
        { ...mockMembers[0], joinedAt: now.subtract(4, 'hour').toISOString() },
      ],
      creatorId: mockMembers[2].id,
      status: 'pending',
      createdAt: now.subtract(6, 'hour').toISOString(),
      endTime: now.add(5, 'hour').toISOString(),
      availableSlots: sampleSlots.slice(1, 4),
      assignedSlot: sampleSlots[0],
    },
  ];

  return delay(mockData);
};

export const joinGroupBuyApi = async (groupId: string, member: Omit<Member, 'joinedAt'>): Promise<Member> => {
  return delay({ ...member, joinedAt: dayjs().toISOString() });
};

export const assignTimeSlotApi = async (groupId: string, slot: TimeSlot): Promise<TimeSlot> => {
  return delay({ ...slot, currentCount: slot.currentCount + 1 });
};

export const fetchUserGroupBuysApi = async (userId: string): Promise<GroupBuy[]> => {
  const data = await fetchGroupBuysApi();
  return delay(data.filter(g => g.creatorId === userId || g.currentMembers.some(m => m.id === userId)));
};
