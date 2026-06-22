export interface RadarScores {
  contentDepth: number;
  funFactor: number;
  teacherQuality: number;
  valueForMoney: number;
  afterClassService: number;
}

export interface Tag {
  name: string;
  count: number;
}

export interface UserReview {
  id: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  teacher: {
    name: string;
    avatar: string;
    bio: string;
  };
  price: number;
  outline: string[];
  rating: number;
  radarScores: RadarScores;
  tags: Tag[];
  reviews: UserReview[];
  userReview?: UserReview;
}

export interface ReputationData {
  tags: Tag[];
  recentReviews: UserReview[];
}

export interface SearchResult {
  courses: Course[];
}

export interface ReviewSubmission {
  rating: number;
  comment: string;
}
