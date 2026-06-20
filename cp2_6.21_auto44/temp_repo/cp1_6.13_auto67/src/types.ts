export interface Exhibit {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tags: string[];
  likes: number;
  boothId: string | null;
}

export interface Booth {
  id: string;
  name: string;
  number: number;
  exhibitIds: string[];
}

export interface Comment {
  id: string;
  exhibitId: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface ExpoData {
  exhibits: Exhibit[];
  booths: Booth[];
  comments: Comment[];
}
