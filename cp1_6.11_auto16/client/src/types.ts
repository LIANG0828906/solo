export interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  announcementId: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: number;
  votes?: Vote[];
}

export interface AppState {
  announcements: Announcement[];
  loading: boolean;
}
