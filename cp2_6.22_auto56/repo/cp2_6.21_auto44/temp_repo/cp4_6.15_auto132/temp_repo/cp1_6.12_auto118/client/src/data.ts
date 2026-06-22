export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export interface Comment {
  id: string;
  paragraphId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  content: string;
  createdAt: number;
}

export interface Paragraph {
  id: string;
  storyId: string;
  authorId: string;
  authorNickname: string;
  authorAvatar: string;
  content: string;
  index: number;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  coverColor: string;
  paragraphs: Paragraph[];
  participants: User[];
  contributorIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StorySummary {
  id: string;
  title: string;
  summary: string;
  coverColor: string;
  paragraphCount: number;
  participantCount: number;
  updatedAt: number;
}
