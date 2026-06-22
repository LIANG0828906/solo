const BASE_URL = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  return data;
}

export const api = {
  register: (username: string, password: string, nickname: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname }),
    }),

  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request('/auth/me'),

  getClubs: () => request('/clubs'),

  getClub: (id: string) => request(`/clubs/${id}`),

  createClub: (data: {
    name: string;
    description: string;
    coverImage?: string;
    startDate?: string;
    endDate?: string;
    hasCrowdfunding?: boolean;
    crowdfundingGoal?: number;
    crowdfundingDeadline?: string;
  }) =>
    request('/clubs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getClubMembers: (id: string) => request(`/clubs/${id}/members`),

  getReviews: (clubId: string) => request(`/clubs/${clubId}/reviews`),

  createReview: (clubId: string, rating: number, content: string) =>
    request(`/clubs/${clubId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, content }),
    }),

  voteHelpful: (reviewId: string) =>
    request(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    }),

  getRecommendations: (clubId: string) =>
    request(`/clubs/${clubId}/recommendations`),

  voteRecommendation: (recId: string) =>
    request(`/recommendations/${recId}/vote`, {
      method: 'POST',
    }),

  getCrowdfunding: (clubId: string) =>
    request(`/clubs/${clubId}/crowdfunding`),

  supportCrowdfunding: (clubId: string, amount: number) =>
    request(`/clubs/${clubId}/crowdfunding/support`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  getMyClubs: () => request('/my/clubs'),

  getMyReviews: () => request('/my/reviews'),
};
