const API_BASE = 'http://localhost:3003';

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  force: number;
  speed: number;
}

export interface RecipeParams {
  force: number;
  angle: number;
  speed: number;
}

export interface Recipe {
  id: string;
  name: string;
  createdAt: number;
  params: RecipeParams;
  trajectory: TrajectoryPoint[];
}

export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const response = await fetch(`${API_BASE}/api/recipes`);
    if (!response.ok) {
      throw new Error('获取配方列表失败');
    }
    return response.json();
  } catch (error) {
    console.error('获取配方列表错误:', error);
    return [];
  }
}

export async function saveRecipe(
  data: Omit<Recipe, 'id' | 'createdAt'>
): Promise<Recipe | null> {
  try {
    const response = await fetch(`${API_BASE}/api/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '保存配方失败');
    }
    return response.json();
  } catch (error) {
    console.error('保存配方错误:', error);
    return null;
  }
}
