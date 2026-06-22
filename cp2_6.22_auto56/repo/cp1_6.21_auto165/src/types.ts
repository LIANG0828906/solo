export interface Meme {
  id: string;
  content: string;
  tags: string[];
  author: string;
  likes: number;
  timestamp: number;
}

export interface MemeContextType {
  memes: Meme[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  addMeme: (content: string, tags: string[], author: string) => Promise<void>;
  likeMeme: (id: string) => Promise<void>;
  fetchMemes: () => Promise<void>;
}
