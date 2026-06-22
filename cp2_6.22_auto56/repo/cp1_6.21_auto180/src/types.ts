export interface Paragraph {
  id: string;
  content: string;
  author: string;
  createdAt: number;
  branchId: string;
  parentParagraphId: string | null;
}

export interface Branch {
  id: string;
  name: string;
  storyId: string;
  parentBranchId: string | null;
  parentParagraphId: string | null;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  createdAt: number;
  branches: Branch[];
  paragraphs: Paragraph[];
  activeBranchId: string;
}

export interface CreateStoryRequest {
  title: string;
  firstParagraph: string;
  author: string;
}

export interface CreateBranchRequest {
  storyId: string;
  parentBranchId: string;
  parentParagraphId: string;
  author: string;
}

export interface AddParagraphRequest {
  content: string;
  author: string;
  branchId: string;
}
