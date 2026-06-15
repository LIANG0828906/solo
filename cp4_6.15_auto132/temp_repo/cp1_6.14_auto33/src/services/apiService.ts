import axios from 'axios'
import type { TerrainConfig } from '../store/useTerrainStore'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export type SaveConfigResponse = {
  code?: string
  success: boolean
  message?: string
}

export type LoadConfigResponse = {
  config?: TerrainConfig
  success: boolean
  message?: string
}

export const saveConfig = async (
  config: TerrainConfig,
): Promise<SaveConfigResponse> => {
  try {
    const response = await apiClient.post<SaveConfigResponse>('/config', config)
    return {
      success: true,
      code: response.data.code,
      message: response.data.message,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as SaveConfigResponse
      return {
        success: false,
        code: undefined,
        message: data.message || '保存配置失败',
      }
    }
    return {
      success: false,
      code: undefined,
      message: '网络错误，请稍后重试',
    }
  }
}

export const loadConfig = async (
  code: string,
): Promise<LoadConfigResponse> => {
  try {
    const response = await apiClient.get<LoadConfigResponse>(`/config/${code}`)
    return {
      success: true,
      config: response.data.config,
      message: response.data.message,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as LoadConfigResponse
      return {
        success: false,
        config: undefined,
        message: data.message || '加载配置失败',
      }
    }
    return {
      success: false,
      config: undefined,
      message: '网络错误，请稍后重试',
    }
  }
}
