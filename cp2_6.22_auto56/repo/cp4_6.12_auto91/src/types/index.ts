export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  waveformData: number[];
  likes: number;
  createdAt: string;
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
  createdAt: string;
}

export interface Comment {
  id: string;
  targetId: string;
  targetType: 'track' | 'blog';
  content: string;
  author: string;
  avatar?: string;
  approved: boolean;
  createdAt: string;
}

export interface AppState {
  tracks: TrackWithCounts[];
  blogs: Blog[];
  comments: Comment[];
  currentTrack: Track | null;
  currentBlog: Blog | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  fetchTracks: () => Promise<void>;
  fetchTrack: (id: string) => Promise<Track | null>;
  deleteTrack: (id: string) => Promise<void>;
  likeTrack: (id: string) => Promise<void>;
  fetchBlogs: () => Promise<void>;
  fetchBlog: (id: string) => Promise<Blog | null>;
  deleteBlog: (id: string) => Promise<void>;
  fetchComments: (targetId?: string, targetType?: 'track' | 'blog') => Promise<void>;
  addComment: (targetId: string, targetType: 'track' | 'blog', content: string, author: string) => Promise<void>;
  approveComment: (id: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
