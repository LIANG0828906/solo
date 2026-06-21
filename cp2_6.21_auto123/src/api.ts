/* eslint-disable no-useless-catch */
import axios from 'axios';
import type { Snippet, SearchResult, SnippetCreate, SnippetUpdate, TagCount } from './types';

const api = axios.create({
  baseURL: '/api',
});

export const fetchSnippets = async (): Promise<Snippet[]> => {
  try {
    const response = await api.get<Snippet[]>('/snippets');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSnippet = async (id: string): Promise<Snippet> => {
  try {
    const response = await api.get<Snippet>(`/snippets/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addSnippet = async (data: SnippetCreate): Promise<Snippet> => {
  try {
    const response = await api.post<Snippet>('/snippets', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSnippet = async (id: string, data: SnippetUpdate): Promise<Snippet> => {
  try {
    const response = await api.put<Snippet>(`/snippets/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSnippet = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete<{ success: boolean }>(`/snippets/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchSnippets = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await api.get<SearchResult[]>('/search', {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchTags = async (): Promise<TagCount[]> => {
  try {
    const response = await api.get<TagCount[]>('/tags');
    return response.data;
  } catch (error) {
    throw error;
  }
};
