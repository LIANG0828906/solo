export interface MaterialMeta {
  id: string;
  title: string;
  scene: string;
  actor: string;
  lighting: string;
  thumbnailUrl: string;
  duration: number;
  createTime: string;
}

export interface SearchParams {
  keyword?: string;
  field?: string;
  fieldValue?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  list: MaterialMeta[];
  total: number;
}

export type ViewMode = 'grid' | 'table';
