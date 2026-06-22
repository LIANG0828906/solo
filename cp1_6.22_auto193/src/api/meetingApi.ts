import { Meeting, CreateMeetingRequest, Todo, Resolution } from '../types'

const API_BASE = '/api'

export const meetingApi = {
  createMeeting: async (data: CreateMeetingRequest): Promise<Meeting> => {
    const response = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: data.content, title: data.title }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '创建会议失败')
    }
    
    return response.json()
  },

  getMeetings: async (search?: string): Promise<Meeting[]> => {
    const url = search 
      ? `${API_BASE}/meetings?search=${encodeURIComponent(search)}`
      : `${API_BASE}/meetings`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('获取会议列表失败')
    }
    
    return response.json()
  },

  getMeeting: async (id: string): Promise<Meeting> => {
    const response = await fetch(`${API_BASE}/meetings/${id}`)
    
    if (!response.ok) {
      throw new Error('获取会议详情失败')
    }
    
    return response.json()
  },

  updateTodo: async (id: string, updates: Partial<Todo>): Promise<Todo> => {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    
    if (!response.ok) {
      throw new Error('更新待办事项失败')
    }
    
    return response.json()
  },

  updateResolution: async (id: string, updates: Partial<Resolution>): Promise<Resolution> => {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    
    if (!response.ok) {
      throw new Error('更新决议状态失败')
    }
    
    return response.json()
  },

  deleteTodo: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('删除待办事项失败')
    }
  },
}
