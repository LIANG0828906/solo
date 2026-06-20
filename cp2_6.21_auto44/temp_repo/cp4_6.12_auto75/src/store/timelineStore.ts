// 时间线全局状态管理 - zustand
import { create } from 'zustand';
import { formatDate, addDays, getTodayStr } from '@/utils/dateUtils';

// 预设色板（8种颜色）
export const PRESET_COLORS = [
  '#FF6B6