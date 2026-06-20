export interface Demo {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  videoUrl: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  feedbackCount: number;
  crashCount: number;
}

export interface Feedback {
  id: string;
  demoId: string;
  type: 'like' | 'dislike' | 'text';
  content?: string;
  timestamp: number;
}

export interface CrashReport {
  id: string;
  demoId: string;
  message: string;
  stack?: string;
  timestamp: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'feedback' | 'crash' | 'heatmap' | 'init' | 'subscribe' | 'unsubscribe';
  payload: any;
}

export interface NotificationItem {
  id: string;
  type: 'feedback' | 'crash';
  message: string;
  demoId: string;
  demoTitle: string;
  timestamp: number;
}
