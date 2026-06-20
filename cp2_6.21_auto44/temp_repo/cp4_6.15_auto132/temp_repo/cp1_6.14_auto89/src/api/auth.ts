// ============================================================
// 认证 API 模块
// 数据流向：登录/注册组件 -> API方法 -> axios实例 -> 后端 /auth 接口
// 调用关系：被认证相关组件和 Zustand store 调用
// ============================================================

import api from './index';
import type { User } from '@/types';

/**
 * 注册接口返回数据类型
 */
interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

/**
 * 用户注册
 * @param data - 注册数据（用户名、密码等）
 * @returns 包含 token 和用户信息的响应
 */
export const register = async (data: {
  username: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * 用户登录
 * @param data - 登录数据（用户名、密码）
 * @returns 包含 token 和用户信息的响应
 */
export const login = async (data: {
  username: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};
