export type Role = 'initiator' | 'receiver';
export type CommentStatus = 'unresolved' | 'resolved';
export type RevisionStatus = 'pending' | 'accepted' | 'rejected';
export type ContractStatus = 'draft' | 'negotiating' | 'signed';
export type FilterType = 'all' | 'unresolved' | 'resolved';

export interface Clause {
  id: string;
  clauseNumber: number;
  title: string;
  content: string;
  originalContent: string;
}

export interface Comment {
  id: string;
  clauseId: string;
  authorRole: Role;
  content: string;
  status: CommentStatus;
  createdAt: number;
}

export interface Revision {
  id: string;
  clauseId: string;
  beforeContent: string;
  afterContent: string;
  status: RevisionStatus;
  createdAt: number;
}

export interface Signature {
  dataUrl: string;
  signedAt: number;
  signerRole: Role;
}

export interface ContractState {
  id: string;
  title: string;
  clauses: Clause[];
  comments: Comment[];
  revisions: Revision[];
  initiatorSignature: Signature | null;
  receiverSignature: Signature | null;
  status: ContractStatus;
  currentRole: Role;
  highlightedClauseId: string | null;
  filterType: FilterType;
  showConfirmModal: boolean;
}

export interface ContractActions {
  addComment: (clauseId: string, content: string) => void;
  resolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  setFilterType: (filter: FilterType) => void;
  setHighlightedClause: (clauseId: string | null) => void;
  addRevision: (clauseId: string, beforeContent: string, afterContent: string) => void;
  acceptRevision: (revisionId: string) => void;
  rejectRevision: (revisionId: string) => void;
  restoreRevision: (revisionId: string) => void;
  setCurrentRole: (role: Role) => void;
  saveSignature: (dataUrl: string, role: Role) => void;
  setShowConfirmModal: (show: boolean) => void;
  resetContract: () => void;
}

export type ContractStore = ContractState & ContractActions;
