export interface Requirement {
  id: string;
  pet_name: string;
  pet_breed: string;
  pet_age: number;
  pet_personality: string[];
  pet_avatar: string;
  start_date: string;
  end_date: string;
  daily_budget: number;
  owner_id: string;
  owner_name: string;
  status: string;
  created_at: string;
  applications: Application[];
}

export interface Application {
  id: string;
  foster_id: string;
  foster_name: string;
  foster_rating: number;
  foster_intro: string;
  foster_avatar: string;
  status: string;
  created_at: string;
}

export interface Order {
  id: string;
  requirement_id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar: string;
  foster_id: string;
  foster_name: string;
  foster_avatar: string;
  pet_name: string;
  pet_avatar: string;
  start_date: string;
  end_date: string;
  daily_fee: number;
  total_fee: number;
  status: 'pending_payment' | 'in_progress' | 'completed' | 'cancelled';
  contract_confirmed: boolean;
  created_at: string;
  daily_logs: DailyLog[];
  contract_terms: string[];
}

export interface DailyLog {
  id: string;
  foster_id: string;
  photos: string[];
  content: string;
  date: string;
  comments: LogComment[];
}

export interface LogComment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface FosterFamily {
  id: string;
  name: string;
  avatar: string;
  environment_photos: string[];
  max_pet_size: string;
  daily_fee: number;
  rating: number;
  reviews: Review[];
  bio: string;
}

export interface Review {
  id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  content: string;
  rating: number;
  date: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  per_page: number;
  data: T[];
}

export interface ListResponse<T> {
  total: number;
  data: T[];
}

interface ApiState {
  loading: boolean;
  error: string | null;
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络请求失败，请检查网络连接');
    }
  }

  async getRequirements(
    page: number = 1,
    per_page: number = 20,
    filters?: {
      pet_type?: string;
      min_budget?: number;
      max_budget?: number;
    }
  ): Promise<PaginatedResponse<Requirement>> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(per_page),
    });

    if (filters?.pet_type) params.append('pet_type', filters.pet_type);
    if (filters?.min_budget !== undefined)
      params.append('min_budget', String(filters.min_budget));
    if (filters?.max_budget !== undefined)
      params.append('max_budget', String(filters.max_budget));

    return this.request<PaginatedResponse<Requirement>>(
      `/requirements?${params.toString()}`
    );
  }

  async getRequirement(id: string): Promise<Requirement> {
    return this.request<Requirement>(`/requirements/${id}`);
  }

  async createRequirement(
    data: Omit<Requirement, 'id' | 'status' | 'created_at' | 'applications'>
  ): Promise<Requirement> {
    return this.request<Requirement>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptApplication(
    requirementId: string,
    applicationId: string
  ): Promise<{ message: string; order: Order }> {
    return this.request<{ message: string; order: Order }>(
      `/requirements/${requirementId}/applications/${applicationId}/accept`,
      {
        method: 'POST',
      }
    );
  }

  async getOrders(
    filters?: {
      status?: string;
      sort_by_date?: 'asc' | 'desc';
    }
  ): Promise<ListResponse<Order>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sort_by_date) params.append('sort_by_date', filters.sort_by_date);

    const queryString = params.toString();
    return this.request<ListResponse<Order>>(
      `/orders${queryString ? `?${queryString}` : ''}`
    );
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async confirmPayment(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/confirm-payment`, {
      method: 'POST',
    });
  }

  async completeOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/complete`, {
      method: 'POST',
    });
  }

  async addDailyLog(
    orderId: string,
    data: { foster_id: string; photos: string[]; content: string }
  ): Promise<DailyLog> {
    return this.request<DailyLog>(`/orders/${orderId}/logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addLogComment(
    orderId: string,
    logId: string,
    data: { user_id: string; user_name: string; content: string }
  ): Promise<LogComment> {
    return this.request<LogComment>(
      `/orders/${orderId}/logs/${logId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getFosters(): Promise<ListResponse<FosterFamily>> {
    return this.request<ListResponse<FosterFamily>>('/fosters');
  }

  async getFoster(id: string): Promise<FosterFamily> {
    return this.request<FosterFamily>(`/fosters/${id}`);
  }
}

export const api = new ApiClient();

export function useApiState(): ApiState & {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
} {
  const [loading, setLoading] = [false, () => {}];
  const [error, setError] = [null as string | null, () => {}];
  return {
    loading,
    error,
    setLoading,
    setError,
    reset: () => {
      setLoading(false);
      setError(null);
    },
  };
}
