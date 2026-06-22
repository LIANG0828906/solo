const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export interface CreatePostData {
  content: string;
  category?: string;
}

export interface CreateReplyData {
  content: string;
}

export interface CreateMemberData {
  name: string;
  email: string;
  avatar?: string;
}

export function getPosts(activityId: string, category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/activities/${activityId}/posts${query}`);
}

export function createPost(activityId: string, data: CreatePostData) {
  return request(`/activities/${activityId}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getPost(postId: string) {
  return request(`/posts/${postId}`);
}

export function createReply(postId: string, data: CreateReplyData) {
  return request(`/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getLeaderboard(activityId: string) {
  return request(`/activities/${activityId}/leaderboard`);
}

export function getMembers() {
  return request('/members');
}

export function createMember(data: CreateMemberData) {
  return request('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
