export interface BaseElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
  opacity: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  colorKey: 'primary' | 'secondary' | 'background' | 'custom';
  customColor?: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius: number;
}

export type CanvasElement = TextElement | ImageElement;

export interface ColorTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export interface PosterTemplate {
  id: string;
  name: string;
  category: 'festival' | 'promotion' | 'morning' | 'other';
  thumbnail: string;
  canvasBackground: string;
  colorThemeId: string;
  elements: CanvasElement[];
}

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  thumbnail: string;
  elements: CanvasElement[];
  colorThemeId: string;
  canvasBackground: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number;
  isAuthor: boolean;
}

export interface GalleryPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  thumbnail: string;
  fullImage: string;
  likes: number;
  likedByMe: boolean;
  publishedAt: number;
  comments: Comment[];
}

export type PanelType = 'properties' | 'templates' | 'colors' | 'versions' | null;
