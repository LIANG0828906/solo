import { create } from 'zustand';
import type { GroupBuy, Member, NewGroupInput, NewMemberInput } from '../types';
import { calculateSubtotal } from '../utils/freightSplit';

const GRADIENTS = [
  'linear-gradient(135deg, #F5E6D3 0%, #E67E22 100%)',
  'linear-gradient(135deg, #FFE0B2 0%, #FF8A65 100%)',
  'linear-gradient(135deg, #F8BBD9 0%, #F48FB1 100%)',
  'linear-gradient(135deg, #D7CCC8 0%, #A1887F 100%)',
  'linear-gradient(135deg, #C8E6C9 0%, #81C784 100%)',
  'linear-gradient(135deg, #BBDEFB 0%, #64B5F6 100%)',
  'linear-gradient(135deg, #E1BEE7 0%, #BA68C8 100%)',
  'linear-gradient(135deg, #FFE082 0%, #FFB74D 100%)',
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function hoursLater(h: number): string {
  return new Date(Date.now() + h * 3600 * 1000).toISOString().slice(0, 16);
}

function buildMockGroups(): GroupBuy[] {
  const samples = [
    {
      title: '进口刺绣线 60色套装拼单',
      products: [
        {
          name: '法式刺绣线 60色套装',
          unitPrice: 128,
          specifications: [
            { label: '经典款', stock: 20 },
            { label: '马卡龙色系', stock: 15 },
            { label: '莫兰迪色系', stock: 15 },
          ],
        },
      ],
      maxMembers: 15,
      freight: 25,
    },
    {
      title: '羊毛毡戳戳乐材料包',
      products: [
        {
          name: '羊毛毡 50色混色装',
          unitPrice: 68,
          specifications: [
            { label: '10g/色 新手套装', stock: 30 },
            { label: '20g/色 进阶套装', stock: 20 },
          ],
        },
        {
          name: '戳针工具套装',
          unitPrice: 35,
          specifications: [{ label: '含3支针', stock: 50 }],
        },
      ],
      maxMembers: 20,
      freight: 18,
    },
    {
      title: '和纸胶带 手账素材团',
      products: [
        {
          name: '日本MT和纸胶带 基础款',
          unitPrice: 22,
          specifications: [
            { label: '条纹款 15mm', stock: 40 },
            { label: '波点款 15mm', stock: 40 },
            { label: '纯色款 10mm', stock: 60 },
          ],
        },
      ],
      maxMembers: 30,
      freight: 12,
    },
    {
      title: '滴胶 UV胶 水晶滴胶拼团',
      products: [
        {
          name: '高透UV胶 100g',
          unitPrice: 45,
          specifications: [{ label: '标准款', stock: 25 }],
        },
        {
          name: '色精套装 12色',
          unitPrice: 32,
          specifications: [{ label: '珠光色精', stock: 18 }],
        },
      ],
      maxMembers: 18,
      freight: 20,
    },
    {
      title: '手工皮具 植鞣革皮料拼单',
      products: [
        {
          name: '意大利植鞣革 A4裁片',
          unitPrice: 88,
          specifications: [
            { label: '原色 2mm', stock: 12 },
            { label: '棕色 2mm', stock: 10 },
          ],
        },
      ],
      maxMembers: 10,
      freight: 30,
    },
    {
      title: '热缩片 手工DIY材料',
      products: [
        {
          name: '半透明热缩片 A4',
          unitPrice: 15,
          specifications: [{ label: '10张/包', stock: 100 }],
        },
      ],
      maxMembers: 25,
      freight: 10,
    },
  ];

  const memberNames = [
    '手作小兔', '棉麻姑娘', '线团儿', '毛毡控', '胶带少女',
    '皮匠老王', '滴胶达人', '羊毛团团', '蕾丝小姐', '布艺奶奶',
    '串珠小妹', '纸艺达人', '黏土君', '绣娘阿花', '银饰小哥',
  ];

  return samples.map((s, idx) => {
    const memberCount = Math.min(s.maxMembers, Math.floor(Math.random() * 5) + 2);
    const members: Member[] = [];
    for (let i = 0; i < memberCount; i++) {
      const orderItems = s.products.map((p) => {
        const spec = p.specifications[Math.floor(Math.random() * p.specifications.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        return {
          productId: 'p_' + idx + '_' + s.products.indexOf(p),
          productName: p.name,
          specId: 'sp_' + idx + '_' + s.products.indexOf(p) + '_' + p.specifications.indexOf(spec),
          specLabel: spec.label,
          unitPrice: p.unitPrice,
          quantity: qty,
        };
      });
      members.push({
        id: 'm_' + idx + '_' + i,
        nickname: memberNames[(i * 3 + idx) % memberNames.length],
        phone: '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
        orderItems,
        subtotal: calculateSubtotal(orderItems),
        joinedAt: Date.now() - i * 3_600_000,
      });
    }

    const products = s.products.map((p, pIdx) => ({
      id: 'p_' + idx + '_' + pIdx,
      name: p.name,
      unitPrice: p.unitPrice,
      specifications: p.specifications.map((sp, spIdx) => ({
        id: 'sp_' + idx + '_' + pIdx + '_' + spIdx,
        label: sp.label,
        stock: sp.stock,
      })),
    }));

    return {
      id: 'g_' + idx,
      title: s.title,
      deadline: hoursLater(idx === 0 ? 0.3 : idx === 1 ? 2 : idx * 12 + 6),
      maxMembers: s.maxMembers,
      freight: s.freight,
      creator: memberNames[idx % memberNames.length],
      coverGradient: GRADIENTS[idx % GRADIENTS.length],
      products,
      members,
      createdAt: Date.now() - idx * 86_400_000,
    };
  });
}

interface GroupState {
  groups: GroupBuy[];
  currentUser: string;
  getGroup: (id: string) => GroupBuy | undefined;
  addGroup: (input: NewGroupInput) => GroupBuy;
  addMember: (groupId: string, input: NewMemberInput) => { ok: boolean; error?: string; member?: Member };
  seedMockData: (groupCount: number, membersPerGroup: number) => GroupBuy[];
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: buildMockGroups(),
  currentUser: '访客手作人',

  getGroup: (id) => get().groups.find((g) => g.id === id),

  addGroup: (input) => {
    const group: GroupBuy = {
      id: uid(),
      title: input.title,
      deadline: input.deadline,
      maxMembers: input.maxMembers,
      freight: input.freight,
      creator: input.creator || get().currentUser,
      coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      products: input.products.map((p) => ({
        id: uid(),
        name: p.name,
        unitPrice: p.unitPrice,
        specifications: p.specifications.map((sp) => ({
          id: uid(),
          label: sp.label,
          stock: sp.stock,
        })),
      })),
      members: [],
      createdAt: Date.now(),
    };
    set((state) => ({ groups: [group, ...state.groups] }));
    return group;
  },

  addMember: (groupId, input) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return { ok: false, error: '团购不存在' };
    if (group.members.length >= group.maxMembers) {
      return { ok: false, error: `参团人数已达上限（${group.maxMembers}人）` };
    }
    if (!input.nickname.trim()) return { ok: false, error: '请填写昵称' };
    if (!/^1\d{10}$/.test(input.phone)) return { ok: false, error: '请填写正确的11位手机号' };
    if (!input.orderItems.length) return { ok: false, error: '请至少选择一件商品' };

    for (const oi of input.orderItems) {
      if (oi.quantity <= 0) return { ok: false, error: '商品数量需大于0' };
      const product = group.products.find((p) => p.id === oi.productId);
      if (!product) return { ok: false, error: '商品不存在' };
      const spec = product.specifications.find((s) => s.id === oi.specId);
      if (!spec) return { ok: false, error: '规格不存在' };
      if (spec.stock < oi.quantity) {
        return { ok: false, error: `${product.name} - ${spec.label} 库存不足（仅剩${spec.stock}）` };
      }
    }

    const member: Member = {
      id: uid(),
      nickname: input.nickname.trim(),
      phone: input.phone.trim(),
      orderItems: input.orderItems.map((oi) => ({ ...oi })),
      subtotal: calculateSubtotal(input.orderItems),
      joinedAt: Date.now(),
    };

    set({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const updatedProducts = g.products.map((p) => ({
          ...p,
          specifications: p.specifications.map((s) => {
            const oi = input.orderItems.find((x) => x.specId === s.id);
            if (!oi) return s;
            return { ...s, stock: s.stock - oi.quantity };
          }),
        }));
        return { ...g, members: [member, ...g.members], products: updatedProducts };
      }),
    });

    return { ok: true, member };
  },

  seedMockData: (groupCount, membersPerGroup) => {
    const groups: GroupBuy[] = [];
    for (let g = 0; g < groupCount; g++) {
      const productsCount = 1 + (g % 3);
      const products = Array.from({ length: productsCount }, (_, pIdx) => ({
        id: 'mp_' + g + '_' + pIdx,
        name: `商品-${g}-${pIdx}`,
        unitPrice: 10 + (g + pIdx) % 90,
        specifications: [
          { id: 'msp_' + g + '_' + pIdx + '_0', label: '规格A', stock: 9999 },
          { id: 'msp_' + g + '_' + pIdx + '_1', label: '规格B', stock: 9999 },
        ],
      }));
      const members: Member[] = Array.from({ length: membersPerGroup }, (_, mIdx) => {
        const orderItems = products.map((p) => ({
          productId: p.id,
          productName: p.name,
          specId: p.specifications[0].id,
          specLabel: p.specifications[0].label,
          unitPrice: p.unitPrice,
          quantity: 1 + (mIdx % 3),
        }));
        return {
          id: 'mm_' + g + '_' + mIdx,
          nickname: '成员' + mIdx,
          phone: '13800000000',
          orderItems,
          subtotal: calculateSubtotal(orderItems),
          joinedAt: Date.now() - mIdx * 1000,
        };
      });
      groups.push({
        id: 'mg_' + g,
        title: 'Mock团购-' + g,
        deadline: hoursLater(g + 1),
        maxMembers: membersPerGroup + 10,
        freight: 20 + (g % 30),
        creator: 'mock',
        coverGradient: GRADIENTS[g % GRADIENTS.length],
        products,
        members,
        createdAt: Date.now() - g * 1000,
      });
    }
    return groups;
  },
}));
