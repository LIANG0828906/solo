import axios from 'axios'
import type { LevelData } from './types'

const API_BASE = '/api'

export async function saveLevel(levelData: LevelData): Promise<{ success: boolean; message: string; filename?: string }> {
  try {
    const response = await axios.post(`${API_BASE}/save`, levelData, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  } catch (error) {
    console.error('保存关卡失败:', error)
    return { success: false, message: '网络错误，保存失败' }
  }
}

export async function loadLevel(filename?: string): Promise<{ success: boolean; message: string; data?: LevelData }> {
  try {
    const response = await axios.post(`${API_BASE}/load`, { filename }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  } catch (error) {
    console.error('加载关卡失败:', error)
    return { success: false, message: '网络错误，加载失败' }
  }
}

export async function listSaves(): Promise<{ success: boolean; files?: string[]; message?: string }> {
  try {
    const response = await axios.get(`${API_BASE}/saves`)
    return response.data
  } catch (error) {
    return { success: false, message: '获取文件列表失败' }
  }
}
