export interface Volunteer {
  id: string;
  name: string;
  contact: string;
  tags: string[];
  balance_hours: number;
  donated_hours: number;
  completed_hours: number;
  created_at: string;
  last_active_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  required_hours: number;
  achieved_hours: number;
  deadline: string;
  created_at: string;
  status: 'active' | 'closed';
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  required_hours: number;
  status: 'open' | 'in_progress' | 'completed';
}

export interface TaskClaim {
  id: string;
  task_id: string;
  volunteer_id: string;
  claimed_at: string;
  status: 'in_progress' | 'submitted' | 'approved' | 'rejected';
  proof_text: string;
  proof_image: string;
}

export interface TimeTransaction {
  id: string;
  volunteer_id: string;
  project_id: string;
  type: 'donate' | 'complete' | 'refund';
  hours: number;
  created_at: string;
  description: string;
}

export interface Statistics {
  totalDonatedHours: number;
  activeProjectCount: number;
  todayNewVolunteers: number;
  volunteerRankPercentile: number | null;
  weekDonationTrend: { date: string; hours: number }[];
}
