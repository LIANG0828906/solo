export interface AgendaItem {
  id: string;
  title: string;
  owner: string;
  duration: number;
  notes: Note[];
  order: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
  isActionItem: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  agendaItemId: string;
  noteId: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: 'not-started' | 'in-progress' | 'ended';
  agendaItems: AgendaItem[];
  actionItems: ActionItem[];
  currentAgendaIndex: number;
  startTime?: Date;
  endTime?: Date;
}

export type MeetingStatus = 'not-started' | 'in-progress' | 'ended';
export type ActionItemStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
