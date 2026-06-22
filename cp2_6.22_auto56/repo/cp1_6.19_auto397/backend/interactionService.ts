import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  memeId: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface LikeRecord {
  memeId: string;
  userId: string;
  date: string;
}

let comments: Comment[] = [];
let likeRecords: LikeRecord[] = [];

export const interactionService = {
  likeMeme(memeId: string, userId: string): { liked: boolean; likes: number; likesCount: number } {
    const today = new Date().toDateString();
    const existing = likeRecords.find(
      (r) => r.memeId === memeId && r.userId === userId && r.date === today
    );

    if (existing) {
      const likesCount = likeRecords.filter((r) => r.memeId === memeId).length;
      return { liked: false, likes: likesCount, likesCount };
    }

    likeRecords.push({ memeId, userId, date: today });
    const likesCount = likeRecords.filter((r) => r.memeId === memeId).length;
    return { liked: true, likes: likesCount, likesCount };
  },

  hasLiked(memeId: string, userId: string): boolean {
    const today = new Date().toDateString();
    return likeRecords.some(
      (r) => r.memeId === memeId && r.userId === userId && r.date === today
    );
  },

  getLikesCount(memeId: string): number {
    return likeRecords.filter((r) => r.memeId === memeId).length;
  },

  getComments(memeId: string): Comment[] {
    return comments
      .filter((c) => c.memeId === memeId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  addComment(memeId: string, author: string, content: string): Comment {
    const comment: Comment = {
      id: uuidv4(),
      memeId,
      author,
      content,
      createdAt: Date.now()
    };
    comments.push(comment);
    return comment;
  },

  getCommentsCount(memeId: string): number {
    return comments.filter((c) => c.memeId === memeId).length;
  }
};
