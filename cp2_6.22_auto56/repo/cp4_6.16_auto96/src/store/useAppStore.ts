import { create } from 'zustand';
import type {
  Club, Book, Chapter, Member, Highlight, Note, Comment,
  Poll, Vote, UserStats, ToastItem, HighlightColor
} from '@/types';
import { storage } from '@/utils/storage';

interface AppState {
  clubs: Club[];
  books: Book[];
  chapters: Chapter[];
  members: Member[];
  highlights: Highlight[];
  notes: Note[];
  comments: Comment[];
  polls: Poll[];
  votes: Vote[];
  userStats: UserStats | null;
  currentUserId: string | null;
  currentMemberMap: Record<string, string>;
  toasts: ToastItem[];
  isLoaded: boolean;

  init: () => Promise<void>;
  setClubs: (clubs: Club[]) => void;
  setBooks: (books: Book[]) => void;
  setChapters: (chapters: Chapter[]) => void;
  setMembers: (members: Member[]) => void;
  setHighlights: (highlights: Highlight[]) => void;
  setNotes: (notes: Note[]) => void;
  setComments: (comments: Comment[]) => void;
  setPolls: (polls: Poll[]) => void;
  setVotes: (votes: Vote[]) => void;
  setUserStats: (stats: UserStats) => void;
  setCurrentUserId: (id: string) => void;
  setCurrentMemberMap: (map: Record<string, string>) => void;

  addClub: (club: Club) => void;
  updateClub: (club: Club) => void;
  addBook: (book: Book) => void;
  addChapters: (chapters: Chapter[]) => void;
  addMember: (member: Member) => void;
  addHighlight: (highlight: Highlight) => void;
  updateHighlight: (highlight: Highlight) => void;
  deleteHighlight: (id: string) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  addComment: (comment: Comment) => void;
  addPoll: (poll: Poll) => void;
  updatePoll: (poll: Poll) => void;
  addVote: (vote: Vote, optionId: string, pollId: string) => void;
  updateUserStatsActivity: () => void;

  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  getCurrentMember: (clubId: string) => Member | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  clubs: [],
  books: [],
  chapters: [],
  members: [],
  highlights: [],
  notes: [],
  comments: [],
  polls: [],
  votes: [],
  userStats: null,
  currentUserId: null,
  currentMemberMap: {},
  toasts: [],
  isLoaded: false,

  init: async () => {
    const [
      clubs, books, chapters, members, highlights, notes,
      comments, polls, votes, userStats, currentUserId, currentMemberMap
    ] = await Promise.all([
      storage.getClubs(),
      storage.getBooks(),
      storage.getChapters(),
      storage.getMembers(),
      storage.getHighlights(),
      storage.getNotes(),
      storage.getComments(),
      storage.getPolls(),
      storage.getVotes(),
      storage.getUserStats(),
      storage.getCurrentUserId(),
      storage.getCurrentMemberMap(),
    ]);

    set({
      clubs, books, chapters, members, highlights, notes,
      comments, polls, votes, userStats, currentUserId, currentMemberMap,
      isLoaded: true,
    });
  },

  setClubs: (clubs) => {
    set({ clubs });
    storage.saveClubs(clubs);
  },
  setBooks: (books) => {
    set({ books });
    storage.saveBooks(books);
  },
  setChapters: (chapters) => {
    set({ chapters });
    storage.saveChapters(chapters);
  },
  setMembers: (members) => {
    set({ members });
    storage.saveMembers(members);
  },
  setHighlights: (highlights) => {
    set({ highlights });
    storage.saveHighlights(highlights);
  },
  setNotes: (notes) => {
    set({ notes });
    storage.saveNotes(notes);
  },
  setComments: (comments) => {
    set({ comments });
    storage.saveComments(comments);
  },
  setPolls: (polls) => {
    set({ polls });
    storage.savePolls(polls);
  },
  setVotes: (votes) => {
    set({ votes });
    storage.saveVotes(votes);
  },
  setUserStats: (stats) => {
    set({ userStats: stats });
    storage.saveUserStats(stats);
  },
  setCurrentUserId: (id) => {
    set({ currentUserId: id });
    storage.saveCurrentUserId(id);
  },
  setCurrentMemberMap: (map) => {
    set({ currentMemberMap: map });
    storage.saveCurrentMemberMap(map);
  },

  addClub: (club) => {
    const clubs = [...get().clubs, club];
    set({ clubs });
    storage.saveClubs(clubs);
  },
  updateClub: (club) => {
    const clubs = get().clubs.map(c => c.id === club.id ? club : c);
    set({ clubs });
    storage.saveClubs(clubs);
  },
  addBook: (book) => {
    const books = [...get().books, book];
    set({ books });
    storage.saveBooks(books);
  },
  addChapters: (newChapters) => {
    const chapters = [...get().chapters, ...newChapters];
    set({ chapters });
    storage.saveChapters(chapters);
  },
  addMember: (member) => {
    const members = [...get().members, member];
    set({ members });
    storage.saveMembers(members);
  },
  addHighlight: (highlight) => {
    const highlights = [...get().highlights, highlight];
    set({ highlights });
    storage.saveHighlights(highlights);
    get().updateUserStatsActivity();
  },
  updateHighlight: (highlight) => {
    const highlights = get().highlights.map(h => h.id === highlight.id ? highlight : h);
    set({ highlights });
    storage.saveHighlights(highlights);
  },
  deleteHighlight: (id) => {
    const highlights = get().highlights.filter(h => h.id !== id);
    set({ highlights });
    storage.saveHighlights(highlights);
  },
  addNote: (note) => {
    const notes = [...get().notes, note];
    set({ notes });
    storage.saveNotes(notes);
  },
  updateNote: (note) => {
    const notes = get().notes.map(n => n.id === note.id ? note : n);
    set({ notes });
    storage.saveNotes(notes);
  },
  addComment: (comment) => {
    const comments = [...get().comments, comment];
    set({ comments });
    storage.saveComments(comments);
    get().updateUserStatsActivity();
  },
  addPoll: (poll) => {
    const polls = [...get().polls, poll];
    set({ polls });
    storage.savePolls(polls);
  },
  updatePoll: (poll) => {
    const polls = get().polls.map(p => p.id === poll.id ? poll : p);
    set({ polls });
    storage.savePolls(polls);
  },
  addVote: (vote, optionId, pollId) => {
    const votes = [...get().votes, vote];
    set({ votes });
    storage.saveVotes(votes);

    const polls = get().polls.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: p.options.map(o =>
          o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
        ),
      };
    });
    set({ polls });
    storage.savePolls(polls);
    get().updateUserStatsActivity();
  },

  updateUserStatsActivity: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    
    let stats = state.userStats;
    if (!stats) {
      stats = {
        highlightCount: 0,
        commentCount: 0,
        voteCount: 0,
        activityDates: [],
        dailyComments: [],
      };
    }

    const memberIds = Object.values(state.currentMemberMap);
    const userHighlights = state.highlights.filter(h => memberIds.includes(h.memberId));
    const userComments = state.comments.filter(c => memberIds.includes(c.memberId));
    const userVotes = state.votes.filter(v => memberIds.includes(v.memberId));

    const activityDates = new Set(stats.activityDates);
    if (userHighlights.length > 0 || userComments.length > 0 || userVotes.length > 0) {
      activityDates.add(today);
    }

    const dailyCommentMap = new Map<string, number>();
    userComments.forEach(c => {
      const date = new Date(c.createdAt).toISOString().split('T')[0];
      dailyCommentMap.set(date, (dailyCommentMap.get(date) || 0) + 1);
    });
    const dailyComments = Array.from(dailyCommentMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const newStats = {
      highlightCount: userHighlights.length,
      commentCount: userComments.length,
      voteCount: userVotes.length,
      activityDates: Array.from(activityDates).sort(),
      dailyComments,
    };

    set({ userStats: newStats });
    storage.saveUserStats(newStats);
  },

  addToast: (message, type = 'info') => {
    const id = Date.now().toString() + Math.random();
    const toast = { id, message, type };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    }, 2000);
  },
  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },

  getCurrentMember: (clubId: string) => {
    const state = get();
    const memberId = state.currentMemberMap[clubId];
    if (!memberId) return undefined;
    return state.members.find(m => m.id === memberId);
  },
}));
