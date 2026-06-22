// ============================================================
// 交换请求 API 模块
// 数据流向：组件调用 -> API方法 -> axios实例 -> 后端 /swaps 接口
// 调用关系：被交换相关组件调用
// ============================================================

import api from './index';
import type { SwapRequest } from '@/types';

/**
 * 获取交换请求列表
 * @returns 交换请求列表
 */
export const getSwaps = async (): Promise<SwapRequest[]> => {
  const response = await api.get('/swaps');
  return response.data;
};

/**
 * 发起交换请求
 * @param data - 交换请求数据
 * @returns 创建成功的交换请求对象
 */
export const createSwapRequest = async (data: {
  toUserId: string;
  offeredClothId: string;
  requestedClothId: string;
}): Promise<SwapRequest> => {
  const response = await api.post('/swaps', data);
  return response.data;
};

/**
 * 接受交换请求
 * @param id - 交换请求 ID
 * @returns 更新后的交换请求对象
 */
export const acceptSwap = async (id: string): Promise<SwapRequest> => {
  const response = await api.put(`/swaps/${id}/accept`);
  return response.data;
};

/**
 * 拒绝交换请求
 * @param id - 交换请求 ID
 * @returns 更新后的交换请求对象
 */
export const rejectSwap = async (id: string): Promise<SwapRequest> => {
  const response = await api.put(`/swaps/${id}/reject`);
  return response.data;
};
