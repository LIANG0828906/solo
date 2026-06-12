import {
  Reservation,
  Ingredient,
  CreateReservationRequest,
  CreateIngredientRequest,
  ApiResponse,
  ApiListResponse,
  ConflictItem,
} from '../types';

const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const fetchWrapper = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: FetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败，请稍后重试');
  }
};

export const getReservations = async (
  date?: string,
  equipment?: string
): Promise<ApiListResponse<Reservation>> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (equipment) params.append('equipment', equipment);

  const queryString = params.toString();
  const endpoint = queryString ? `/reservations?${queryString}` : '/reservations';

  return fetchWrapper<ApiListResponse<Reservation>>(endpoint, {
    method: 'GET',
  });
};

export const createReservation = async (
  data: CreateReservationRequest
): Promise<ApiResponse<Reservation>> => {
  return fetchWrapper<ApiResponse<Reservation>>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelReservation = async (
  id: string
): Promise<ApiResponse<Reservation>> => {
  return fetchWrapper<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, {
    method: 'PUT',
  });
};

export const checkConflicts = async (
  date: string,
  startTime: string,
  endTime: string,
  equipment: string
): Promise<ApiResponse<ConflictItem[]>> => {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
    equipment,
  });

  return fetchWrapper<ApiResponse<ConflictItem[]>>(
    `/reservations/conflicts?${params.toString()}`,
    {
      method: 'GET',
    }
  );
};

export const getIngredients = async (
  category?: string,
  includeClaimed: boolean = false
): Promise<ApiListResponse<Ingredient>> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('includeClaimed', includeClaimed.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/ingredients?${queryString}` : '/ingredients';

  return fetchWrapper<ApiListResponse<Ingredient>>(endpoint, {
    method: 'GET',
  });
};

export const createIngredient = async (
  data: CreateIngredientRequest
): Promise<ApiResponse<Ingredient>> => {
  return fetchWrapper<ApiResponse<Ingredient>>('/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const claimIngredient = async (
  id: string
): Promise<ApiResponse<Ingredient>> => {
  return fetchWrapper<ApiResponse<Ingredient>>(`/ingredients/${id}/claim`, {
    method: 'PUT',
  });
};

export const getExpiredIngredients = async (): Promise<
  ApiListResponse<Ingredient>
> => {
  return fetchWrapper<ApiListResponse<Ingredient>>('/ingredients/expired', {
    method: 'GET',
  });
};

export const getMyIngredients = async (): Promise<
  ApiListResponse<Ingredient>
> => {
  return fetchWrapper<ApiListResponse<Ingredient>>('/ingredients/mine', {
    method: 'GET',
  });
};

export const getMyReservations = async (): Promise<
  ApiListResponse<Reservation>
> => {
  return fetchWrapper<ApiListResponse<Reservation>>('/reservations/mine', {
    method: 'GET',
  });
};

export const deleteIngredient = async (
  id: string
): Promise<ApiResponse<void>> => {
  return fetchWrapper<ApiResponse<void>>(`/ingredients/${id}`, {
    method: 'DELETE',
  });
};
