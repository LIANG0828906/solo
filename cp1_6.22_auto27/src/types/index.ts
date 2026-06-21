export interface Prize {
  id: string;
  activityId: string;
  name: string;
  quantity: number;
  icon: string;
  order: number;
  drawnCount: number;
}

export interface Participant {
  id: string;
  activityId: string;
  name: string;
  phone: string;
  email: string;
}

export interface Activity {
  id: string;
  name: string;
  createdAt: number;
}

export interface LotteryResult {
  id: string;
  activityId: string;
  prizeId: string;
  participantId: string;
  prizeName: string;
  prizeIcon: string;
  participantName: string;
  drawnAt: number;
}

export interface ActivityDetail {
  activity: Activity;
  prizes: Prize[];
  participants: Participant[];
  results: LotteryResult[];
  stats: {
    totalParticipants: number;
    totalPrizes: number;
    drawnPrizes: number;
  };
}

export interface CreateActivityData {
  name: string;
  prizes: { name: string; quantity: string; icon: string }[];
  participants: { name: string; phone?: string; email?: string }[];
}

export type PageType = 'create' | 'lottery' | 'results';
