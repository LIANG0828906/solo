import { describe, bench, expect } from 'vitest';
import { splitFreight, buildFreightInput, type FreightInputItem } from '../src/utils/freightSplit';
import { useGroupStore } from '../src/store/useGroupStore';

function buildInput(count: number): FreightInputItem[] {
  return Array.from({ length: count }, (_, i) => ({
    memberId: 'm' + i,
    nickname: '成员' + i,
    totalPurchase: 10 + i * 7,
  }));
}

describe('freightSplit 性能基准测试', () => {
  bench('50成员分摊计算（单团）', () => {
    const items = buildInput(50);
    const result = splitFreight(items, 88.88);
    expect(result).toHaveLength(50);
  });

  bench('100成员分摊计算（超大团）', () => {
    const items = buildInput(100);
    const result = splitFreight(items, 199.99);
    expect(result).toHaveLength(100);
  });

  bench('100个团购 × 50成员 = 5000次分摊', () => {
    const groups = useGroupStore.getState().seedMockData(100, 50);
    let totalCost = 0;
    for (const g of groups) {
      const result = splitFreight(buildFreightInput(g.members), g.freight);
      totalCost += result.reduce((s, r) => s + r.freightShare, 0);
    }
    expect(totalCost).toBeGreaterThan(0);
  });
});
