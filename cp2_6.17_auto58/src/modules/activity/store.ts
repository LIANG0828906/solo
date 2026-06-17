import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Activity, Comment, Like } from '../../types';
import { CURRENT_USER } from '../../types';
import { ActivityDB, CommentDB, LikeDB } from '../../utils/db';

interface ActivityStoreState {
  activities: Activity[];
  comments: Record<string, Comment[]>;
  likes: Record<string, Like[]>;
  isLoading: boolean;

  loadAllData: () => Promise<void>;
  loadComments: (projectId: string) => Promise<void>;
  loadLikes: (projectId: string) => Promise<void>;

  toggleLike: (projectId: string, projectTitle: string) => Promise<boolean>;
  addComment: (projectId: string, projectTitle: string, content: string) => Promise<void>;

  isLikedByUser: (projectId: string, user?: string) => boolean;
  getLikeCount: (projectId: string) => number;
  getCommentCount: (projectId: string) => number;
  getComments: (projectId: string) => Comment[];
  getRecentActivities: (limit?: number) => Activity[];
}

function addActivityToState(
  state: ActivityStoreState,
  activity: Activity
): ActivityStoreState {
  return {
    ...state,
    activities: [activity, ...state.activities],
  };
}

export const useActivityStore = create<ActivityStoreState>((set, get) => ({
  activities: [],
  comments: {},
  likes: {},
  isLoading: false,

  loadAllData: async () => {
    set({ isLoading: true });
    try {
      const [activities, allComments, allLikes] = await Promise.all([
        ActivityDB.getAll(),
        CommentDB.getAll(),
        LikeDB.getAll(),
      ]);

      const commentsMap: Record<string, Comment[]> = {};
      allComments.forEach((c) => {
        if (!commentsMap[c.projectId]) commentsMap[c.projectId] = [];
        commentsMap[c.projectId].push(c);
      });
      Object.keys(commentsMap).forEach((pid) => {
        commentsMap[pid].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      const likesMap: Record<string, Like[]> = {};
      allLikes.forEach((l) => {
        if (!likesMap[l.projectId]) likesMap[l.projectId] = [];
        likesMap[l.projectId].push(l);
      });

      set({
        activities,
        comments: commentsMap,
        likes: likesMap,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load activity data:', error);
      set({ isLoading: false });
    }
  },

  loadComments: async (projectId: string) => {
    const comments = await CommentDB.getByProjectId(projectId);
    set((state) => ({
      comments: { ...state.comments, [projectId]: comments },
    }));
  },

  loadLikes: async (projectId: string) => {
    const likes = await LikeDB.getByProjectId(projectId);
    set((state) => ({
      likes: { ...state.likes, [projectId]: likes },
    }));
  },

  toggleLike: async (projectId: string, projectTitle: string) => {
    const currentLikes = get().likes[projectId] || [];
    const existingLike = currentLikes.find((l) => l.user === CURRENT_USER);

    if (existingLike) {
      await LikeDB.delete(existingLike.id);
      set((state) => ({
        likes: {
          ...state.likes,
          [projectId]: currentLikes.filter((l) => l.id !== existingLike.id),
        },
      }));
      return false;
    } else {
      const now = new Date().toISOString();
      const like: Like = {
        id: uuidv4(),
        projectId,
        user: CURRENT_USER,
        createdAt: now,
      };
      await LikeDB.add(like);

      const activity: Activity = {
        id: uuidv4(),
        type: 'like',
        projectId,
        projectTitle,
        user: CURRENT_USER,
        createdAt: now,
      };
      await ActivityDB.add(activity);

      set((state) =>
        addActivityToState(
          {
            ...state,
            likes: {
              ...state.likes,
              [projectId]: [...currentLikes, like],
            },
          },
          activity
        )
      );
      return true;
    }
  },

  addComment: async (projectId: string, projectTitle: string, content: string) => {
    const now = new Date().toISOString();
    const comment: Comment = {
      id: uuidv4(),
      projectId,
      user: CURRENT_USER,
      content,
      createdAt: now,
    };
    await CommentDB.add(comment);

    const activity: Activity = {
      id: uuidv4(),
      type: 'comment',
      projectId,
      projectTitle,
      user: CURRENT_USER,
      content,
      createdAt: now,
    };
    await ActivityDB.add(activity);

    set((state) => {
      const projectComments = state.comments[projectId] || [];
      return addActivityToState(
        {
          ...state,
          comments: {
            ...state.comments,
            [projectId]: [...projectComments, comment],
          },
        },
        activity
      );
    });
  },

  isLikedByUser: (projectId: string, user: string = CURRENT_USER) => {
    return (get().likes[projectId] || []).some((l) => l.user === user);
  },

  getLikeCount: (projectId: string) => {
    return (get().likes[projectId] || []).length;
  },

  getCommentCount: (projectId: string) => {
    return (get().comments[projectId] || []).length;
  },

  getComments: (projectId: string) => {
    return get().comments[projectId] || [];
  },

  getRecentActivities: (limit: number = 5) => {
    return get().activities.slice(0, limit);
  },
}));
