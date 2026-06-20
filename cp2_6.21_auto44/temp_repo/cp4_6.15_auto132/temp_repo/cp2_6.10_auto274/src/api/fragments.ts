import axios from 'axios';
import type { Fragment, PlacedFragment, MatchResponse, ScoreRequest, ScoreResponse, PoemData } from '../types';

const apiClient = axios.create({
  baseURL: '/api',
});

export const getFragments = async (): Promise<{ fragments: Fragment[]; poem: PoemData }> => {
  const response = await apiClient.get<{ fragments: Fragment[]; poem: PoemData }>('/fragments');
  return response.data;
};

export const calculateMatch = async (
  fragment: Fragment,
  placedFragments: PlacedFragment[]
): Promise<MatchResponse> => {
  const response = await apiClient.post<MatchResponse>('/match', {
    fragment,
    placedFragments,
  });
  return response.data;
};

export const calculateScore = async (request: ScoreRequest): Promise<ScoreResponse> => {
  const response = await apiClient.post<ScoreResponse>('/score', request);
  return response.data;
};
