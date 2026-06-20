import axios from 'axios';
import { Nutrition, Ingredient } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 10000,
});

export const calculateNutrition = async (ingredients: Ingredient[]): Promise<Nutrition> => {
  const response = await api.post('/nutrition/calculate', { ingredients });
  return response.data;
};
