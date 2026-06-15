import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message);
    throw error;
  }
);

export interface Project {
  id: string;
  name: string;
  budgetMin: number;
  budgetMax: number;
  description: string;
  deadline: string;
  status: 'active' | 'expired' | 'closed';
  createdAt: string;
  publisher: string;
}

export interface Bid {
  id: string;
  projectId: string;
  contractorName: string;
  price: number;
  duration: number;
  planSummary: string;
  attachmentUrl: string;
  status: 'pending' | 'shortlisted' | 'rejected';
  submittedAt: string;
}

export interface Message {
  id: string;
  bidId: string;
  senderId: string;
  senderName: string;
  senderRole: 'publisher' | 'contractor';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Contract {
  id: string;
  contractNo: string;
  projectId: string;
  projectName: string;
  bidId: string;
  publisherName: string;
  contractorName: string;
  finalPrice: number;
  finalDuration: number;
  description: string;
  signedAt: string | null;
  status: 'pending' | 'active' | 'completed';
  publisherSigned: boolean;
  contractorSigned: boolean;
}

export const ApiProxy = {
  getProjects: () => api.get<any, Project[]>('/projects'),
  getProject: (id: string) => api.get<any, Project>(`/projects/${id}`),
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'status'>) =>
    api.post<any, Project>('/projects', data),
  updateProject: (id: string, data: Partial<Project>) =>
    api.put<any, Project>(`/projects/${id}`, data),
  closeProject: (id: string) => api.post<any, Project>(`/projects/${id}/close`),

  getBids: (projectId?: string) =>
    api.get<any, Bid[]>('/bids' + (projectId ? `?projectId=${projectId}` : '')),
  createBid: (data: Omit<Bid, 'id' | 'submittedAt' | 'status'>) =>
    api.post<any, Bid>('/bids', data),
  updateBidStatus: (id: string, status: 'shortlisted' | 'rejected') =>
    api.put<any, Bid>(`/bids/${id}/status`, { status }),

  getMessages: (bidId: string) => api.get<any, Message[]>(`/messages?bidId=${bidId}`),
  sendMessage: (data: Omit<Message, 'id' | 'timestamp' | 'status'>) =>
    api.post<any, Message>('/messages', data),

  getContracts: () => api.get<any, Contract[]>('/contracts'),
  createContract: (data: Omit<Contract, 'id' | 'contractNo' | 'status' | 'publisherSigned' | 'contractorSigned' | 'signedAt'>) =>
    api.post<any, Contract>('/contracts', data),
  signContract: (id: string, role: 'publisher' | 'contractor') =>
    api.post<any, Contract>(`/contracts/${id}/sign`, { role }),
};
