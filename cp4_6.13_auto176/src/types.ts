export interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  textBlockId: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'comment';
  comment?: string;
  commentNumber?: number;
  textPreview?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
