import axios from 'axios';
import type { User, Box, Fishing, Recommendation, ApiResponse } from '../types';

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '请求失败';
    console.error('API Error:', errorMessage);
    alert(errorMessage);
    return Promise.reject(error);
  }
);

export const registerUser = async (nickname: string): Promise<User> => {
  try {
    const response = await axiosInstance.post<ApiResponse<User>>('/users/register', { nickname });
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || '注册失败');
  } catch (error) {
    console.error('registerUser error:', error);
    throw error;
  }
};

export const createBox = async (boxData: {
  name: string;
  book: {
    title: string;
    author: string;
    recommendation: string;
    emoji: string;
  };
}): Promise<Box> => {
  try {
    const response = await axiosInstance.post<ApiResponse<Box>>('/boxes', boxData);
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || '创建书箱失败');
  } catch (error) {
    console.error('createBox error:', error);
    throw error;
  }
};

export const getBoxes = async (search?: string): Promise<Box[]> => {
  try {
    const params = search ? { search } : {};
    const response = await axiosInstance.get<ApiResponse<Box[]>>('/boxes', { params });
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || '获取书箱列表失败');
  } catch (error) {
    console.error('getBoxes error:', error);
    throw error;
  }
};

export const fishBook = async (boxId: string, userId: string): Promise<Fishing> => {
  try {
    const response = await axiosInstance.post<ApiResponse<Fishing>>('/fish', { boxId, userId });
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || '捞书失败');
  } catch (error) {
    console.error('fishBook error:', error);
    throw error;
  }
};

export const getRecommendations = async (userId: string): Promise<Recommendation[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Recommendation[]>>(`/recommendations/${userId}`);
    const data = response.data;
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.message || '获取推荐失败');
  } catch (error) {
    console.error('getRecommendations error:', error);
    throw error;
  }
};

export default axiosInstance;
