/* eslint-disable no-useless-catch */
import axios from 'axios';
import type { Snippet, SearchResult, SnippetCreate, SnippetUpdate, TagCount, SortBy, SortOrder, LanguageFilter } from './types';

const api = axios.create({
  baseURL: '/api',
});

interface FetchSnippetsParams {
  sort_by?: SortBy;
  sort_order?: SortOrder;
  language?: LanguageFilter;
}

interface SearchSnippetsParams extends FetchSnippetsParams {
  q: string;
}

export const fetchSnippets = async (params?: FetchSnippetsParams): Promise<Snippet[]> => {
  try {
    const response = await api.get<Snippet[]>('/snippets', { params });
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

export const searchSnippets = async (params: SearchSnippetsParams): Promise<SearchResult[]> => {
  try {
    const response = await api.get<SearchResult[]>('/search', { params });
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
