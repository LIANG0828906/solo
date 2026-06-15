export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  linkedIds: string[];
}

export type NoteWithoutMeta = {
  content: string;
  title?: string;
};
