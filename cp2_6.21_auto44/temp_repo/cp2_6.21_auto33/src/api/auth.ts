import client from './client'

export interface User {
  id: number
  username: string
  email: string
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await client.post('/auth/login', data)
  return response.data
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await client.post('/auth/register', data)
  return response.data
}

export const getUserInfo = async (): Promise<User> => {
  const response = await client.get('/auth/me')
  return response.data
}
