export interface RewardTier {
  id: string;
  amount: number;
  description: string;
  imageUrl: string;
  deliveryDate: string;
  limit: number;
  pledged: number;
}

export interface Project {
  id: string;
  name: string;
  coverImage: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description: string;
  rewardTiers: RewardTier[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Pledge {
  id: string;
  projectId: string;
  tierId: string;
  nickname: string;
  email: string;
  message: string;
  amount: number;
  createdAt: string;
}

export interface PledgeRequest {
  projectId: string;
  tierId: string;
  nickname: string;
  email: string;
  message?: string;
}

export interface PledgeResponse {
  pledgeId: string;
  project: Project;
}
