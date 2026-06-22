import { describe, it, expect } from 'vitest';
import { splitFreight, type FreightInputItem } from '../src/utils/freightSplit';

const makeItem = (id: string, nickname: string, totalPurchase: number): FreightInputItem => ({
  memberId: id,
  nickname,
  totalPurchase,
});

describe('splitFreight 运费分摊算法', () => {
  it('空数组应返回空', () => {
    expect(splitFreight([], 25)).toEqual([]);
  });

  it('运费为0时，每人分摊0元', () => {
    const items = [makeItem('1', '甲', 100), makeItem('2', '乙', 200)];
    const result = splitFreight(items, 0);
    expect(result).toHaveLength(2);
    expect(result[0].freightShare).toBe(0);
    expect(result[1].freightShare).toBe(0);
    expect(result[0].ratio).toBeCloseTo(0.5);
    expect(result[1].ratio).toBeCloseTo(0.5);
  });

  it('运费为负数时，每人分摊0元', () => {
    const items = [makeItem('1', '甲', 100), makeItem('2', '乙', 200)];
    const result = splitFreight(items, -5);
    expect(result[0].freightShare).toBe(0);
    expect(result[1].freightShare).toBe(0);
  });

  it('正常场景：按购买金额比例分摊运费', () => {
    const items = [
      makeItem('1', '手作小兔', 128),
      makeItem('2', '毛毡控', 256),
    ];
    const result = splitFreight(items, 25);

    expect(result).toHaveLength(2);
    expect(result[0].nickname).toBe('手作小兔');
    expect(result[0].totalPurchase).toBe(128);
    expect(result[0].ratio).toBeCloseTo(1 / 3, 3);
    expect(result[0].freightShare).toBeCloseTo(8.33, 1);

    expect(result[1].nickname).toBe('毛毡控');
    expect(result[1].totalPurchase).toBe(256);
    expect(result[1].ratio).toBeCloseTo(2 / 3, 3);
    expect(result[1].freightShare).toBeCloseTo(16.67, 1);

    const sum = result.reduce((s, r) => s + r.freightShare, 0);
    expect(sum).toBeCloseTo(25, 2);
  });

  it('分摊之和精确等于总运费（分币处理）', () => {
    const items = [
      makeItem('1', 'A', 10),
      makeItem('2', 'B', 20),
      makeItem('3', 'C', 30),
    ];
    const result = splitFreight(items, 7);

    const sum = result.reduce((s, r) => s + r.freightShare, 0);
    expect(sum).toBe(7);

    expect(result[0].freightShare).toBeCloseTo(1.17, 1);
    expect(result[1].freightShare).toBeCloseTo(2.33, 1);
    expect(result[2].freightShare).toBeCloseTo(3.5, 1);
  });

  it('单成员承担全部运费', () => {
    const items = [makeItem('1', '独苗', 100)];
    const result = splitFreight(items, 15);
    expect(result).toHaveLength(1);
    expect(result[0].freightShare).toBe(15);
    expect(result[0].ratio).toBe(1);
  });

  it('总金额为0时，人均摊', () => {
    const items = [makeItem('1', 'A', 0), makeItem('2', 'B', 0)];
    const result = splitFreight(items, 10);
    expect(result[0].freightShare + result[1].freightShare).toBe(10);
    expect(result[0].ratio).toBe(0.5);
    expect(result[1].ratio).toBe(0.5);
  });

  it('存在负数金额时，人均摊', () => {
    const items = [makeItem('1', 'A', 100), makeItem('2', 'B', -50)];
    const result = splitFreight(items, 12);
    expect(result).toHaveLength(2);
    expect(result[0].ratio).toBe(0.5);
    expect(result[1].ratio).toBe(0.5);
    expect(result[0].freightShare + result[1].freightShare).toBe(12);
  });

  it('50个成员时，分摊总和精确等于总运费', () => {
    const items: FreightInputItem[] = Array.from({ length: 50 }, (_, i) =>
      makeItem('m' + i, '成员' + i, 10 + i * 5),
    );
    const freight = 88.88;
    const result = splitFreight(items, freight);

    expect(result).toHaveLength(50);
    const sum = result.reduce((s, r) => s + r.freightShare, 0);
    expect(sum).toBeCloseTo(freight, 2);

    const ratioSum = result.reduce((s, r) => s + r.ratio, 0);
    expect(ratioSum).toBeCloseTo(1, 5);
  });

  it('购买金额越大，分摊运费越多（单调性）', () => {
    const items = [
      makeItem('1', '少', 10),
      makeItem('2', '中', 50),
      makeItem('3', '多', 100),
    ];
    const result = splitFreight(items, 30);
    expect(result[0].freightShare).toBeLessThan(result[1].freightShare);
    expect(result[1].freightShare).toBeLessThan(result[2].freightShare);
    expect(result[0].ratio).toBeLessThan(result[1].ratio);
    expect(result[1].ratio).toBeLessThan(result[2].ratio);
  });
});
