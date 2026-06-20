import axios from 'axios';

const API_BASE = '/api/reviews';

export interface ReviewPayload {
  bookTitle: string;
  bookCover: string;
  author: string;
  content: string;
  tags: string[];
  userId: string;
}

export interface ReviewResponse {
  id: string;
  bookTitle: string;
  bookCover: string;
  author: string;
  content: string;
  tags: string[];
  likes: number;
  commentCount: number;
  userId: string;
  createdAt: string;
}

export async function submitReview(payload: ReviewPayload): Promise<ReviewResponse> {
  try {
    const res = await axios.post(`${API_BASE}`, payload);
    return res.data;
  } catch {
    return {
      id: `r${Date.now()}`,
      ...payload,
      likes: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getReviews(params: { page?: number; limit?: number }): Promise<ReviewResponse[]> {
  try {
    const res = await axios.get(`${API_BASE}`, { params });
    return res.data;
  } catch {
    return [];
  }
}

export async function likeReview(reviewId: string, userId: string): Promise<void> {
  try {
    await axios.post(`${API_BASE}/${reviewId}/like`, { userId });
  } catch {
    return;
  }
}

export async function getReviewById(reviewId: string): Promise<ReviewResponse | null> {
  try {
    const res = await axios.get(`${API_BASE}/${reviewId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function addComment(reviewId: string, userId: string, content: string): Promise<void> {
  try {
    await axios.post(`${API_BASE}/${reviewId}/comments`, { userId, content });
  } catch {
    return;
  }
}
