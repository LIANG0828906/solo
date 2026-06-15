import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { GalleryPost, Comment } from '@/types';
import galleryPostsData from '@/data/galleryPosts.json';

interface GalleryState {
  posts: GalleryPost[];
  currentUserId: string;
  currentUserName: string;
  isLikeAnimating: Record<string, boolean>;
  loadPosts: () => void;
  getPost: (id: string) => GalleryPost | undefined;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  addNewPost: (post: GalleryPost) => void;
  triggerLikeAnim: (postId: string) => void;
}

function loadInitialPosts(): GalleryPost[] {
  try {
    const local = localStorage.getItem('gallery_posts');
    if (local) {
      const parsed = JSON.parse(local);
      return [...parsed, ...(galleryPostsData as GalleryPost[])];
    }
  } catch {
    // ignore
  }
  return galleryPostsData as GalleryPost[];
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  posts: [],
  currentUserId: 'user-me',
  currentUserName: '我',
  isLikeAnimating: {},

  loadPosts: () => {
    set({ posts: loadInitialPosts() });
  },

  getPost: (id) => get().posts.find((p) => p.id === id),

  toggleLike: (postId) => {
    set({
      posts: get().posts.map((p) => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return {
          ...p,
          likedByMe: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      }),
    });
    get().triggerLikeAnim(postId);
  },

  triggerLikeAnim: (postId) => {
    set({ isLikeAnimating: { ...get().isLikeAnimating, [postId]: true } });
    setTimeout(() => {
      const cur = { ...get().isLikeAnimating };
      delete cur[postId];
      set({ isLikeAnimating: cur });
    }, 500);
  },

  addComment: (postId, content) => {
    if (!content.trim()) return;
    const newComment: Comment = {
      id: uuid(),
      postId,
      authorId: get().currentUserId,
      authorName: get().currentUserName,
      authorAvatar:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20designer%20avatar%20portrait%20creative%20young%20illustration&image_size=square',
      content: content.trim(),
      createdAt: Date.now(),
      isAuthor: true,
    };
    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p
      ),
    });
  },

  deleteComment: (postId, commentId) => {
    set({
      posts: get().posts.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      ),
    });
  },

  addNewPost: (post) => {
    set({ posts: [post, ...get().posts] });
  },
}));
