/**
 * 计算连续打卡应得积分
 * @param streakDays - 连续打卡天数
 * @returns 本次打卡应得积分
 */
export function calculatePoints(streakDays: number): number {
  // 连续打卡天数小于等于0，返回0积分
  if (streakDays <= 0) {
    return 0;
  }

  // 第1-7天，每天10积分
  if (streakDays <= 7) {
    return 10;
  }

  // 第8-30天，每天20积分
  if (streakDays <= 30) {
    return 20;
  }

  // 31天及以上，每天30积分
  return 30;
}
