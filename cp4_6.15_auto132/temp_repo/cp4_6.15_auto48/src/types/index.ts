export type LeadSource = '线上广告' | '线下展会' | '朋友推荐' | '主动搜索';

export type LeadStatus = '新建' | '跟进中' | '已转化' | '已流失';

export type FollowUpMethod = '电话' | '微信' | '邮件' | '面谈';

export type OpportunityStatus = '进行中' | '已赢单' | '已输单';

export interface FollowUpRecord {
  id: string;
  leadId: string;
  method: FollowUpMethod;
  summary: string;
  date: string;
  nextReminderDate?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  followUpRecords: FollowUpRecord[];
}

export interface Customer {
  id: string;
  leadId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  convertedAt: string;
  conversionRate: number;
}

export interface Opportunity {
  id: string;
  customerId: string;
  name: string;
  expectedAmount: number;
  expectedCloseDate: string;
  progress: number;
  status: OpportunityStatus;
}

export interface DailyLeadData {
  date: string;
  leads: number;
  isToday: boolean;
  previousDayLeads?: number;
}

export interface SourceDistribution {
  source: LeadSource;
  count: number;
  percentage: number;
}

export interface DashboardMetrics {
  totalLeads: number;
  conversionRate: number;
  totalWonAmount: number;
  dailyLeadsLast30Days: DailyLeadData[];
  sourceDistribution: SourceDistribution[];
}
