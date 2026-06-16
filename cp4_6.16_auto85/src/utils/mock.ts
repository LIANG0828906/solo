import { v4 as uuidv4 } from 'uuid';
import type { User, Item, ExchangeRequest, ExchangeLog, ItemCategory } from '@/types';

const CATEGORIES: ItemCategory[] = ['布料', '线材', '纸张', '木材', '金属', '皮革', '其他'];

const USER_NAMES = [
  '小明的手工坊', '针线小李', '木匠阿强', '织梦者', '皮革匠人',
  '纸艺小姐', '金属工艺师', '创意达人', '布艺爱好者', '巧手妈妈',
  '羊毛毡达人', '手工艺术家', '编织控', '手作时光', '陶艺新手'
];

const ITEM_NAMES: Record<ItemCategory, string[]> = {
  布料: ['纯棉印花布', '亚麻面料', '丝绸碎料', '羊毛呢料', '蕾丝花边', '灯芯绒布料', '牛仔布料', '雪纺面料'],
  线材: ['彩色棉线套装', '羊毛毛线', '绣花线', '皮革蜡线', '金属丝', '尼龙绳', '丝带套装', '麻绳'],
  纸张: ['彩色卡纸', '手账贴纸', '和纸胶带', '水彩纸', '牛皮纸', '瓦楞纸', '手工折纸', '硫酸纸'],
  木材: ['榉木方料', '胡桃木薄片', '原木小木块', '竹制签子', '软木板', '木雕材料包', '松木片', '红木边角料'],
  金属: ['铜丝线圈', '银粘土', '铝制薄片', '五金配件套装', '铜片', '铆钉套装', '记忆钢丝', '金属链条'],
  皮革: ['头层牛皮碎料', '羊皮面料', '皮革染色剂', '蜡线套装', '植鞣革皮料', '皮革工具套装', '疯马皮', '二层牛皮'],
  其他: ['热熔胶棒', '剪刀套装', '手工胶水', '珠针盒', '卷尺', '顶针套装', '拆线器', '手工模具']
};

const DESIRED_EXCHANGES = [
  '想换一些同色系的布料', '求购手工工具套装', '换一些新的线材试试',
  '希望交换装饰配件', '想要尝试其他材质', '需要基础材料补充',
  '寻找创意灵感交换', '换一些不常见的材料', '求购专业工具',
  '愿意交换任意手工材料'
];

const DESCRIPTIONS = [
  '之前做手工剩下的，品质很好，希望能遇到有缘人继续发挥它的价值。',
  '买多了没用过，全新未拆封，适合各种手工项目。',
  '只用了一点点，状态非常好，颜色很正。',
  '做工精良的材料，适合进阶手工作品。',
  '环保材料，天然无公害，对皮肤友好。',
  '从日本带回的优质材料，国内很难买到。',
  '限量款材料，图案精美，独一无二。',
  '适合新手入门的基础材料，容易上手。'
];

const IMAGE_COLORS = [
  'f5f0e1', 'e8dcc8', 'd4c4a8', 'c9b896', 'bfae86',
  'a8d8a8', 'c8e6c9', 'b2dfdb', 'ffccbc', 'ffe0b2',
  'fff9c4', 'd1c4e9', 'f8bbd9', 'bbdefb', 'c5e1a5'
];

function generateImageUrl(seed: string, colorIndex: number): string {
  const color = IMAGE_COLORS[colorIndex % IMAGE_COLORS.length];
  const iconSeed = encodeURIComponent(seed);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcraft%20material%20${iconSeed}%20flatlay%20aesthetic%20warm%20lighting&image_size=square`;
}

export function generateMockUsers(count: number): User[] {
  const users: User[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    users.push({
      id: uuidv4(),
      name: USER_NAMES[i % USER_NAMES.length] + (i >= USER_NAMES.length ? ` ${Math.floor(i / USER_NAMES.length) + 1}` : ''),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(USER_NAMES[i % USER_NAMES.length] + i)}`,
      ecoPoints: Math.floor(Math.random() * 500) + (i === 0 ? 120 : 0),
      createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      isAdmin: i === 0,
    });
  }

  return users;
}

export function generateMockItems(users: User[], count: number): Item[] {
  const items: Item[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const names = ITEM_NAMES[category];
    const name = names[Math.floor(Math.random() * names.length)];
    const owner = users[Math.floor(Math.random() * users.length)];
    const wearLevel = Math.floor(Math.random() * 60);
    const isExchanged = wearLevel > 40 && Math.random() > 0.7;

    items.push({
      id: uuidv4(),
      ownerId: owner.id,
      name,
      category,
      description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
      wearLevel,
      desiredExchange: DESIRED_EXCHANGES[Math.floor(Math.random() * DESIRED_EXCHANGES.length)],
      status: isExchanged ? 'exchanged' : 'available',
      createdAt: now - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
      imageUrl: generateImageUrl(name + i, i),
    });
  }

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export function generateMockRequests(
  users: User[],
  items: Item[]
): ExchangeRequest[] {
  const requests: ExchangeRequest[] = [];
  const now = Date.now();
  const availableItems = items.filter((i) => i.status === 'available');

  const requestCount = Math.min(12, Math.floor(availableItems.length / 8));

  for (let i = 0; i < requestCount; i++) {
    const requestedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    const responder = users.find((u) => u.id === requestedItem.ownerId);
    if (!responder) continue;

    const requesterCandidates = users.filter((u) => u.id !== responder.id);
    const requester = requesterCandidates[Math.floor(Math.random() * requesterCandidates.length)];

    const requesterItems = availableItems.filter(
      (item) => item.ownerId === requester.id && item.id !== requestedItem.id
    );
    if (requesterItems.length === 0) continue;

    const offeredItem = requesterItems[Math.floor(Math.random() * requesterItems.length)];

    const statusRoll = Math.random();
    let status: ExchangeRequest['status'] = 'pending';
    if (statusRoll > 0.7) status = 'confirmed';
    else if (statusRoll > 0.5) status = 'rejected';

    requests.push({
      id: uuidv4(),
      requesterId: requester.id,
      responderId: responder.id,
      offeredItemId: offeredItem.id,
      requestedItemId: requestedItem.id,
      status,
      createdAt: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: now - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000),
    });
  }

  return requests.sort((a, b) => b.createdAt - a.createdAt);
}

export function generateMockExchangeLogs(
  users: User[],
  items: Item[],
  requests: ExchangeRequest[]
): ExchangeLog[] {
  const logs: ExchangeLog[] = [];
  const confirmedRequests = requests.filter((r) => r.status === 'confirmed');

  for (const request of confirmedRequests) {
    const item1 = items.find((i) => i.id === request.offeredItemId);
    const item2 = items.find((i) => i.id === request.requestedItemId);
    if (!item1 || !item2) continue;

    logs.push({
      id: uuidv4(),
      requestId: request.id,
      user1Id: request.requesterId,
      user2Id: request.responderId,
      item1Id: item1.id,
      item2Id: item2.id,
      pointsEarned: 10,
      completedAt: request.updatedAt,
    });
  }

  const user = users[0];
  const extraLogCount = 5;
  for (let i = 0; i < extraLogCount; i++) {
    const otherUser = users[(i + 1) % users.length];
    const userItems = items.filter((it) => it.ownerId === user.id);
    const otherItems = items.filter((it) => it.ownerId === otherUser.id);
    if (userItems.length === 0 || otherItems.length === 0) continue;

    logs.push({
      id: uuidv4(),
      requestId: uuidv4(),
      user1Id: user.id,
      user2Id: otherUser.id,
      item1Id: userItems[i % userItems.length].id,
      item2Id: otherItems[i % otherItems.length].id,
      pointsEarned: 10,
      completedAt: Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000,
    });
  }

  return logs.sort((a, b) => b.completedAt - a.completedAt);
}

export function generateAllMockData() {
  const users = generateMockUsers(10);
  const items = generateMockItems(users, 150);
  const requests = generateMockRequests(users, items);
  const exchangeLogs = generateMockExchangeLogs(users, items, requests);

  const currentUser = users[0];
  const userItemCount = items.filter((i) => i.ownerId === currentUser.id).length;
  if (userItemCount < 5) {
    for (let i = 0; i < 5 - userItemCount; i++) {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const names = ITEM_NAMES[category];
      const name = names[Math.floor(Math.random() * names.length)];
      items.unshift({
        id: uuidv4(),
        ownerId: currentUser.id,
        name: `${name}（我的）`,
        category,
        description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
        wearLevel: Math.floor(Math.random() * 30),
        desiredExchange: DESIRED_EXCHANGES[Math.floor(Math.random() * DESIRED_EXCHANGES.length)],
        status: 'available',
        createdAt: Date.now() - i * 60 * 60 * 1000,
        imageUrl: generateImageUrl(name + '-my-' + i, i + 100),
      });
    }
  }

  return { users, items, requests, exchangeLogs, currentUser };
}
