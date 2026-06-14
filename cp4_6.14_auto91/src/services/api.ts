import axios from 'axios'
import type { Recipe, ApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const recipeApi = {
  getList: (page = 1, pageSize = 10) =>
    api.get<ApiResponse<Recipe[]>>('/recipes', { params: { page, pageSize } }).then(r => r.data),

  searchByIngredients: (ingredients: string[]) =>
    api.get<ApiResponse<Recipe[]>>('/recipes/search', {
      params: { ingredients: ingredients.join(',') }
    }).then(r => r.data),

  getHot: () =>
    api.get<ApiResponse<Recipe[]>>('/recipes/hot').then(r => r.data),

  getDetail: (id: string) =>
    api.get<ApiResponse<Recipe>>(`/recipes/${id}`).then(r => r.data),

  create: (data: Partial<Recipe>) =>
    api.post<ApiResponse<Recipe>>('/recipes', data).then(r => r.data),

  like: (id: string) =>
    api.post<ApiResponse<{ likes: number; dislikes: number }>>(`/recipes/${id}/like`).then(r => r.data),

  dislike: (id: string) =>
    api.post<ApiResponse<{ likes: number; dislikes: number }>>(`/recipes/${id}/dislike`).then(r => r.data),

  getRecent: () =>
    api.get<ApiResponse<Recipe[]>>('/user/recent').then(r => r.data),

  getPublished: () =>
    api.get<ApiResponse<Recipe[]>>('/user/published').then(r => r.data)
}
