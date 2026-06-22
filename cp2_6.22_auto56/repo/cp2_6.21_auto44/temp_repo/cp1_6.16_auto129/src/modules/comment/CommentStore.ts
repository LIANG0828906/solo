import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Comment } from '../../shared/types';

interface CommentState {
  comments: Record<string, Comment[]>;
  unreadCount: number;
  currentArtworkId: string | null;
  socket: any;
  initSocket: () => void;
  disconnectSocket: () => void;
  setCurrentArtwork: (artworkId: string | null) => void;
  addComment: (artworkId: string, userId: string, username: string, userAvatar: string, content: string) => Comment;
  deleteComment: (artworkId: string, commentId: string, userId: string) => void;
  likeComment: (artworkId: string, commentId: string, userId: string) => void;
  getComments: (artworkId: string) => Comment[];
  clearUnread: () => void;
  broadcastComment: (comment: Comment) => void;
}

const createMockSocket = () => {
  return {
    connected: false,
    on: (event: string, callback: (...args: any[]) => void) => {
      if (event === 'connect') {
        setTimeout(() => {
          callback();
        }, 100);
      }
    },
    emit: (event: string, ...args: any[]) => {
      console.log('[MockSocket] emit:', event, args);
      if (event === 'new-comment') {
        setTimeout(() => {
          const [comment] = args;
          if (Math.random() < 0.3) {
            const mockUserId = 'mock-user-' + Math.floor(Math.random() * 3);
            const mockNames = ['艺术爱好者', '画廊访客', '评论家A'];
            const mockContents = [
              '这幅作品真不错！',
              '色彩搭配很棒~',
              '很有创意！',
              '艺术家的风格很独特',
            ];
            const mockComment: Comment = {
              id: uuidv4(),
              artworkId: comment.artworkId,
              userId: mockUserId,
              username: mockNames[Math.floor(Math.random() * mockNames.length)],
              userAvatar: '',
              content: mockContents[Math.floor(Math.random() * mockContents.length)],
              createdAt: new Date().toISOString(),
              likes: 0,
              likedBy: [],
            };
            const customEvent = new CustomEvent('mock-comment', { detail: mockComment });
            window.dispatchEvent(customEvent);
          }
        }, 2000 + Math.random() * 3000);
      }
    },
    disconnect: () => {},
  };
};

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: {},
  unreadCount: 0,
  currentArtworkId: null,
  socket: null,

  initSocket: () => {
    const mockSocket = createMockSocket();
    mockSocket.on('connect', () => {
      console.log('[Socket] connected');
    });
    window.addEventListener('mock-comment', ((e: CustomEvent<Comment>) => {
      const comment = e.detail;
      get().broadcastComment(comment);
    }) as EventListener;
    set({ socket: mockSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null });
  },

  setCurrentArtwork: (artworkId) => set({ currentArtworkId: artworkId }),

  addComment: (artworkId, userId, username, userAvatar, content) => {
    const comment: Comment = {
      id: uuidv4(),
      artworkId,
      userId,
      username,
      userAvatar,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    set((state) => {
      const existing = state.comments[artworkId] || [];
      const updated = [comment, ...existing];
      return {
        comments: {
          ...state.comments,
          [artworkId]: updated,
        },
      };
    });
    const { socket } = get();
    if (socket?.emit) {
      socket.emit('new-comment', comment);
    }
    return comment;
  },

  deleteComment: (artworkId, commentId, userId) => {
    set((state) => {
      const existing = state.comments[artworkId] || [];
      return {
        comments: {
          ...state.comments,
          [artworkId]: existing.filter(
            (c) => !(c.id === commentId && c.userId === userId)
          ),
        },
      };
    });
  },

  likeComment: (artworkId, commentId, userId) => {
    set((state) => {
      const existing = state.comments[artworkId] || [];
      return {
        comments: {
          ...state.comments,
          [artworkId]: existing.map((c) => {
            if (c.id !== commentId) return c;
            const liked = c.likedBy.includes(userId);
            return liked
              ? {
                  ...c,
                  likes: c.likes - 1,
                  likedBy: c.likedBy.filter((id) => id !== userId),
                }
              : {
                  ...c,
                  likes: c.likes + 1,
                  likedBy: [...c.likedBy, userId],
                };
          }),
        },
      };
    });
  },

  getComments: (artworkId) => {
    return get().comments[artworkId] || [];
  },

  clearUnread: () => set({ unreadCount: 0 }),

  broadcastComment: (comment) => {
    const { currentArtworkId } = get();
    set((state) => {
      const existing = state.comments[comment.artworkId] || [];
      const updated = [comment, ...existing];
      return {
        comments: {
          ...state.comments,
          [comment.artworkId]: updated,
        },
        unreadCount:
          currentArtworkId !== comment.artworkId
            ? state.unreadCount + 1
            : state.unreadCount,
      };
    });
  },
}));
