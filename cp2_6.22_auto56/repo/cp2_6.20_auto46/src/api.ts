import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export async function fetchReagents() {
  return api.get('/reagents');
}

export async function fetchRecipes() {
  return api.get('/recipes');
}

export async function createRecipe(data: Record<string, unknown>) {
  return api.post('/recipes', data);
}

export async function deleteRecipe(id: string) {
  return api.delete(`/recipes/${id}`);
}

export async function fetchHistory() {
  return api.get('/history');
}

export default api;
