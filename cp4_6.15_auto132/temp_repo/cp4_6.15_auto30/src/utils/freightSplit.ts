import type { Member, FreightSplitResult } from '../types';

export interface FreightInputItem {
  memberId: string;
  nickname: string;
  totalPurchase: number;
}

export function calculateSubtotal(orderItems: Array<{ unitPrice: number; quantity: number }>): number {
  return orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * 根据各成员购买金额占比计算每人应摊运费
 * 数据流向：接收商品总价列表 → 计算 → 返回分摊结果对象数组
 *
 * 性能优化说明：
 * - 单次遍历计算总金额，避免重复 reduce
 * - 使用简单 for 循环替代数组高阶函数，减少闭包开销
 * - 分两步精确分配：先按比例取整，再将余数按金额从高到低依次分配 0.01
 * - 避免对象/数组的频繁拷贝
 *
 * 边界情况处理：
 * - 空数组 → 返回空
 * - 运费 ≤ 0 → 每人分摊 0
 * - 总金额 ≤ 0 或存在负数金额 → 人均摊
 * - 单成员 → 承担全部运费
 *
 * @param items 每个成员的购买总额列表
 * @param totalFreight 总运费
 * @returns 分摊结果数组，含每人昵称、购买总额、分摊比例、应摊运费
 */
export function splitFreight(items: FreightInputItem[], totalFreight: number): FreightSplitResult[] {
  const n = items.length;
  if (n === 0) return [];
  if (totalFreight <= 0) {
    return items.map((it) => ({
      memberId: it.memberId,
      nickname: it.nickname,
      totalPurchase: it.totalPurchase,
      ratio: n > 0 ? 1 / n : 0,
      freightShare: 0,
    }));
  }
  if (n === 1) {
    return [
      {
        memberId: items[0].memberId,
        nickname: items[0].nickname,
        totalPurchase: items[0].totalPurchase,
        ratio: 1,
        freightShare: +totalFreight.toFixed(2),
      },
    ];
  }

  let grandTotal = 0;
  let hasNegative = false;
  for (let i = 0; i < n; i++) {
    const val = items[i].totalPurchase;
    if (val < 0) hasNegative = true;
    grandTotal += val;
  }

  if (grandTotal <= 0 || hasNegative) {
    const share = +(totalFreight / n).toFixed(2);
    let remainder = +(totalFreight - share * n).toFixed(2);
    return items.map((it, idx) => ({
      memberId: it.memberId,
      nickname: it.nickname,
      totalPurchase: it.totalPurchase,
      ratio: 1 / n,
      freightShare: idx === 0 ? +(share + remainder).toFixed(2) : share,
    }));
  }

  const result: FreightSplitResult[] = new Array(n);
  let allocatedCents = 0;
  const totalCents = Math.round(totalFreight * 100);

  const indexed: Array<{ idx: number; purchase: number; cents: number }> = new Array(n);

  for (let i = 0; i < n; i++) {
    const purchase = items[i].totalPurchase;
    const ratio = purchase / grandTotal;
    const exactCents = totalCents * ratio;
    const floorCents = Math.floor(exactCents);
    allocatedCents += floorCents;
    indexed[i] = { idx: i, purchase, cents: floorCents };
    result[i] = {
      memberId: items[i].memberId,
      nickname: items[i].nickname,
      totalPurchase: purchase,
      ratio,
      freightShare: floorCents / 100,
    };
  }

  let remainingCents = totalCents - allocatedCents;
  if (remainingCents > 0) {
    indexed.sort((a, b) => b.purchase - a.purchase);
    let k = 0;
    while (remainingCents > 0 && k < n) {
      const target = indexed[k].idx;
      result[target].freightShare = +(result[target].freightShare + 0.01).toFixed(2);
      remainingCents--;
      k++;
    }
  }

  return result;
}

export function buildFreightInput(members: Member[]): FreightInputItem[] {
  return members.map((m) => ({
    memberId: m.id,
    nickname: m.nickname,
    totalPurchase: m.subtotal,
  }));
}

export function isGroupExpired(deadline: string): boolean {
  return new Date(deadline).getTime() <= Date.now();
}

export function formatCountdown(deadline: string): { text: string; urgent: boolean; expired: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: '已截止', urgent: false, expired: true };

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const urgent = diff < 3_600_000;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const h = hours % 24;
    return { text: `剩 ${days}天${h}小时`, urgent, expired: false };
  }
  if (hours >= 1) {
    return { text: `剩 ${hours}小时${minutes}分`, urgent, expired: false };
  }
  return { text: `剩 ${minutes}分${seconds}秒`, urgent, expired: false };
}
