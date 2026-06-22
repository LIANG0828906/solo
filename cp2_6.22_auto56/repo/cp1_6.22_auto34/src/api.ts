import type { Bookmark } from './types';

const BASE_URL = '/api';

export async function fetchBookmarks(search?: string, tag?: string): Promise<Bookmark[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  
  const queryString = params.toString();
  const url = `${BASE_URL}/bookmarks${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch bookmarks');
  }
  return response.json();
}

export async function fetchTags(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/tags`);
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
}
