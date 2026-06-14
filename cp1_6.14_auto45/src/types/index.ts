export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  status: 'waiting' | 'voting' | 'ended';
  participants: Participant[];
  cards: Card[];
  votes: Vote[];
  currentCardIndex: number;
  createdAt: Date;
  createdBy: string;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: Date;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'voting' | 'completed';
  order: number;
}

export interface Vote {
  id: string;
  roomId: string;
  cardId: string;
  participantId: string;
  score: number;
  timestamp: Date;
}

export interface WSMessage {
  type: 'room_created' | 'room_joined' | 'participant_joined' | 'participant_left' |
        'vote_cast' | 'voting_started' | 'voting_ended' | 'card_updated' | 'error' | 'ping' | 'pong';
  data: Record<string, unknown>;
  timestamp: Date;
}
