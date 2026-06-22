import axios from 'axios';
import { BrewRecord, FilterParams, PaginatedResponse, FlavorRatings, BrewParams } from './types';

const api = axios.create({
  baseURL: '/api',
});

export const getRecords = async (page: number, pageSize: number): Promise<PaginatedResponse<BrewRecord>> => {
  const response = await api.get('/records', {
    params: { page, pageSize },
  });
  return response.data;
};

export const submitRecord = async (
  params: BrewParams & { ratings: FlavorRatings }
): Promise<BrewRecord> => {
  const { ratings } = params;
  const totalScore = Math.round(
    (ratings.acidity + ratings.sweetness + ratings.bitterness + ratings.thickness + ratings.aftertaste) / 5 * 10
  ) / 10;
  const response = await api.post('/records', { ...params, totalScore });
  return response.data;
};

export const searchRecords = async (
  params: FilterParams
): Promise<PaginatedResponse<BrewRecord>> => {
  const response = await api.get('/records/search', { params });
  return response.data;
};
