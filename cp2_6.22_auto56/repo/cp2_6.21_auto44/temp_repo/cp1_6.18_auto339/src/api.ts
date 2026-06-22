import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Book {
  id: number
  title: string
  author: string
  cover_url?: string
  tags: string
  progress: number
  notes: string
  added_at: string
}

export interface BookList {
  id: number
  name: string
  description: string
  cover_color: string
  is_public: boolean
  user_id: number
  user?: User
  books: Book[]
  created_at: string
  updated_at: string
  similarity_score?: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface CreateBookListRequest {
  name: string
  description: string
  cover_color: string
  is_public: boolean
}

export interface AddBookRequest {
  title: string
  author: string
  cover_url?: string
  tags?: string
  progress?: number
  notes?: string
}

export interface UpdateBookRequest {
  progress?: number
  notes?: string
  cover_url?: string
}

export const authAPI = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (username: string, password: string) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post<AuthResponse>('/auth/login', form).then((r) => r.data)
  },
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

export const booklistAPI = {
  create: (data: CreateBookListRequest) =>
    api.post<BookList>('/booklists', data).then((r) => r.data),
  getMy: () => api.get<BookList[]>('/booklists').then((r) => r.data),
  getPublic: () => api.get<BookList[]>('/booklists/public').then((r) => r.data),
  getById: (id: number) => api.get<BookList>(`/booklists/${id}`).then((r) => r.data),
  update: (id: number, data: Partial<CreateBookListRequest>) =>
    api.put<BookList>(`/booklists/${id}`, data).then((r) => r.data),
  addBook: (id: number, data: AddBookRequest) =>
    api.post<Book>(`/booklists/${id}/books`, data).then((r) => r.data),
  updateBook: (booklistId: number, bookId: number, data: UpdateBookRequest) =>
    api.put<Book>(`/booklists/${booklistId}/books/${bookId}`, data).then((r) => r.data),
  deleteBook: (booklistId: number, bookId: number) =>
    api.delete(`/booklists/${booklistId}/books/${bookId}`),
  clone: (id: number) =>
    api.post<BookList>(`/booklists/${id}/clone`).then((r) => r.data),
  autocomplete: (q: string) =>
    api.get<{ title: string; author: string }[]>('/booklists/books/search/autocomplete', {
      params: { q },
    }).then((r) => r.data),
}

export const recommendAPI = {
  getRecommendations: () => api.get<BookList[]>('/recommend').then((r) => r.data),
}

export default api
