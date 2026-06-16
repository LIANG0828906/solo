import { get, set, del, keys, clear } from 'idb-keyval';
import type {
  Club, Book, Chapter, Member, Highlight, Note, Comment,
  Poll, Vote, UserStats
} from '@/types';

const DB_KEYS = {
  CLUBS: 'clubs',
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  MEMBERS: 'members',
  HIGHLIGHTS: 'highlights',
  NOTES: 'notes',
  COMMENTS: 'comments',
  POLLS: 'polls',
  VOTES: 'votes',
  USER_STATS: 'user_stats',
  CURRENT_USER: 'current_user',
  CURRENT_MEMBER: 'current_member',
};

export const storage = {
  async getClubs(): Promise<Club[]> {
    return (await get<Club[]>(DB_KEYS.CLUBS)) || [];
  },
  async saveClubs(clubs: Club[]): Promise<void> {
    await set(DB_KEYS.CLUBS, clubs);
  },

  async getBooks(): Promise<Book[]> {
    return (await get<Book[]>(DB_KEYS.BOOKS)) || [];
  },
  async saveBooks(books: Book[]): Promise<void> {
    await set(DB_KEYS.BOOKS, books);
  },

  async getChapters(): Promise<Chapter[]> {
    return (await get<Chapter[]>(DB_KEYS.CHAPTERS)) || [];
  },
  async saveChapters(chapters: Chapter[]): Promise<void> {
    await set(DB_KEYS.CHAPTERS, chapters);
  },

  async getMembers(): Promise<Member[]> {
    return (await get<Member[]>(DB_KEYS.MEMBERS)) || [];
  },
  async saveMembers(members: Member[]): Promise<void> {
    await set(DB_KEYS.MEMBERS, members);
  },

  async getHighlights(): Promise<Highlight[]> {
    return (await get<Highlight[]>(DB_KEYS.HIGHLIGHTS)) || [];
  },
  async saveHighlights(highlights: Highlight[]): Promise<void> {
    await set(DB_KEYS.HIGHLIGHTS, highlights);
  },

  async getNotes(): Promise<Note[]> {
    return (await get<Note[]>(DB_KEYS.NOTES)) || [];
  },
  async saveNotes(notes: Note[]): Promise<void> {
    await set(DB_KEYS.NOTES, notes);
  },

  async getComments(): Promise<Comment[]> {
    return (await get<Comment[]>(DB_KEYS.COMMENTS)) || [];
  },
  async saveComments(comments: Comment[]): Promise<void> {
    await set(DB_KEYS.COMMENTS, comments);
  },

  async getPolls(): Promise<Poll[]> {
    return (await get<Poll[]>(DB_KEYS.POLLS)) || [];
  },
  async savePolls(polls: Poll[]): Promise<void> {
    await set(DB_KEYS.POLLS, polls);
  },

  async getVotes(): Promise<Vote[]> {
    return (await get<Vote[]>(DB_KEYS.VOTES)) || [];
  },
  async saveVotes(votes: Vote[]): Promise<void> {
    await set(DB_KEYS.VOTES, votes);
  },

  async getUserStats(): Promise<UserStats | null> {
    return (await get<UserStats>(DB_KEYS.USER_STATS)) || null;
  },
  async saveUserStats(stats: UserStats): Promise<void> {
    await set(DB_KEYS.USER_STATS, stats);
  },

  async getCurrentUserId(): Promise<string | null> {
    return (await get<string>(DB_KEYS.CURRENT_USER)) || null;
  },
  async saveCurrentUserId(id: string): Promise<void> {
    await set(DB_KEYS.CURRENT_USER, id);
  },

  async getCurrentMemberMap(): Promise<Record<string, string>> {
    return (await get<Record<string, string>>(DB_KEYS.CURRENT_MEMBER)) || {};
  },
  async saveCurrentMemberMap(map: Record<string, string>): Promise<void> {
    await set(DB_KEYS.CURRENT_MEMBER, map);
  },

  async clearAll(): Promise<void> {
    const allKeys = await keys();
    for (const key of allKeys) {
      await del(key);
    }
  },
};
