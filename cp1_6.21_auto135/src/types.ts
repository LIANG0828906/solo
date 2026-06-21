export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  refCount?: number;
}

export interface SimilarityPair {
  card1Id: string;
  card2Id: string;
  similarity: number;
}
