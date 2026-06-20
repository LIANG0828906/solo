import { describe, it, expect } from 'vitest';
import { formatCountdown, isGroupExpired } from '../src/utils/freightSplit';

describe('倒计时与过期逻辑', () => {
  it('过期时间返回 expired=true', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = formatCountdown(past);
    expect(result.expired).toBe(true);
    expect(result.urgent).toBe(false);
    expect(result.text).toBe('已截止');
    expect(isGroupExpired(past)).toBe(true);
  });

  it('未来时间返回 expired=false', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const result = formatCountdown(future);
    expect(result.expired).toBe(false);
    expect(result.urgent).toBe(false);
    expect(isGroupExpired(future)).toBe(false);
  });

  it('不足1小时返回 urgent=true 并显示分秒', () => {
    const near = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = formatCountdown(near);
    expect(result.urgent).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.text).toMatch(/剩 \d+分\d+秒/);
  });

  it('超过1小时显示小时分钟', () => {
    const near = new Date(Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString();
    const result = formatCountdown(near);
    expect(result.urgent).toBe(false);
    expect(result.text).toMatch(/剩 2小时15分/);
  });

  it('超过24小时显示天和小时', () => {
    const far = new Date(Date.now() + 3 * 86400000 + 5 * 3600 * 1000).toISOString();
    const result = formatCountdown(far);
    expect(result.text).toMatch(/剩 3天5小时/);
  });

  it('urgent 状态在59分钟59秒触发', () => {
    const justUnder = new Date(Date.now() + 3_599_000).toISOString();
    const result = formatCountdown(justUnder);
    expect(result.urgent).toBe(true);
  });

  it('urgent 状态在1小时整不触发', () => {
    const justOver = new Date(Date.now() + 3_600_000 + 1).toISOString();
    const result = formatCountdown(justOver);
    expect(result.urgent).toBe(false);
  });
});
