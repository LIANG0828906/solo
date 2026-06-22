import { create } from 'zustand';
import { Idea, User, VoteType, WSMessage } from '../types';
import { apiService } from '../services/apiService';

interface IdeasState {
  roomId: string;
  ideas: Idea[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;

  setRoomId: (id: string) => void;
  initRoom: (roomId: string, userName: string) => Promise<void>;
  addIdea: (title: string, description?: string, tags?: string[]) => Promise<void>;
  voteIdea: (ideaId: string, voteType: VoteType) => Promise<void>;
  handleWSMessage: (msg: WSMessage) => void;
  cleanup: () => void;
}

export const useIdeasStore = create<IdeasState>((set, get) => ({
  roomId: '',
  ideas: [],
  users: [],
  currentUser: null,
  loading: false,
  error: null,

  setRoomId: (id: string) => set({ roomId: id }),

  initRoom: async (roomId: string, userName: string) => {
    set({ loading: true, error: null });
    try {
      const user = await apiService.joinRoom(roomId, userName);
      const [ideas, users] = await Promise.all([
        apiService.getIdeas(roomId),
        apiService.getUsers(roomId),
      ]);
      set({ roomId, ideas, users, currentUser: user, loading: false });

      apiService.connectWebSocket(roomId, (msg) => {
        get().handleWSMessage(msg);
      });
    } catch (error: any) {
      set({ error: error.message || '初始化失败', loading: false });
    }
  },

  addIdea: async (title: string, description?: string, tags?: string[]) => {
    const { roomId } = get();
    if (!roomId || !title.trim()) return;
    await apiService.createIdea(roomId, { title, description, tags });
  },

  voteIdea: async (ideaId: string, voteType: VoteType) => {
    const { roomId, ideas } = get();
    if (!roomId) return;

    const idea = ideas.find((i) => i.id === ideaId);
    if (idea) {
      set({
        ideas: ideas.map((i) =>
          i.id === ideaId
            ? { ...i, votes: { ...i.votes, [voteType]: i.votes[voteType] + 1 } }
            : i
        ),
      });
    }
    await apiService.voteIdea(roomId, ideaId, voteType);
  },

  handleWSMessage: (msg: WSMessage) => {
    set((state) => {
      switch (msg.type) {
        case 'vote': {
          return {
            ideas: state.ideas.map((i) =>
              i.id === msg.ideaId ? { ...i, votes: msg.votes } : i
            ),
          };
        }
        case 'idea_created': {
          if (state.ideas.some((i) => i.id === msg.idea.id)) return state;
          return { ideas: [msg.idea, ...state.ideas] };
        }
        case 'idea_updated': {
          return {
            ideas: state.ideas.map((i) => (i.id === msg.idea.id ? msg.idea : i)),
          };
        }
        case 'idea_deleted': {
          return { ideas: state.ideas.filter((i) => i.id !== msg.idea.id) };
        }
        case 'user_joined': {
          if (state.users.some((u) => u.id === msg.user.id)) return state;
          return { users: [...state.users, msg.user] };
        }
        case 'user_left': {
          return {
            users: state.users.map((u) =>
              u.id === msg.user.id ? { ...u, online: false } : u
            ),
          };
        }
        default:
          return state;
      }
    });
  },

  cleanup: () => {
    apiService.disconnectWebSocket();
    set({ roomId: '', ideas: [], users: [], currentUser: null });
  },
}));
