import { create } from 'zustand';
import type { OrderItem, OrderPreview, PlacedPart } from '../types';
import { getTemplateById, PART_TEMPLATES } from '../data/partData';

interface OrderState {
  items: OrderItem[];
  syncFromParts: (parts: PlacedPart[]) => void;
  addItem: (templateId: string) => void;
  removeItem: (templateId: string) => void;
  clear: () => void;
  getTotalPrice: () => number;
  generateOrderPreview: () => OrderPreview;
  generateOrderText: () => string;
}

function buildItemsFromParts(parts: PlacedPart[]): OrderItem[] {
  const countMap = new Map<string, number>();
  for (const p of parts) {
    countMap.set(p.templateId, (countMap.get(p.templateId) ?? 0) + 1);
  }
  const items: OrderItem[] = [];
  for (const tpl of PART_TEMPLATES) {
    const qty = countMap.get(tpl.id) ?? 0;
    if (qty > 0) {
      items.push({
        templateId: tpl.id,
        name: tpl.name,
        quantity: qty,
        unitPrice: tpl.price,
        totalPrice: Number((tpl.price * qty).toFixed(2)),
        material: tpl.material,
      });
    }
  }
  return items;
}

function formatDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],

  syncFromParts: (parts) => {
    set({ items: buildItemsFromParts(parts) });
  },

  addItem: (templateId) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;
    const { items } = get();
    const existing = items.find((i) => i.templateId === templateId);
    if (existing) {
      const qty = existing.quantity + 1;
      set({
        items: items.map((i) =>
          i.templateId === templateId
            ? {
                ...i,
                quantity: qty,
                totalPrice: Number((i.unitPrice * qty).toFixed(2)),
              }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            templateId: tpl.id,
            name: tpl.name,
            quantity: 1,
            unitPrice: tpl.price,
            totalPrice: tpl.price,
            material: tpl.material,
          },
        ],
      });
    }
  },

  removeItem: (templateId) => {
    const { items } = get();
    const existing = items.find((i) => i.templateId === templateId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      set({ items: items.filter((i) => i.templateId !== templateId) });
    } else {
      const qty = existing.quantity - 1;
      set({
        items: items.map((i) =>
          i.templateId === templateId
            ? {
                ...i,
                quantity: qty,
                totalPrice: Number((i.unitPrice * qty).toFixed(2)),
              }
            : i
        ),
      });
    }
  },

  clear: () => set({ items: [] }),

  getTotalPrice: () => {
    const { items } = get();
    return Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
  },

  generateOrderPreview: () => {
    const { items, getTotalPrice } = get();
    return {
      items,
      totalPrice: getTotalPrice(),
      receiver: '李小明',
      phone: '138****8888',
      address: '浙江省杭州市西湖区文三路 123 号手作工坊创意园 A 座 501',
      estimatedDelivery: `${formatDate(3)} - ${formatDate(5)}`,
    };
  },

  generateOrderText: () => {
    const preview = get().generateOrderPreview();
    const lines: string[] = [];
    lines.push('=== 零件拼搭工坊 · 材料包订单 ===');
    lines.push(`收货人：${preview.receiver}`);
    lines.push(`联系电话：${preview.phone}`);
    lines.push(`收货地址：${preview.address}`);
    lines.push('-------------------------------');
    lines.push('材料清单：');
    for (const it of preview.items) {
      lines.push(
        `  ${it.name} × ${it.quantity}  单价¥${it.unitPrice.toFixed(2)}  小计¥${it.totalPrice.toFixed(2)}`
      );
    }
    lines.push('-------------------------------');
    lines.push(`合计金额：¥${preview.totalPrice.toFixed(2)}`);
    lines.push(`预计发货：${preview.estimatedDelivery}`);
    return lines.join('\n');
  },
}));
