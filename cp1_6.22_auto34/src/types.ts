export interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  favicon: string;
  notes?: string;
}
