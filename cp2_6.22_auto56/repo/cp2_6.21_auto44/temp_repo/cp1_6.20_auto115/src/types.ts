export interface Photo {
  id: string;
  projectId: string;
  filename: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailSmall: string;
  thumbnailMedium: string;
  uploadDate: string;
  viewCount: number;
  downloadCount: number;
  lastViewed: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  photographerName: string;
  watermarkColor: string;
  watermarkOpacity: number;
}

export interface License {
  id: string;
  photoId: string;
  type: 'personal' | 'commercial' | 'full';
  regions: string[];
  duration: number;
  durationUnit: 'day' | 'month' | 'year';
  price: number;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentId: string;
  createdAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
}

export interface Comment {
  id: string;
  photoId: string;
  name: string;
  email: string;
  content: string;
  reply: string | null;
  createdAt: string;
  repliedAt: string | null;
}

export interface ViewRecord {
  id: string;
  photoId: string;
  ip: string;
  timestamp: string;
}
