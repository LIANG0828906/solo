export interface Capsule {
  id: string;
  title: string;
  content: string;
  themeColor: string;
  openDate: string;
  createdAt: string;
  openedAt: string | null;
  isPrivate: boolean;
  passwordHash: string | null;
  attachmentIds: string[];
  failedAttempts: number;
  lockUntil: string | null;
}

export interface Attachment {
  id: string;
  capsuleId: string;
  data: Blob;
  mimeType: string;
  size: number;
  filename: string;
}

export interface AttachmentUpload {
  id: string;
  file: File;
  progress: number;
  dataUrl?: string;
}

export type PageType = 'timeline' | 'private' | 'opened' | 'create';
