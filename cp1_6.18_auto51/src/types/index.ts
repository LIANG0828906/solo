export interface Continuation {
  id: string;
  content: string;
  createdAt: number;
}

export interface Bottle {
  id: string;
  content: string;
  images: string[];
  continuations: Continuation[];
  createdAt: number;
  viewedBy: string[];
}
