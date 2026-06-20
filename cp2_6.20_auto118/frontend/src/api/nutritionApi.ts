import axios from 'axios';
import { Ingredient, Nutrition } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const calculateNutrition = async (ingredients: Ingredient[]): Promise<Nutrition> => {
  const response = await api.post('/nutrition/calculate', { ingredients });
  return response.data;
};
