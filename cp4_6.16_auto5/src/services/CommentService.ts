import axios from 'axios';

export interface Comment {
  id: number;
  photoId: number;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

const STORAGE_KEY = 'leather_comments';

interface StoredComments {
  [photoId: number]: Comment[];
}

export class CommentService {
  private nextId: number = Date.now();

  private getStoredComments(): StoredComments {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStoredComments(comments: StoredComments): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('leather_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getComments(photoId: number): Promise<Comment[]> {
    try {
      const response = await axios.get<{
        photoId: number;
        total: number;
        comments: Comment[];
      }>('/api/comments', {
        params: { photoId },
        headers: this.getAuthHeaders(),
      });
      const sorted = this.sortByTimeDesc(response.data.comments);
      this.cacheComments(photoId, sorted);
      return sorted;
    } catch {
      return this.getLocalComments(photoId);
    }
  }

  async submitComment(
    photoId: number,
    userId: string,
    username: string,
    content: string
  ): Promise<Comment> {
    try {
      const response = await axios.post<{
        message: string;
        comment: Comment;
      }>(
        '/api/comment',
        {
          photoId,
          userId,
          username,
          content,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );
      await this.getComments(photoId);
      return response.data.comment;
    } catch {
      return this.addLocalComment(photoId, userId, username, content);
    }
  }

  async addComment(
    photoId: number,
    userId: string,
    username: string,
    content: string
  ): Promise<Comment> {
    return this.submitComment(photoId, userId, username, content);
  }

  async deleteComment(photoId: number, commentId: number): Promise<void> {
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch {
      // ignore
    }
    this.deleteLocalComment(photoId, commentId);
  }

  private getLocalComments(photoId: number): Comment[] {
    const comments = this.getStoredComments();
    return this.sortByTimeDesc(comments[photoId] || []);
  }

  private addLocalComment(
    photoId: number,
    userId: string,
    username: string,
    content: string
  ): Comment {
    const comments = this.getStoredComments();
    if (!comments[photoId]) {
      comments[photoId] = [];
    }

    const newComment: Comment = {
      id: this.nextId++,
      photoId,
      userId,
      username,
      content,
      createdAt: new Date().toISOString(),
    };

    comments[photoId].push(newComment);
    this.setStoredComments(comments);
    return newComment;
  }

  private deleteLocalComment(photoId: number, commentId: number): void {
    const comments = this.getStoredComments();
    if (comments[photoId]) {
      comments[photoId] = comments[photoId].filter((c) => c.id !== commentId);
      this.setStoredComments(comments);
    }
  }

  private cacheComments(photoId: number, comments: Comment[]): void {
    const stored = this.getStoredComments();
    stored[photoId] = comments;
    this.setStoredComments(stored);
  }

  private sortByTimeDesc(comments: Comment[]): Comment[] {
    return [...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  initializeDefaultComments(photoIds: number[]): void {
    const comments = this.getStoredComments();
    const sampleUsers = ['匠心匠人', '皮革爱好者', '新手皮友', '手工达人', '皮具收藏家'];
    const sampleTexts = [
      '做得真漂亮！边缘处理得很光滑。',
      '请问用的是什么皮料？质感很好！',
      '缝线很整齐，学习了！',
      '我也在做这个教程，期待成品~',
      '马鞍针法缝得很好看！',
      '这个颜色太好看了，封边是用什么做的？',
      '作为新手看了很受鼓舞！',
      '作品很有质感，点赞！',
    ];

    let changed = false;
    photoIds.forEach((photoId) => {
      if (!comments[photoId]) {
        const numComments = Math.floor(Math.random() * 4) + 1;
        comments[photoId] = [];
        for (let i = 0; i < numComments; i++) {
          const randomDays = Math.floor(Math.random() * 14) + 1;
          const commentDate = new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000);
          comments[photoId].push({
            id: this.nextId++,
            photoId,
            userId: 'default_' + i,
            username: sampleUsers[Math.floor(Math.random() * sampleUsers.length)],
            content: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
            createdAt: commentDate.toISOString(),
          });
        }
        changed = true;
      }
    });
    if (changed) this.setStoredComments(comments);
  }
}

export const commentService = new CommentService();
