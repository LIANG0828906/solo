import { Task, MoodEntry } from '../types';
import { format, subDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export const initialTasks: Task[] = [
  { id: '1', title: '完成项目报告', dueDate: today, priority: 'high', completed: false, order: 0 },
  { id: '2', title: '购买生日礼物', dueDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'), priority: 'medium', completed: false, order: 1 },
  { id: '3', title: '整理书架', dueDate: today, priority: 'low', completed: true, order: 2 },
  { id: '4', title: '预约牙医', dueDate: format(subDays(new Date(), -2), 'yyyy-MM-dd'), priority: 'high', completed: false, order: 3 },
  { id: '5', title: '回复邮件', dueDate: today, priority: 'medium', completed: false, order: 4 },
  { id: '6', title: '准备周会材料', dueDate: format(subDays(new Date(), -1), 'yyyy-MM-dd'), priority: 'high', completed: false, order: 5 },
  { id: '7', title: '给妈妈打电话', dueDate: today, priority: 'medium', completed: true, order: 6 },
  { id: '8', title: '清洗水杯', dueDate: today, priority: 'low', completed: false, order: 7 },
];

export const initialMoodEntries: MoodEntry[] = [
  { date: format(subDays(new Date(), 6), 'yyyy-MM-dd'), mood: 'happy', diary: '今天阳光很好，和朋友一起去了公园散步，心情超级棒！' },
  { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), mood: 'calm', diary: '安静地读了一本书，泡了杯茶，感觉很放松。' },
  { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), mood: 'sad', diary: '下雨天，有点想念远方的朋友。' },
  { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), mood: 'happy', diary: '收到了期待已久的包裹，开心！' },
  { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), mood: 'surprised', diary: '意外收到了老同学的来电，聊了很久，太惊喜了。' },
  { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), mood: 'angry', diary: '今天的交通太糟糕了，堵了一个小时。' },
  { date: today, mood: 'calm', diary: '' },
];
