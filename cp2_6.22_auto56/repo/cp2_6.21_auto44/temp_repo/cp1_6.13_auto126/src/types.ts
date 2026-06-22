export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface NoteWithLinks extends Note {
  links: {
    incoming: Note[];
    outgoing: Note[];
    incomingCount: number;
    outgoingCount: number;
  };
}

export interface SearchResult {
  note: Note;
  relevance: number;
  matchedFields: string[];
}

export interface Recommendation {
  note: Note;
  score: number;
  reason: string;
}

export interface GraphData {
  nodes: { id: string; title: string; refCount: number }[];
  links: { source: string; target: string }[];
}
