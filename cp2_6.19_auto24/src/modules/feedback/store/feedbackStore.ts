import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Meeting, Feedback, MeetingStats, ViewType } from '../../../types';

interface FeedbackState {
  meetings: Meeting[];
  feedbacks: Feedback[];
  currentMeetingId: string | null;
  currentView: ViewType;
  mobileMenuOpen: boolean;
  
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => string;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'isProcessed'>) => void;
  processFeedback: (feedbackId: string, reply: string) => void;
  setCurrentMeeting: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  toggleMobileMenu: () => void;
  getMeetingFeedbacks: (meetingId: string) => Feedback[];
  getSortedFeedbacks: (meetingId: string) => Feedback[];
  getMeetingStats: (meetingId: string) => MeetingStats;
  getMeetingsByMonth: () => Record<string, Meeting[]>;
  getMeetingById: (id: string) => Meeting | undefined;
  getMeetingAvgScore: (meetingId: string) => number;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      meetings: [],
      feedbacks: [],
      currentMeetingId: null,
      currentView: 'list',
      mobileMenuOpen: false,

      addMeeting: (meetingData) => {
        const newMeeting: Meeting = {
          ...meetingData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          meetings: [newMeeting, ...state.meetings],
        }));
        return newMeeting.id;
      },

      addFeedback: (feedbackData) => {
        const newFeedback: Feedback = {
          ...feedbackData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          isProcessed: false,
        };
        set((state) => ({
          feedbacks: [newFeedback, ...state.feedbacks],
        }));
      },

      processFeedback: (feedbackId, reply) => {
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === feedbackId
              ? {
                  ...f,
                  isProcessed: true,
                  reply,
                  repliedAt: new Date().toISOString(),
                }
              : f
          ),
        }));
      },

      setCurrentMeeting: (id) => set({ currentMeetingId: id }),
      setCurrentView: (view) => set({ currentView: view }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      getMeetingFeedbacks: (meetingId) => {
        return get().feedbacks.filter((f) => f.meetingId === meetingId);
      },

      getSortedFeedbacks: (meetingId) => {
        const feedbacks = get().getMeetingFeedbacks(meetingId);
        const unprocessed = feedbacks
          .filter((f) => !f.isProcessed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const processed = feedbacks
          .filter((f) => f.isProcessed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return [...unprocessed, ...processed];
      },

      getMeetingStats: (meetingId) => {
        const feedbacks = get()
          .getMeetingFeedbacks(meetingId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const totalFeedbacks = feedbacks.length;
        const processedCount = feedbacks.filter((f) => f.isProcessed).length;

        const avgScore =
          totalFeedbacks > 0
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
            : 0;

        const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedbacks.forEach((f) => {
          ratingDistribution[f.rating]++;
        });

        const scoreTrend = feedbacks.map((f, index) => ({
          index: index + 1,
          score: f.rating,
        }));

        return {
          avgScore,
          totalFeedbacks,
          processedCount,
          ratingDistribution,
          scoreTrend,
        };
      },

      getMeetingsByMonth: () => {
        const meetings = [...get().meetings].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return meetings.reduce((groups, meeting) => {
          const date = new Date(meeting.createdAt);
          const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(meeting);
          return groups;
        }, {} as Record<string, Meeting[]>);
      },

      getMeetingById: (id) => {
        return get().meetings.find((m) => m.id === id);
      },

      getMeetingAvgScore: (meetingId) => {
        const feedbacks = get().getMeetingFeedbacks(meetingId);
        if (feedbacks.length === 0) return 0;
        return feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      },
    }),
    {
      name: 'meeting-feedback-storage',
    }
  )
);
