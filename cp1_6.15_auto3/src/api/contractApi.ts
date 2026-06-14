export interface Comment {
  id: string;
  lineIndex: number;
  content: string;
  author: string;
  timestamp: number;
  replies: Comment[];
}

export interface HistoryRecord {
  id: string;
  type: 'version' | 'comment' | 'approve' | 'reject';
  description: string;
  user: string;
  timestamp: number;
}

export type ApprovalStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface ContractData {
  contractId: string;
  oldContent: string;
  newContent: string;
  comments: Comment[];
  approvalStatus: ApprovalStatus;
  history: HistoryRecord[];
}

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getContract(): Promise<ContractData> {
  const response = await fetch(`${API_BASE}/contract`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<ContractData>(response);
}

export interface AddCommentRequest {
  lineIndex: number;
  content: string;
  author: string;
  replyToId?: string;
}

export async function addComment(request: AddCommentRequest): Promise<Comment> {
  const response = await fetch(`${API_BASE}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<Comment>(response);
}

export interface ApproveRequest {
  action: 'approve' | 'reject';
  user: string;
  oldContent?: string;
  newContent?: string;
}

export interface ApproveResponse {
  status: ApprovalStatus;
  history: HistoryRecord[];
}

export async function approveContract(request: ApproveRequest): Promise<ApproveResponse> {
  const response = await fetch(`${API_BASE}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return handleResponse<ApproveResponse>(response);
}
