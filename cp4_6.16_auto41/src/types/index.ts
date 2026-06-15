export type ActivityType = 'transport' | 'diet' | 'electricity';

export interface Activity {
  id: string;
  type: ActivityType;
  subtype: string;
  value: number;
  emission: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionFactor {
  type: ActivityType;
  subtype: string;
  label: string;
  factor: number;
  unit: string;
  icon: string;
  color: string;
}

export interface UserSettings {
  id: string;
  monthlyTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  potentialSaving: number;
  activityType: ActivityType;
  relatedSubtype?: string;
}

export interface Achievement {
  id: string;
  suggestionId: string;
  title: string;
  adoptedAt: string;
  potentialSaving: number;
}

export interface DailyEmission {
  date: string;
  dateLabel: string;
  total: number;
  transport: number;
  diet: number;
  electricity: number;
}

export interface LeaderboardItem {
  subtype: string;
  label: string;
  type: ActivityType;
  totalEmission: number;
  percentage: number;
  count: number;
  icon: string;
  color: string;
}

export interface ActivityFormValues {
  type: ActivityType;
  subtype: string;
  value: string;
  date: string;
}

export type IDBKey =
  | 'activities'
  | 'userSettings'
  | 'achievements'
  | 'dismissedSuggestions';
