import axios from 'axios';
import type { TrainingRecord, Achievement, StatsData } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const getRecords = async (): Promise<TrainingRecord[]> => {
  try {
    const response = await api.get('/records');
    return response.data;
  } catch (error) {
    console.error('获取训练记录失败:', error);
    throw error;
  }
};

export const createRecord = async (data: Omit<TrainingRecord, 'id' | 'created_at'>): Promise<TrainingRecord> => {
  try {
    const response = await api.post('/records', data);
    return response.data;
  } catch (error) {
    console.error('创建训练记录失败:', error);
    throw error;
  }
};

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const response = await api.get('/achievements');
    return response.data;
  } catch (error) {
    console.error('获取成就列表失败:', error);
    throw error;
  }
};

export const getStats = async (): Promise<StatsData> => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    throw error;
  }
};
