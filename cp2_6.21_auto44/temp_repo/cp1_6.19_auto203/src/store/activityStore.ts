import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Participant {
  id: string;
  name: string;
  phone: string;
  checkedIn: boolean;
  checkInTime: string | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  gradient: string;
  participants: Participant[];
  createdAt: string;
}

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'gradient' | 'participants' | 'createdAt'>) => Activity;
  addParticipant: (activityId: string, participant: Omit<Participant, 'id' | 'checkedIn' | 'checkInTime'>) => Participant | null;
  checkIn: (activityId: string, participantId: string) => boolean;
  getActivityById: (id: string) => Activity | undefined;
}

const gradients = [
  'from-pink-500 to-rose-500',
  'from-fuchsia-500 to-purple-600',
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-600',
  'from-green-500 to-lime-500',
  'from-yellow-500 to-orange-500',
  'from-orange-500 to-red-500',
];

const getRandomGradient = () => {
  return gradients[Math.floor(Math.random() * gradients.length)];
};

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      addActivity: (activityData) => {
        const newActivity: Activity = {
          ...activityData,
          id: uuidv4(),
          gradient: getRandomGradient(),
          participants: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          activities: [...state.activities, newActivity],
        }));
        return newActivity;
      },
      addParticipant: (activityId, participantData) => {
        const state = get();
        const activity = state.activities.find((a) => a.id === activityId);
        if (!activity || activity.participants.length >= activity.maxParticipants) {
          return null;
        }
        const newParticipant: Participant = {
          ...participantData,
          id: uuidv4(),
          checkedIn: false,
          checkInTime: null,
        };
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === activityId
              ? { ...a, participants: [...a.participants, newParticipant] }
              : a
          ),
        }));
        return newParticipant;
      },
      checkIn: (activityId, participantId) => {
        const state = get();
        const activity = state.activities.find((a) => a.id === activityId);
        if (!activity) return false;
        const participant = activity.participants.find((p) => p.id === participantId);
        if (!participant || participant.checkedIn) return false;
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === activityId
              ? {
                  ...a,
                  participants: a.participants.map((p) =>
                    p.id === participantId
                      ? { ...p, checkedIn: true, checkInTime: new Date().toISOString() }
                      : p
                  ),
                }
              : a
          ),
        }));
        return true;
      },
      getActivityById: (id) => {
        return get().activities.find((a) => a.id === id);
      },
    }),
    {
      name: 'activity-storage',
    }
  )
);
