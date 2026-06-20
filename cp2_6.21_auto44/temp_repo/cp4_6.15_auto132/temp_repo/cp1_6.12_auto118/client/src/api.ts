import axios from 'axios';
import { Story, StorySummary, User, Paragraph, Comment } from './data';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const apiUser = {
  getCurrentUser: (): Promise<User> =>
    api.get('/user').then(r => r.data),
};

export const apiStories = {
  getStories: (): Promise<StorySummary[]> =>
    api.get('/stories').then(r => r.data),

  getStory: (id: string): Promise<Story> =>
    api.get(`/stories/${id}`).then(r => r.data),

  createStory: (data: {
    title: string;
    summary: string;
    coverColor?: string;
    initialContent?: string;
  }): Promise<Story> =>
    api.post('/stories', data).then(r => r.data),

  addParagraph: (storyId: string, content: string): Promise<Paragraph> =>
    api.post(`/stories/${storyId}/paragraphs`, { content }).then(r => r.data),
};

export const apiParagraphs = {
  like: (paragraphId: string): Promise<{ likes: number; liked: boolean }> =>
    api.post(`/paragraphs/${paragraphId}/like`).then(r => r.data),

  addComment: (paragraphId: string, content: string): Promise<Comment> =>
    api.post(`/paragraphs/${paragraphId}/comments`, { content }).then(r => r.data),
};

export const apiColors = {
  getColors: (): Promise<string[]> =>
    api.get('/colors').then(r => r.data),
};
