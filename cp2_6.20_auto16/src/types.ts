export interface PoemLine {
  id: string;
  text: string;
  rhymeMark: string;
  charCount: number;
  order: number;
}

export interface Poem {
  id: string;
  title: string;
  authorId: string;
  collectionId: string | null;
  lines: PoemLine[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TonalError {
  position: number;
  char: string;
  expected: string;
  actual: string;
  message: string;
}

export interface TonalResult {
  lineId: string;
  score: number;
  errors: TonalError[];
}

export interface Annotation {
  id: string;
  poemId: string;
  lineId: string;
  authorId: string;
  authorName: string;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  content: string;
  replies: AnnotationReply[];
  createdAt: string;
}

export interface AnnotationReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface InspirationCard {
  id: string;
  userId: string;
  content: string;
  starred: boolean;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  poemCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  poemId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  poemId: string;
  userId: string;
  userName: string;
  avatar: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface WSMessage {
  type: string;
  poemId: string;
  payload: unknown;
  fromUserId?: string;
}
