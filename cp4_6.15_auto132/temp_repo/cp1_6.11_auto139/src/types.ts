export interface Decision {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'design' | 'management';
  author: string;
  authorInitial: string;
  avatarColor: string;
  timestamp: string;
  pinned: boolean;
  attachments: Attachment[];
  comments: Comment[];
  activityLog: ActivityEntry[];
  displayOrder: number;
}

export interface Attachment {
  id: string;
  filename: string;
  type: 'image' | 'pdf';
  url: string;
}

export interface Comment {
  id: string;
  author: string;
  authorInitial: string;
  avatarColor: string;
  content: string;
  timestamp: string;
}

export interface ActivityEntry {
  id: string;
  type: 'create' | 'edit' | 'comment' | 'attachment';
  author: string;
  description: string;
  timestamp: string;
}

export type DecisionType = 'technical' | 'design' | 'management';
export type ViewMode = 'timeline' | 'waterfall';
export type FilterType = 'all' | DecisionType;
