export interface Material {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
}

export interface WorkImage {
  id: string;
  url: string;
  order: number;
}

export interface Work {
  id: string;
  name: string;
  category: string;
  salesChannel: string;
  price: number;
  remark: string;
  materials: Material[];
  images: WorkImage[];
  size?: string;
  texture?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GenerateShareRequest {
  workId: string;
  brandSettings?: {
    logoText: string;
    gradientFrom: string;
    gradientTo: string;
  };
}

export interface GenerateShareResponse {
  imageBase64: string;
  width: number;
  height: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface UploadImageResponse {
  id: string;
  url: string;
}
