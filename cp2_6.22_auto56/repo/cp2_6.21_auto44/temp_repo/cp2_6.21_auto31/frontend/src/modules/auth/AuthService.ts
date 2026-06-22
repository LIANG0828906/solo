import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export interface User {
  id: number
  username: string
  email: string
  role: 'parent' | 'teacher'
  name: string
}

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  email: string
  name: string
  role: 'parent' | 'teacher'
}

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  delete api.defaults.headers.common['Authorization']
}

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
}

export const login = async (data: LoginData): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/login', data)
  const { token, user } = response.data
  setToken(token)
  saveUser(user)
  return { token, user }
}

export const register = async (data: RegisterData): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/register', data)
  const { token, user } = response.data
  setToken(token)
  saveUser(user)
  return { token, user }
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me')
  return response.data
}

const token = getToken()
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api
