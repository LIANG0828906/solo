// 日期工具函数

/**
 * 将数字补零到2位
 * @param n 输入数字
 * @returns 补零后的字符串，如 5 -> '05'
 */
export function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 * @param d Date 对象或日期字符串（如 '2024/3/5'）
 * @returns 格式化后的日期字符串，如 '2024-03-05'
 */
export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * 给指定日期字符串增加/减少天数
 * @param dateStr YYYY-MM-DD 格式的日期字符串
 * @param days 要增加的天数（负数为减少）
 * @returns 新的 YYYY-MM-DD 日期字符串
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * 获取今天的日期字符串
 * @returns 今天的 YYYY-MM-DD 格式日期
 */
export function getTodayStr(): string {
  return formatDate(new Date());
}
