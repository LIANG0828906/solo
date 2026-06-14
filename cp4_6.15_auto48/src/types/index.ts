export type LeadSource =
  | '线上广告'
  | '线下展会'
  | '朋友推荐'
  | '主动搜索'
  | 'website'
  | 'referral'
  | 'social_media'
  | 'email_campaign'
  | 'cold_call'
  | 'trade_show'
  | 'advertisement'
  | 'direct_mail';

export type LeadStatus =
  | '待跟进'
  | '跟进中'
  | '已成交'
  | '已流失'
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'converted'
  | 'lost';

export type FollowUpType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'presentation'
  | 'demo'
  | 'quote'
  | 'contract'
  | 'note';

export type OpportunityStatus =
  | 'open'
  | 'in_progress'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface FollowUpRecordItem {
  id: string;
  type: FollowUpType;
  content: string;
  date: string;
  nextFollowUpDate?: string;
  duration: number;
  userId: string;
  userName: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  score?: number;
  assignee?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  followUpRecords: FollowUpRecordItem[];
}

export interface FollowUpRecord {
  id: string;
  leadId: string;
  type: FollowUpType;
  content: string;
  date: string;
  nextFollowUpDate?: string;
  duration: number;
  userId: string;
  userName: string;
}

export interface Customer {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  companySize: string;
  address: string;
  convertedDate: string;
  totalRevenue: number;
  activeContracts: number;
}

export interface Opportunity {
  id: string;
  leadId: string;
  customerId?: string;
  title: string;
  description: string;
  value: number;
  probability: number;
  status: OpportunityStatus;
  stage: string;
  expectedCloseDate: string;
  actualCloseDate?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  convertedLeads: number;
  conversionRate: number;
  totalCustomers: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  totalPipelineValue: number;
  wonRevenue: number;
  averageDealSize: number;
  leadSources: Array<{ source: LeadSource; count: number }>;
  leadStatuses: Array<{ status: LeadStatus; count: number }>;
  opportunitiesByStatus: Array<{ status: OpportunityStatus; value: number }>;
  monthlyTrend: Array<{ month: string; leads: number; customers: number; revenue: number }>;
}
