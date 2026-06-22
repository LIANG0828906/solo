export type Course = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Page = {
  id: string;
  courseId: string;
  title: string;
  backgroundColor: string;
  order: number;
};

export type BlockType = "text" | "image" | "quiz";

export type Block = {
  id: string;
  pageId: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextBlock = Block & {
  type: "text";
  content: string;
};

export type ImageBlock = Block & {
  type: "image";
  url: string;
  alt: string;
};

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizBlock = Block & {
  type: "quiz";
  question: string;
  mode: "single" | "multi";
  options: QuizOption[];
  score: number;
};

export type AnyBlock = TextBlock | ImageBlock | QuizBlock;

export type VersionSnapshot = {
  id: string;
  courseId: string;
  timestamp: string;
  note: string;
  data: string;
};

