export interface CurvePoint {
  time: number;
  bean_temp: number;
  env_temp: number;
  ror: number;
  phase: number;
}

export interface Marker {
  time: number;
  label: string;
}

export interface Batch {
  id: number;
  bean_type: string;
  roast_level: string;
  charge_temp: number;
  drop_temp: number;
  total_time: number;
  curve_data: CurvePoint[];
  markers: Marker[];
  is_public: boolean;
  rating: number;
  created_at: string;
}

export interface TasteNote {
  id: number;
  batch_id: number;
  category: string;
  sub_flavors: string[];
  created_at: string;
}

export interface Comment {
  id: number;
  batch_id: number;
  content: string;
  created_at: string;
}

export interface PublicBatch {
  id: number;
  bean_type: string;
  roast_level: string;
  total_time: number;
  flavor_tags: string[];
  rating: number;
  created_at: string;
}

export interface PublicBatchDetail extends Batch {
  taste_notes: TasteNote[];
  comments: Comment[];
}

export interface PaginatedBatches {
  items: PublicBatch[];
  total: number;
  page: number;
  page_size: number;
}

export interface BatchCreate {
  bean_type: string;
  roast_level: string;
  charge_temp: number;
  drop_temp: number;
  total_time: number;
  curve_data: CurvePoint[];
  markers: Marker[];
  is_public: boolean;
  rating: number;
}

export interface TasteNoteCreate {
  batch_id: number;
  category: string;
  sub_flavors: string[];
}

export interface CommentCreate {
  batch_id: number;
  content: string;
}
