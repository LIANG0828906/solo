export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isCurrentUser?: boolean;
}

export type SplitType = 'equal' | 'proportion' | 'designated';

export interface SplitDetail {
  participantId: string;
  weight: number;
  amount: number;
  included: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string;
  splitType: SplitType;
  splitDetails: SplitDetail[];
  createdAt: number;
  isSettled: boolean;
}

export interface SettlementItem {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  isIgnored: boolean;
  isAdjusted: boolean;
}

export interface DebtRecord {
  participantId: string;
  paid: number;
  shouldPay: number;
  balance: number;
}

export interface TransferHistory {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  settledAt: number;
  relatedExpenseIds: string[];
  description: string;
}

export type PageType = 'home' | 'settlement' | 'history';

export const AVATAR_OPTIONS: string[] = [
  '👤', '👨', '👩', '🧑', '👴', '👵',
  '👶', '👱', '👲', '🧔', '👸', '🦸',
];
