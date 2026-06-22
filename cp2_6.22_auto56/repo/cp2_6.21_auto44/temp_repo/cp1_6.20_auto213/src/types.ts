export interface WordEntry {
  id: string;
  text: string;
  userId: string;
  likes: number;
  dislikes: number;
  hue: number;
  addedAt: number;
  removed: boolean;
}

export interface User {
  id: string;
  nickname: string;
  online: boolean;
  wordCount: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

export type WSMessage =
  | { type: 'join'; userId: string; nickname: string }
  | { type: 'add_word'; wordId: string; text: string; userId: string; hue: number }
  | { type: 'like_word'; wordId: string; userId: string }
  | { type: 'dislike_word'; wordId: string; userId: string }
  | { type: 'chat'; userId: string; nickname: string; text: string }
  | { type: 'user_list'; users: User[] }
  | { type: 'word_list'; words: WordEntry[] }
  | { type: 'word_update'; word: WordEntry }
  | { type: 'word_removed'; wordId: string }
  | { type: 'user_update'; user: User }
  | { type: 'new_chat'; message: ChatMessage }
  | { type: 'init'; words: WordEntry[]; users: User[]; messages: ChatMessage[] }
  | { type: 'leave'; userId: string };
