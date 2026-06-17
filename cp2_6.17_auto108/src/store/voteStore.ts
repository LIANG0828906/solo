import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  VoteTopic,
  VoteOption,
  VoteRecord,
  CreateVoteForm,
  VoteStoreState,
} from '../types';

const STORAGE_KEYS = {
  TOPICS: 'votecast_topics',
  USER_ID: 'votecast_user_id',
  VOTE_RECORDS: 'votecast_records',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function getOrCreateUserId(): string {
  let userId = loadFromStorage<string | null>(STORAGE_KEYS.USER_ID, null);
  if (!userId) {
    userId = uuidv4();
    saveToStorage(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

export const useVoteStore = create<VoteStoreState>((set, get) => ({
  topics: loadFromStorage<VoteTopic[]>(STORAGE_KEYS.TOPICS, []),
  currentUserId: getOrCreateUserId(),
  voteRecords: loadFromStorage<VoteRecord[]>(STORAGE_KEYS.VOTE_RECORDS, []),

  createTopic: (form: CreateVoteForm): VoteTopic => {
    const options: VoteOption[] = form.options
      .filter((text) => text.trim().length > 0)
      .map((text) => ({
        id: uuidv4(),
        text: text.trim(),
        voteCount: 0,
      }));

    const newTopic: VoteTopic = {
      id: uuidv4(),
      title: form.title.trim(),
      description: form.description.trim(),
      options,
      createdAt: Date.now(),
      deadline: form.deadline,
      status: Date.now() >= form.deadline ? 'ended' : 'ongoing',
      totalVotes: 0,
    };

    const newTopics = [newTopic, ...get().topics];
    set({ topics: newTopics });
    saveToStorage(STORAGE_KEYS.TOPICS, newTopics);

    return newTopic;
  },

  submitVote: (topicId: string, optionId: string): void => {
    const state = get();

    if (state.hasUserVoted(topicId)) return;

    const topic = state.topics.find((t) => t.id === topicId);
    if (!topic) return;
    if (topic.status === 'ended') return;

    const option = topic.options.find((o) => o.id === optionId);
    if (!option) return;

    const updatedTopics = state.topics.map((t) => {
      if (t.id !== topicId) return t;
      return {
        ...t,
        totalVotes: t.totalVotes + 1,
        options: t.options.map((o) =>
          o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o,
        ),
      };
    });

    const newRecord: VoteRecord = {
      topicId,
      optionId,
      votedAt: Date.now(),
    };

    const newRecords = [...state.voteRecords, newRecord];

    set({
      topics: updatedTopics,
      voteRecords: newRecords,
    });

    saveToStorage(STORAGE_KEYS.TOPICS, updatedTopics);
    saveToStorage(STORAGE_KEYS.VOTE_RECORDS, newRecords);
  },

  getTopicById: (id: string): VoteTopic | undefined => {
    return get().topics.find((t) => t.id === id);
  },

  hasUserVoted: (topicId: string): boolean => {
    return get().voteRecords.some((r) => r.topicId === topicId);
  },

  updateTopicStatuses: (): void => {
    const state = get();
    const now = Date.now();
    let hasChanges = false;

    const updatedTopics = state.topics.map((t) => {
      if (t.status === 'ongoing' && now >= t.deadline) {
        hasChanges = true;
        return { ...t, status: 'ended' as const };
      }
      return t;
    });

    if (hasChanges) {
      set({ topics: updatedTopics });
      saveToStorage(STORAGE_KEYS.TOPICS, updatedTopics);
    }
  },
}));
