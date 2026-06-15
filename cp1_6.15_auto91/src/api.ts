export interface User {
  id: string
  email: string
  password: string
  nickname: string
  avatar: string
  isAdmin: boolean
  createdAt: Date
}

export interface Book {
  id: string
  title: string
  author: string
  publishYear: number
  description: string
  coverUrl: string
  category: 'novel' | 'documentary' | 'technology' | 'art' | 'life'
  transactionType: 'exchange' | 'sale'
  exchangeCategory?: string
  price?: number
  ownerId: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  createdAt: Date
}

export interface Transaction {
  id: string
  bookId: string
  buyerId: string
  sellerId: string
  type: 'exchange' | 'sale'
  status: 'pending' | 'confirmed' | 'completed'
  price?: number
  createdAt: Date
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password'>
}

export interface RegisterData {
  email: string
  password: string
  nickname: string
}

export interface LoginData {
  email: string
  password: string
}

export interface CreateBookData {
  title: string
  author: string
  publishYear: number
  description: string
  coverUrl: string
  category: 'novel' | 'documentary' | 'technology' | 'art' | 'life'
  transactionType: 'exchange' | 'sale'
  exchangeCategory?: string
  price?: number
}

export interface ReviewBookData {
  status: 'approved' | 'rejected'
  rejectReason?: string
}

export interface CreateTransactionData {
  bookId: string
  type: 'exchange' | 'sale'
  price?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const BASE_URL = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })

  let data: ApiResponse<T>
  try {
    data = await response.json()
  } catch {
    throw new Error('服务器响应解析失败')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || `请求失败: ${response.status}`)
  }

  return data.data as T
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getBooks(params?: Record<string, string | number>): Promise<Book[]> {
  const query = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : ''
  return request<Book[]>(`/books${query}`)
}

export async function getBookById(id: string): Promise<Book> {
  return request<Book>(`/books/${id}`)
}

export async function createBook(data: CreateBookData): Promise<Book> {
  return request<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function reviewBook(id: string, data: ReviewBookData): Promise<Book> {
  return request<Book>(`/books/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getUserBooks(userId: string): Promise<Book[]> {
  return request<Book[]>(`/users/${userId}/books`)
}

export async function createTransaction(data: CreateTransactionData): Promise<Transaction> {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>('/transactions')
}
