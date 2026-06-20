export interface Recipe {
  id: string;
  name: string;
  image: string;
  description: string;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  ingredients: { name: string; amount: string }[];
  steps: { description: string; images: string[] }[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isPublic: boolean;
  createdAt: string;
  rating: number;
  ratingCount: number;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  favorites: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  rating: number;
  createdAt: string;
}

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export async function fetchRecipes(params?: {
  cuisine?: string;
  difficulty?: string;
  maxTime?: number;
  search?: string;
}): Promise<Recipe[]> {
  const queryParams = new URLSearchParams();
  if (params?.cuisine) queryParams.set('cuisine', params.cuisine);
  if (params?.difficulty) queryParams.set('difficulty', params.difficulty);
  if (params?.maxTime) queryParams.set('maxTime', String(params.maxTime));
  if (params?.search) queryParams.set('search', params.search);

  const query = queryParams.toString();
  return request<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
}

export async function fetchRecipeById(id: string): Promise<Recipe> {
  return request<Recipe>(`/recipes/${id}`);
}

export async function fetchUserRecipes(userId: string): Promise<Recipe[]> {
  return request<Recipe[]>(`/recipes/user/${userId}`);
}

export async function createRecipe(
  recipeData: Omit<Recipe, 'id' | 'createdAt' | 'rating' | 'ratingCount'>,
  imageFile?: File
): Promise<Recipe> {
  const formData = new FormData();
  formData.append('recipe', JSON.stringify(recipeData));
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '创建失败' }));
    throw new Error(error.error || '创建失败');
  }

  return response.json();
}

export async function updateRecipe(
  id: string,
  recipeData: Partial<Recipe>,
  imageFile?: File
): Promise<Recipe> {
  const formData = new FormData();
  formData.append('recipe', JSON.stringify(recipeData));
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '更新失败' }));
    throw new Error(error.error || '更新失败');
  }

  return response.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  await request<void>(`/recipes/${id}`, { method: 'DELETE' });
}

export async function login(username: string, password: string): Promise<User> {
  return request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username: string, password: string): Promise<User> {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchUserById(id: string): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function addFavorite(userId: string, recipeId: string): Promise<{ favorites: string[] }> {
  return request<{ favorites: string[] }>(`/users/${userId}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ recipeId }),
  });
}

export async function removeFavorite(userId: string, recipeId: string): Promise<{ favorites: string[] }> {
  return request<{ favorites: string[] }>(`/users/${userId}/favorites/${recipeId}`, {
    method: 'DELETE',
  });
}

export async function fetchComments(recipeId: string): Promise<Comment[]> {
  return request<Comment[]>(`/comments/recipe/${recipeId}`);
}

export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  return request<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(comment),
  });
}

export async function fetchIngredientSuggestions(query: string): Promise<string[]> {
  if (!query) return [];
  return request<string[]>(`/ingredients/suggest?q=${encodeURIComponent(query)}`);
}

export function generateShareLink(recipeId: string): string {
  return `${window.location.origin}/recipe/${recipeId}`;
}

export function generateEmbedCode(recipe: Recipe): string {
  return `<div style="border:1px solid #e8e8e8;border-radius:12px;padding:16px;max-width:300px;font-family:sans-serif;background:#fffaf0;">
  <h3 style="margin:0 0 12px 0;color:#e85d3a;font-size:18px;">${recipe.name}</h3>
  <p style="margin:0 0 12px 0;color:#666;font-size:14px;">${recipe.description}</p>
  <h4 style="margin:12px 0 8px 0;color:#2d2d2d;font-size:14px;">食材列表</h4>
  <ul style="margin:0;padding:0;list-style:none;">
    ${recipe.ingredients.map(ing => `<li style="padding:4px 0;font-size:13px;color:#2d2d2d;display:flex;justify-content:space-between;"><span>${ing.name}</span><span style="color:#666;">${ing.amount}</span></li>`).join('')}
  </ul>
  <a href="${generateShareLink(recipe.id)}" style="display:inline-block;margin-top:12px;color:#e85d3a;text-decoration:none;font-size:13px;font-weight:500;">查看完整菜谱 →</a>
</div>`;
}
