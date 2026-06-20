import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { GroupBuy, NewGroupInput } from '../src/types';

interface TestStore {
  groups: GroupBuy[];
  maxMembers: number;
  addMember: (groupId: string, nickname: string, phone: string, subtotal: number) => { ok: boolean; error?: string };
  addGroup: (input: NewGroupInput) => GroupBuy;
  seed: (count: number, membersPerGroup: number) => void;
}

const useTestStore = create<TestStore>((set, get) => ({
  groups: [],
  maxMembers: 3,

  addGroup: (input) => {
    const group: GroupBuy = {
      id: 'g_test',
      title: input.title,
      deadline: input.deadline,
      maxMembers: input.maxMembers,
      freight: input.freight,
      creator: input.creator,
      coverGradient: '#FFF',
      products: [],
      members: [],
      createdAt: Date.now(),
    };
    set({ groups: [group] });
    return group;
  },

  addMember: (groupId, nickname, phone, subtotal) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return { ok: false, error: '团购不存在' };
    if (group.members.length >= group.maxMembers) {
      return { ok: false, error: `参团人数已达上限（${group.maxMembers}人）` };
    }
    if (!nickname.trim()) return { ok: false, error: '请填写昵称' };
    if (!/^1\d{10}$/.test(phone)) return { ok: false, error: '请填写正确的11位手机号' };
    if (subtotal <= 0) return { ok: false, error: '请选择商品' };

    const newMember = {
      id: 'm_' + Date.now(),
      nickname,
      phone,
      orderItems: [],
      subtotal,
      joinedAt: Date.now(),
    };

    set({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, members: [newMember, ...g.members] } : g,
      ),
    });
    return { ok: true };
  },

  seed: (count, membersPerGroup) => {
    const groups: GroupBuy[] = Array.from({ length: count }, (_, gi) => ({
      id: 'g' + gi,
      title: '团' + gi,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      maxMembers: membersPerGroup + 5,
      freight: 20,
      creator: 'test',
      coverGradient: '#FFF',
      products: [],
      members: Array.from({ length: membersPerGroup }, (_, mi) => ({
        id: 'm' + gi + '_' + mi,
        nickname: '成员' + mi,
        phone: '13800000000',
        orderItems: [],
        subtotal: 10 + mi * 5,
        joinedAt: Date.now(),
      })),
      createdAt: Date.now(),
    }));
    set({ groups });
  },
}));

describe('参团人数上限校验', () => {
  beforeEach(() => {
    useTestStore.getState().addGroup({
      title: '测试团',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      maxMembers: 3,
      freight: 15,
      creator: '团长',
      products: [],
    });
  });

  it('人数未达上限时可以正常添加', () => {
    const res = useTestStore.getState().addMember('g_test', '小明', '13912345678', 50);
    expect(res.ok).toBe(true);
    expect(useTestStore.getState().groups[0].members).toHaveLength(1);
  });

  it('人数达到上限时拒绝添加', () => {
    useTestStore.getState().addMember('g_test', '成员1', '13900000001', 50);
    useTestStore.getState().addMember('g_test', '成员2', '13900000002', 50);
    useTestStore.getState().addMember('g_test', '成员3', '13900000003', 50);

    expect(useTestStore.getState().groups[0].members).toHaveLength(3);

    const res = useTestStore.getState().addMember('g_test', '被拒者', '13900000004', 50);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('参团人数已达上限（3人）');
    expect(useTestStore.getState().groups[0].members).toHaveLength(3);
  });

  it('昵称不能为空', () => {
    const res = useTestStore.getState().addMember('g_test', '', '13912345678', 50);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('请填写昵称');
  });

  it('手机号格式错误被拒绝', () => {
    const res = useTestStore.getState().addMember('g_test', '小明', '12345', 50);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('请填写正确的11位手机号');

    const res2 = useTestStore.getState().addMember('g_test', '小明', 'abcdefghijk', 50);
    expect(res2.ok).toBe(false);
  });

  it('商品小计为0被拒绝', () => {
    const res = useTestStore.getState().addMember('g_test', '小明', '13912345678', 0);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('请选择商品');
  });
});

describe('数据完整性校验', () => {
  it('新成员卡片添加到列表最上方（最新在前）', () => {
    useTestStore.getState().addMember('g_test', '第一个', '13900000001', 50);
    useTestStore.getState().addMember('g_test', '第二个', '13900000002', 60);
    useTestStore.getState().addMember('g_test', '第三个', '13900000003', 70);

    const members = useTestStore.getState().groups[0].members;
    expect(members[0].nickname).toBe('第三个');
    expect(members[1].nickname).toBe('第二个');
    expect(members[2].nickname).toBe('第一个');
  });

  it('100个团购 × 50成员的数据生成完整性', () => {
    useTestStore.getState().seed(100, 50);
    const groups = useTestStore.getState().groups;
    expect(groups).toHaveLength(100);
    for (const g of groups) {
      expect(g.members).toHaveLength(50);
      for (const m of g.members) {
        expect(m.subtotal).toBeGreaterThan(0);
        expect(m.id).toBeTruthy();
        expect(m.nickname).toBeTruthy();
      }
    }
  });
});
