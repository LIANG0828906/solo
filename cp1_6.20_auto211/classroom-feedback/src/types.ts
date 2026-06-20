export interface Feedback {
  type: 'understood' | 'confused' | 'lost';
  studentId: string;
  topicIndex: number;
}

export interface Question {
  id: string;
  text: string;
  studentId: string;
  studentLabel: string;
  topicIndex: number;
  timestamp: number;
  lastFeedbackType: 'understood' | 'confused' | 'lost' | null;
}

export interface TopicVotes {
  understood: number;
  confused: number;
  lost: number;
}

export interface TopicData {
  votes: TopicVotes;
  questions: Question[];
  studentVotes: Record<string, 'understood' | 'confused' | 'lost' | null>;
}

export interface ServerState {
  topics: string[];
  currentTopicIndex: number;
  topicDataMap: TopicData[];
}
