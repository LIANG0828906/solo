export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  avatarColor: string;
  createdAt: string;
}

export type WorkType = 'story' | 'poem' | 'script';

export interface OutlineNode {
  id: string;
  title: string;
  children: OutlineNode[];
  collapsed?: boolean;
  content?: string;
}

export interface Version {
  id: string;
  version: number;
  content: string;
  outline: OutlineNode[];
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  type: WorkType;
  content: string;
  outline: OutlineNode[];
  authorId: string;
  collaborators: Collaborator[];
  versions: Version[];
  createdAt: string;
  updatedAt: string;
}

export type CollaboratorRole = 'editor' | 'commenter';

export interface Collaborator {
  userId: string;
  role: CollaboratorRole;
  email?: string;
  name?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface Invitation {
  id: string;
  workId: string;
  workTitle: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  role: CollaboratorRole;
  status: InvitationStatus;
  createdAt: string;
}

export interface InspirationCard {
  id: string;
  content: string;
  color: string;
  priority: number;
  completed: boolean;
  order: number;
  workId: string;
  authorId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  workId: string;
  authorId: string;
  authorName: string;
  content: string;
  position: number;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  works: Work[];
  invitations: Invitation[];
  inspirations: InspirationCard[];
  comments: Comment[];
}
