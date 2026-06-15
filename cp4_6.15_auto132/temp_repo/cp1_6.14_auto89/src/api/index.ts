// ============================================================
// Axios 实例封装模块
// 数据流向：组件 -> API层 -> axios拦截 -> 后端
// 调用关系：被 src/api/*.ts 各业务模块导入使用
// ============================================================

import axios from 'axios';

/**
 * Axios 实例
 * 配置 baseURL 为 '/api'，通过 Vite 代理转发到后端服务
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 * 从 localStorage 获取 token，添加到 Authorization header
 * 数据流向：前端发起请求 -> 拦截器注入 token -> 后端
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一处理错误响应
 * 演示模式：遇到 401 时不强制跳转（后端会自动使用 demo 用户）
 * 数据流向：后端返回响应 → 拦截器处理 → 前端组件
 */
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 演示模式下不跳转登录页，清除无效 token 即可
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.warn('认证失败（演示模式自动使用 demo 用户）');
    }
    return Promise.reject(error);
  }
);

export default api;
