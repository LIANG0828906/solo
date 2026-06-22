// ============================================================
// 衣物 API 模块
// 数据流向：组件调用 -> API方法 -> axios实例 -> 后端 /clothes 接口
// 调用关系：被组件和 Zustand store 调用
// ============================================================

import api from './index';
import type { Cloth } from '@/types';

/**
 * 获取衣物列表
 * @returns 衣物列表数组
 */
export const getClothes = async (): Promise<Cloth[]> => {
  const response = await api.get('/clothes');
  return response.data;
};

/**
 * 创建新衣物
 * @param formData - 包含衣物信息和图片的 FormData
 * @returns 创建成功的衣物对象
 */
export const createCloth = async (formData: FormData): Promise<Cloth> => {
  const response = await api.post('/clothes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * 更新衣物信息
 * @param id - 衣物 ID
 * @param data - 更新的衣物数据
 * @returns 更新后的衣物对象
 */
export const updateCloth = async (
  id: string,
  data: Partial<Omit<Cloth, 'id' | 'userId' | 'createdAt'>>
): Promise<Cloth> => {
  const response = await api.put(`/clothes/${id}`, data);
  return response.data;
};

/**
 * 删除衣物
 * @param id - 衣物 ID
 */
export const deleteCloth = async (id: string): Promise<void> => {
  await api.delete(`/clothes/${id}`);
};

/**
 * 重新排序衣物
 * @param orderData - 排序数据，包含衣物 ID 和新的排序序号
 */
export const reorderClothes = async (
  orderData: { id: string; order: number }[]
): Promise<void> => {
  await api.put('/clothes/reorder', { order: orderData });
};
