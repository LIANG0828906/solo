export interface Participant {
  id: string;
  name: string;
  color: string;
  confirmed: boolean;
}

export interface Expense {
  id: string;
  activityId: string;
  description: string;
  amount: number;
  payerId: string;
  splitType: 'equal' | 'custom' | 'full';
  customRatios?: { [participantId: string]: number };
  participants: string[];
  timestamp: number;
  redPackets?: RedPacket[];
}

export interface RedPacket {
  id: string;
  from: string;
  to: string;
  amount: number;
  message: string;
  timestamp: number;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
  hasRedPacket: boolean;
}

export interface Activity {
  id: string;
  name: string;
  status: 'active' | 'completed';
  participants: Participant[];
  expenses: Expense[];
  createdAt: number;
  redPackets: RedPacket[];
}

export interface StoreState {
  activities: Activity[];
  currentActivityId: string | null;
  loading: boolean;
  fetchActivities: () => Promise<void>;
  createActivity: (name: string, participants: string[]) => Promise<Activity>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  setCurrentActivity: (id: string | null) => void;
  addExpense: (activityId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => Promise<void>;
  updateExpense: (activityId: string, expenseId: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (activityId: string, expenseId: string) => Promise<void>;
  sendRedPacket: (activityId: string, packet: Omit<RedPacket, 'id' | 'timestamp'>) => Promise<void>;
  getDebts: (activityId: string) => Promise<Debt[]>;
  getParticipantById: (activityId: string, participantId: string) => Participant | undefined;
}
