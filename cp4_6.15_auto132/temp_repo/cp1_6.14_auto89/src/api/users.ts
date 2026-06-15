// ============================================================
// 用户 API 模块
// 数据流向：组件调用 -> API方法 -> axios实例 -> 后端 /users 接口
// 调用关系：被用户相关组件调用
// ============================================================

import api from './index';
import type { PublicUser, Cloth, Outfit } from '@/types';

/**
 * 搜索用户
 * @param keyword - 搜索关键词
 * @returns 匹配的用户列表
 */
export const searchUsers = async (keyword: string): Promise<PublicUser[]> => {
  const response = await api.get('/users/search', {
    params: { keyword },
  });
  return response.data;
};

/**
 * 获取用户详情
 * @param id - 用户 ID
 * @returns 用户公开信息
 */
export const getUser = async (id: string): Promise<PublicUser> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * 关注用户
 * @param id - 要关注的用户 ID
 */
export const followUser = async (id: string): Promise<void> => {
  await api.post(`/users/${id}/follow`);
};

/**
 * 取消关注用户
 * @param id - 要取消关注的用户 ID
 */
export const unfollowUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}/follow`);
};

/**
 * 获取用户衣橱
 * @param id - 用户 ID
 * @returns 用户的衣物列表
 */
export const getUserClothes = async (id: string): Promise<Cloth[]> => {
  const response = await api.get(`/users/${id}/clothes`);
  return response.data;
};

/**
 * 获取用户搭配
 * @param id - 用户 ID
 * @returns 用户的搭配列表
 */
export const getUserOutfits = async (id: string): Promise<Outfit[]> => {
  const response = await api.get(`/users/${id}/outfits`);
  return response.data;
};
