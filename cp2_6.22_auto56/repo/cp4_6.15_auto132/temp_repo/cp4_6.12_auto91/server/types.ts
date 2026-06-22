export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  waveformData: number[];
  likes: number;
  createdAt: Date;
}

export interface TrackWithCounts extends Track {
  commentCount: number;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  coverUrl: string;
  author: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  targetId: string;
  targetType: 'track' | 'blog';
  content: string;
  author: string;
  approved: boolean;
  createdAt: Date;
}
