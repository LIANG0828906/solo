export interface Ingredient {
  name: string;
  amount: string;
}

export type Difficulty = '简单' | '中等' | '困难';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
  coverImage: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeFormData {
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
  coverImage: string;
  tags: string[];
}

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes`);
  return handleResponse<Recipe[]>(res);
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes/${id}`);
  return handleResponse<Recipe>(res);
}

export async function createRecipe(data: RecipeFormData): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Recipe>(res);
}

export async function updateRecipe(id: string, data: RecipeFormData): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Recipe>(res);
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function uploadImage(base64: string): Promise<string> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  const data = await handleResponse<{ url: string }>(res);
  return data.url;
}

export function compressImage(file: File, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建画布上下文'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
