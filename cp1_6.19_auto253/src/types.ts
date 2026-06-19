export type PixelColor = string | null;

export type FrameData = PixelColor[][];

export interface Frame {
  id: string;
  data: FrameData;
  editorId?: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface GifRequest {
  frames: { data: FrameData }[];
  delay?: number;
}

export interface GifResponse {
  success: boolean;
  url?: string;
  base64?: string;
  error?: string;
}
