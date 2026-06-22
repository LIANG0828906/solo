export type ItemStatus = 'available' | 'pending' | 'swapped';
export type ItemCategory = '电子产品' | '家居用品' | '书籍文具' | '服饰鞋包' | '运动户外' | '其他';
export type ItemCondition = '全新' | '九成新' | '八成新' | '七成新及以下';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Item {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: ItemCategory;
  images: string[];
  condition: ItemCondition;
  price: number;
  status: ItemStatus;
  createdAt: string;
}

export interface Offer {
  id: string;
  itemId: string;
  buyerId: string;
  message: string;
  status: OfferStatus;
  createdAt: string;
}

export interface CreateItemInput {
  sellerId: string;
  title: string;
  description: string;
  category: ItemCategory;
  images: string[];
  condition: ItemCondition;
  price: number;
}

export interface CreateOfferInput {
  itemId: string;
  buyerId: string;
  message: string;
}

import { v4 as uuidv4 } from 'uuid';
import {
  addRecord,
  getAllRecords,
  getRecordsByIndex,
  putRecord,
  countRecords,
  getRecord,
} from '@/utils/db';
import {
  validateTitle,
  validateDescription,
  validatePrice,
  validateImages,
  validateOfferMessage,
} from '@/utils/validators';
import {
  updateUserRating,
  incrementUserItemCount,
  getUserById,
  User,
} from '../auth/models';

const STATUS_COLORS: Record<ItemStatus, string> = {
  available: '#2ECC71',
  pending: '#F39C12',
  swapped: '#95A5A6',
};

const STATUS_TEXT: Record<ItemStatus, string> = {
  available: '可交换',
  pending: '待处理',
  swapped: '已完成',
};

export function getStatusColor(status: ItemStatus): string {
  return STATUS_COLORS[status];
}

export function getStatusText(status: ItemStatus): string {
  return STATUS_TEXT[status];
}

export function getCategories(): ItemCategory[] {
  return ['电子产品', '家居用品', '书籍文具', '服饰鞋包', '运动户外', '其他'];
}

export function getConditions(): ItemCondition[] {
  return ['全新', '九成新', '八成新', '七成新及以下'];
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const titleCheck = validateTitle(input.title);
  if (!titleCheck.valid) throw new Error(titleCheck.message);

  const descCheck = validateDescription(input.description);
  if (!descCheck.valid) throw new Error(descCheck.message);

  const priceCheck = validatePrice(input.price);
  if (!priceCheck.valid) throw new Error(priceCheck.message);

  const imgCheck = validateImages(input.images);
  if (!imgCheck.valid) throw new Error(imgCheck.message);

  const item: Item = {
    id: uuidv4(),
    sellerId: input.sellerId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    images: input.images,
    condition: input.condition,
    price: Number(input.price),
    status: 'available',
    createdAt: new Date().toISOString(),
  };

  await addRecord<Item>('items', item);
  await incrementUserItemCount(input.sellerId, 1);
  return item;
}

export async function getItemsByStatus(status?: ItemStatus): Promise<Item[]> {
  let items = await getAllRecords<Item>('items');
  if (status) {
    items = items.filter((i) => i.status === status);
  }
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAvailableItems(excludeUserId?: string): Promise<Item[]> {
  const items = await getItemsByStatus('available');
  if (excludeUserId) {
    return items.filter((i) => i.sellerId !== excludeUserId);
  }
  return items;
}

export async function getItemsBySeller(sellerId: string): Promise<Item[]> {
  const items = await getRecordsByIndex<Item>('items', 'sellerId', sellerId);
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function searchItems(keyword: string, excludeUserId?: string): Promise<Item[]> {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return getAvailableItems(excludeUserId);

  const items = await getAvailableItems(excludeUserId);
  return items.filter(
    (i) =>
      i.title.toLowerCase().includes(kw) ||
      i.description.toLowerCase().includes(kw) ||
      i.category.includes(keyword.trim())
  );
}

export async function getItemById(id: string): Promise<Item | undefined> {
  return getRecord<Item>('items', id);
}

export async function updateItemStatus(itemId: string, status: ItemStatus): Promise<Item> {
  const item = await getItemById(itemId);
  if (!item) throw new Error('物品不存在');

  const updated: Item = { ...item, status };
  await putRecord<Item>('items', updated);
  return updated;
}

export async function createOffer(input: CreateOfferInput): Promise<Offer> {
  const msgCheck = validateOfferMessage(input.message);
  if (!msgCheck.valid) throw new Error(msgCheck.message);

  const item = await getItemById(input.itemId);
  if (!item) throw new Error('物品不存在');
  if (item.status !== 'available') throw new Error('该物品当前不可出价');
  if (item.sellerId === input.buyerId) throw new Error('不能对自己的物品出价');

  const offer: Offer = {
    id: uuidv4(),
    itemId: input.itemId,
    buyerId: input.buyerId,
    message: input.message.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await addRecord<Offer>('offers', offer);
  await updateItemStatus(input.itemId, 'pending');
  return offer;
}

export async function getOffersByItem(itemId: string): Promise<Offer[]> {
  const offers = await getRecordsByIndex<Offer>('offers', 'itemId', itemId);
  return offers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOffersByBuyer(buyerId: string): Promise<Offer[]> {
  const offers = await getRecordsByIndex<Offer>('offers', 'buyerId', buyerId);
  return offers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOfferById(id: string): Promise<Offer | undefined> {
  return getRecord<Offer>('offers', id);
}

export async function updateOfferStatus(offerId: string, status: OfferStatus): Promise<Offer> {
  const offer = await getOfferById(offerId);
  if (!offer) throw new Error('出价不存在');

  const updated: Offer = { ...offer, status };
  await putRecord<Offer>('offers', updated);
  return updated;
}

export async function acceptOffer(offerId: string): Promise<{ offer: Offer; item: Item; buyer: User; seller: User }> {
  const offer = await getOfferById(offerId);
  if (!offer) throw new Error('出价不存在');
  if (offer.status !== 'pending') throw new Error('该出价已处理');

  const item = await getItemById(offer.itemId);
  if (!item) throw new Error('物品不存在');

  const updatedOffer = await updateOfferStatus(offerId, 'accepted');
  const updatedItem = await updateItemStatus(offer.itemId, 'swapped');

  const buyer = await updateUserRating(offer.buyerId, 1);
  const seller = await updateUserRating(item.sellerId, 1);

  return { offer: updatedOffer, item: updatedItem, buyer, seller };
}

export async function rejectOffer(offerId: string): Promise<{ offer: Offer; item: Item }> {
  const offer = await getOfferById(offerId);
  if (!offer) throw new Error('出价不存在');
  if (offer.status !== 'pending') throw new Error('该出价已处理');

  const item = await getItemById(offer.itemId);
  if (!item) throw new Error('物品不存在');

  const updatedOffer = await updateOfferStatus(offerId, 'rejected');

  const pendingOffers = await getOffersByItem(offer.itemId);
  const hasOtherPending = pendingOffers.some((o) => o.id !== offerId && o.status === 'pending');
  let updatedItem = item;
  if (!hasOtherPending) {
    updatedItem = await updateItemStatus(offer.itemId, 'available');
  }

  return { offer: updatedOffer, item: updatedItem };
}

export async function getTodaySwappedCount(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const items = await getItemsByStatus('swapped');
  return items.filter((i) => new Date(i.createdAt).getTime() >= todayTs).length;
}

export async function countUsers(): Promise<number> {
  return countRecords('users');
}

export async function countItems(): Promise<number> {
  return countRecords('items');
}

export async function countUserItems(userId: string): Promise<number> {
  const items = await getItemsBySeller(userId);
  return items.length;
}

export async function countUserPendingOffers(userId: string): Promise<number> {
  const items = await getItemsBySeller(userId);
  let count = 0;
  for (const item of items) {
    const offers = await getOffersByItem(item.id);
    count += offers.filter((o) => o.status === 'pending').length;
  }
  return count;
}

export async function countUserSwapped(userId: string): Promise<number> {
  const buyerOffers = await getOffersByBuyer(userId);
  const accepted = buyerOffers.filter((o) => o.status === 'accepted');
  const sellerItems = await getItemsBySeller(userId);
  const sold = sellerItems.filter((i) => i.status === 'swapped');
  return accepted.length + sold.length;
}

export async function getOffersBySeller(sellerId: string): Promise<Offer[]> {
  const items = await getItemsBySeller(sellerId);
  const all: Offer[] = [];
  for (const item of items) {
    const offers = await getOffersByItem(item.id);
    all.push(...offers);
  }
  return all.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getUserTransactions(userId: string): Promise<
  Array<{
    id: string;
    item: Item;
    offer?: Offer;
    counterpart: User;
    role: 'buyer' | 'seller';
    date: string;
  }>
> {
  const transactions: Array<{
    id: string;
    item: Item;
    offer?: Offer;
    counterpart: User;
    role: 'buyer' | 'seller';
    date: string;
  }> = [];

  const buyerOffers = await getOffersByBuyer(userId);
  for (const offer of buyerOffers) {
    const item = await getItemById(offer.itemId);
    if (!item) continue;
    const seller = await getUserById(item.sellerId);
    if (!seller) continue;
    transactions.push({
      id: offer.id,
      item,
      offer,
      counterpart: seller,
      role: 'buyer',
      date: offer.createdAt,
    });
  }

  const sellerItems = await getItemsBySeller(userId);
  for (const item of sellerItems) {
    const offers = await getOffersByItem(item.id);
    for (const offer of offers) {
      if (offer.status !== 'accepted') continue;
      const buyer = await getUserById(offer.buyerId);
      if (!buyer) continue;
      if (!transactions.some((t) => t.id === offer.id)) {
        transactions.push({
          id: offer.id,
          item,
          offer,
          counterpart: buyer,
          role: 'seller',
          date: offer.createdAt,
        });
      }
    }
    if (item.status === 'swapped' && !offers.some((o) => o.status === 'accepted')) {
      transactions.push({
        id: item.id,
        item,
        counterpart: { id: 'unknown', name: '未知', avatar: '👤', contact: '', joinDate: '', rating: 1, itemCount: 0, password: '' },
        role: 'seller',
        date: item.createdAt,
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
  'https://images.unsplash.com/photo-1522273500616-6847c835129a?w=400',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400',
];

export async function seedDemoItems(): Promise<void> {
  const items = await getAllRecords<Item>('items');
  if (items.length > 0) return;

  const users = await getAllRecords<User>('users');
  if (users.length === 0) return;

  const demoData: Array<{
    title: string;
    description: string;
    category: ItemCategory;
    condition: ItemCondition;
    price: number;
  }> = [
    { title: 'iPhone 12 Pro 128G 蓝色', description: '自用一年多，成色非常好，原装无拆修，配件齐全，盒子发票都在。', category: '电子产品', condition: '九成新', price: 3500 },
    { title: '小米蓝牙降噪耳机', description: '几乎全新，用了没几次，音质不错，降噪效果好，有需要的朋友联系。', category: '电子产品', condition: '九成新', price: 280 },
    { title: '宜家双人沙发 米色布艺', description: '搬家出，三人位，坐感舒适，无污渍无破损，自提优先。', category: '家居用品', condition: '八成新', price: 800 },
    { title: 'Nike Air Max 运动鞋', description: '42码，买来没穿过几次，鞋面干净，鞋底无磨损，低价出。', category: '服饰鞋包', condition: '九成新', price: 350 },
    { title: '《百年孤独》+《霍乱时期的爱情》', description: '加西亚马尔克斯经典作品，正版，无划线无笔记，打包优惠。', category: '书籍文具', condition: '九成新', price: 45 },
    { title: 'MacBook Pro 13寸 2020款', description: 'M1芯片，8G+256G，带原装充电器和盒子，循环次数120，屏幕完美。', category: '电子产品', condition: '九成新', price: 6200 },
    { title: '迪卡侬户外登山背包 40L', description: '只用过一次，几乎全新，功能完好，多隔层设计，徒步必备。', category: '运动户外', condition: '全新', price: 180 },
    { title: '戴森吸尘器 V8', description: '性能强劲，主机+多配件齐全，续航正常，清洁保养过。', category: '家居用品', condition: '八成新', price: 900 },
    { title: 'Kindle Paperwhite 电子书', description: '第10代，8G存储，护眼墨水屏，送皮套，非常适合看书。', category: '电子产品', condition: '九成新', price: 550 },
    { title: '优衣库羽绒服 男款L码', description: '黑色轻薄款，保暖性好，穿过一冬，无破损无污渍。', category: '服饰鞋包', condition: '八成新', price: 200 },
    { title: '乐高 建筑系列 长城', description: '已拼好，零件齐全，有原装盒和说明书，可现场验货。', category: '其他', condition: '全新', price: 400 },
    { title: '罗技无线键盘 K380', description: '多设备蓝牙切换，白色款，外观时尚，打字舒适。', category: '电子产品', condition: '八成新', price: 120 },
  ];

  for (let i = 0; i < demoData.length; i++) {
    const data = demoData[i];
    const seller = users[i % users.length];
    await createItem({
      sellerId: seller.id,
      ...data,
      images: [DEMO_IMAGES[i % DEMO_IMAGES.length]],
    });
  }
}
