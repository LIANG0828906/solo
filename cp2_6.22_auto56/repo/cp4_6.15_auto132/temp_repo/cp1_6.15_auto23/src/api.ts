import type {
  Book,
  BookDetail,
  Member,
  ReadingProgress,
  CheckIn,
  Topic,
  TopicDetail,
  Reply,
  Event,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || '请求失败');
  }
  return json.data;
}

export const api = {
  getBooks: () => request<(Book & { readersCount: number })[]>('/api/books'),

  addBook: (data: {
    title: string;
    author: string;
    coverUrl: string;
    description: string;
    isbn: string;
    totalChapters: number;
  }) =>
    request<Book & { readersCount: number }>('/api/books', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBook: (id: string) => request<BookDetail>(`/api/books/${id}`),

  getBookProgress: (id: string) =>
    request<(ReadingProgress & { member: Member })[]>(`/api/books/${id}/progress`),

  updateProgress: (id: string, data: { memberId: string; currentChapter: number; status?: ReadingProgress['status'] }) =>
    request<ReadingProgress>(`/api/books/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBookCheckIns: (id: string) =>
    request<(CheckIn & { member: Member })[]>(`/api/books/${id}/checkins`),

  addCheckIn: (id: string, data: { memberId: string; chapter: number; thought: string }) =>
    request<CheckIn & { member: Member }>(`/api/books/${id}/checkins`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBookTopics: (bookId: string) =>
    request<(Topic & { creator: Member })[]>(`/api/topics/book/${bookId}`),

  createTopic: (bookId: string, data: { title: string; creatorId: string }) =>
    request<Topic & { creator: Member }>(`/api/topics/book/${bookId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTopic: (topicId: string) => request<TopicDetail>(`/api/topics/${topicId}`),

  addReply: (topicId: string, data: { memberId: string; content: string; mentionIds: string[] }) =>
    request<Reply & { member: Member; mentions: Member[] }>(`/api/topics/${topicId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEvents: () =>
    request<(Event & { book: Book; voteResults: { timeOption: string; count: number }[] })[]>('/api/events'),

  getEventVotes: (eventId: string) =>
    request<{ timeOption: string; count: number }[]>(`/api/events/${eventId}/votes`),

  voteEvent: (eventId: string, data: { memberId: string; timeOption: string }) =>
    request<{ vote: Event['votes'][number]; results: { timeOption: string; count: number }[] }>(
      `/api/events/${eventId}/votes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getCurrentMember: () => request<Member>('/api/members/me'),

  getMembers: () => request<Member[]>('/api/members'),
};
