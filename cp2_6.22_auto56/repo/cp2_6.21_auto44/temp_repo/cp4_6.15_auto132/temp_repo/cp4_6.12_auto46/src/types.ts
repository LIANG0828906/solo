export interface ReadingRecord {
  id: string;
  childName: string;
  bookName: string;
  date: string;
  tags: string[];
  rating: number;
}

export interface BookRecommendation {
  id: string;
  title: string;
  cover: string;
  reason: string;
  matchedTags: string[];
  matchScore: number;
  description: string;
  author: string;
  ageRange: string;
}
