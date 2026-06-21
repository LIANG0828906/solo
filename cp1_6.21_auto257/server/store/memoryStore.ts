import { v4 as uuidv4 } from 'uuid';
import type { Work, Material, WorkImage } from './types';

class MemoryStore {
  private works: Map<string, Work> = new Map();

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData(): void {
    const now = Date.now();

    const sampleWorks: Work[] = [
      {
        id: uuidv4(),
        name: '手工皮革钱包',
        category: '皮具',
        salesChannel: '淘宝,小红书',
        price: 298,
        remark: '植鞣革材质，可压印字母',
        size: '12cm x 9.5cm',
        texture: '意大利进口植鞣牛皮',
        materials: [
          { id: uuidv4(), name: '植鞣牛皮', unitPrice: 80, quantity: 1, unit: '张' },
          { id: uuidv4(), name: '蜡线', unitPrice: 2, quantity: 3, unit: '米' },
          { id: uuidv4(), name: '黄铜五金', unitPrice: 15, quantity: 1, unit: '套' },
        ],
        images: [],
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 2,
      },
      {
        id: uuidv4(),
        name: '陶土手捏茶杯',
        category: '陶艺',
        salesChannel: '线下市集',
        price: 128,
        remark: '1280度高温烧制，冰裂纹釉',
        size: '口径8cm 高6cm',
        texture: '原矿陶土',
        materials: [
          { id: uuidv4(), name: '原矿陶土', unitPrice: 18, quantity: 0.5, unit: 'kg' },
          { id: uuidv4(), name: '釉料', unitPrice: 25, quantity: 0.05, unit: 'kg' },
        ],
        images: [],
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000,
      },
      {
        id: uuidv4(),
        name: '纯银手工耳钉',
        category: '首饰',
        salesChannel: '独立站',
        price: 368,
        remark: '99足银，手工錾刻纹理',
        size: '直径1.2cm',
        texture: '99足银',
        materials: [
          { id: uuidv4(), name: '足银原料', unitPrice: 12, quantity: 5, unit: 'g' },
          { id: uuidv4(), name: '银耳针', unitPrice: 3, quantity: 2, unit: '支' },
        ],
        images: [],
        createdAt: now - 86400000 * 5,
        updatedAt: now - 86400000 * 4,
      },
    ];

    sampleWorks.forEach((w) => this.works.set(w.id, w));
  }

  list(keyword?: string): Work[] {
    let items = Array.from(this.works.values());
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      items = items.filter(
        (w) =>
          w.name.toLowerCase().includes(kw) ||
          w.category.toLowerCase().includes(kw),
      );
    }
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): Work | undefined {
    return this.works.get(id);
  }

  create(partial: Partial<Work>): Work {
    const now = Date.now();
    const work: Work = {
      id: uuidv4(),
      name: partial.name || '未命名作品',
      category: partial.category || '',
      salesChannel: partial.salesChannel || '',
      price: partial.price ?? 0,
      remark: partial.remark || '',
      materials: partial.materials ?? [],
      images: partial.images ?? [],
      size: partial.size,
      texture: partial.texture,
      createdAt: now,
      updatedAt: now,
    };
    this.works.set(work.id, work);
    return work;
  }

  update(id: string, updates: Partial<Work>): Work | undefined {
    const target = this.works.get(id);
    if (!target) return undefined;
    const merged: Work = {
      ...target,
      ...updates,
      id: target.id,
      createdAt: target.createdAt,
      updatedAt: Date.now(),
    };
    this.works.set(id, merged);
    return merged;
  }

  delete(id: string): boolean {
    return this.works.delete(id);
  }
}

export const store = new MemoryStore();

export function calculateMaterialCost(materials: Material[]): number {
  return materials.reduce(
    (sum, m) => sum + (Number(m.unitPrice) || 0) * (Number(m.quantity) || 0),
    0,
  );
}

export { Material, WorkImage, Work };
