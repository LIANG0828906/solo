export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  fileName: string;
  uploadedAt: string;
  status: 'pending' | 'interviewed' | 'hired' | 'rejected';
  scores: Score[];
  averageScore: number;
}

export interface Interview {
  id: string;
  resumeId: string;
  candidateName: string;
  jobTitle: string;
  date: string;
  timeSlot: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Score {
  id: string;
  resumeId: string;
  interviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
}
