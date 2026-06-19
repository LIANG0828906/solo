export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
  bonus: number;
  createdAt: string;
  referrerCount: number;
}

export interface Referral {
  id: string;
  jobId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateResume: string;
  status: '已投递' | '面试中' | '已录用' | '已入职';
  referrerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  referrerName: string;
  successCount: number;
}
