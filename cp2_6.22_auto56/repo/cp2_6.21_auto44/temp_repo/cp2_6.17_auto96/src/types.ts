export interface Photo {
  id: string;
  title: string;
  date: string;
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  createdAt: number;
}

export type CropAspect = number;

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
