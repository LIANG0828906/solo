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

export type EditorState = {
  courseId: string | null;
  pageId: string | null;
  selectedBlockId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  zoom: number;
  panX: number;
  panY: number;
  setCourseId: (id: string | null) => void;
  setPageId: (id: string | null) => void;
  setSelectedBlockId: (id: string | null) => void;
  setIsDragging: (value: boolean) => void;
  setIsResizing: (value: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
};
