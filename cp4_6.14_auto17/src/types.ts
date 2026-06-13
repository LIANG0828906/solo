export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  linkedIds: string[];
}

export type NoteWithoutMeta = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'tags' | 'linkedIds'>;
