// ============================================================
// 搭配 API 模块
// 数据流向：组件调用 -> API方法 -> axios实例 -> 后端 /outfits 接口
// 调用关系：被组件和 Zustand store 调用
// ============================================================

import api from './index';
import type { Outfit } from '@/types';

/**
 * 获取搭配列表
 * @returns 搭配列表数组
 */
export const getOutfits = async (): Promise<Outfit[]> => {
  const response = await api.get('/outfits');
  return response.data;
};

/**
 * 创建新搭配
 * @param data - 搭配数据
 * @returns 创建成功的搭配对象
 */
export const createOutfit = async (
  data: Omit<Outfit, 'id' | 'userId' | 'createdAt'>
): Promise<Outfit> => {
  const response = await api.post('/outfits', data);
  return response.data;
};

/**
 * 获取搭配详情
 * @param id - 搭配 ID
 * @returns 搭配详情对象
 */
export const getOutfit = async (id: string): Promise<Outfit> => {
  const response = await api.get(`/outfits/${id}`);
  return response.data;
};

/**
 * 删除搭配
 * @param id - 搭配 ID
 */
export const deleteOutfit = async (id: string): Promise<void> => {
  await api.delete(`/outfits/${id}`);
};
