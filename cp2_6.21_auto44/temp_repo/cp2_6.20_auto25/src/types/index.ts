export interface Work {
  id: string;
  title: string;
  uploader: string;
  uploader_email: string;
  file_url: string;
  file_type: "image" | "video";
  thumbnail_url: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
  reviewed_at?: string;
  reject_reason?: string;
}

export interface UploadResponse {
  id: string;
  file_url: string;
  thumbnail_url: string;
  status: string;
}

export interface ReviewRequest {
  action: "approve" | "reject";
  reject_reason?: string;
}

export interface SearchParams {
  search?: string;
  date_from?: string;
  date_to?: string;
  status?: "pending" | "published" | "rejected";
}
