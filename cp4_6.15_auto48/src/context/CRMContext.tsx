import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Lead,
  Customer,
  Opportunity,
  FollowUpRecord,
  LeadSource,
  LeadStatus,
  OpportunityStatus,
  FollowUpType,
  FollowUpRecordItem,
} from '@/types';

interface CRMState {
  leads: Lead[];
  customers: Customer[];
  opportunities: Opportunity[];
  followUpRecords: FollowUpRecord[];
}

interface CRMContextType extends CRMState {
  addOpportunity: (customerId: string, data: { name: string; expectedAmount: number; expectedCloseDate: string }) => void;
  closeOpportunity: (opportunityId: string, status: 'won' | 'lost') => void;
  getCustomerConversionRate: (customerId: string) => number;
  getDailyLeadsLast30Days: () => Array<{ date: string; leads: number; isToday: boolean }>;
  getLeadSourceDistribution: () => Array<{ source: string; count: number; percentage: number }>;
  getTotalLeads: () => number;
  getOverallConversionRate: () => number;
  getTotalWonAmount: () => number;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

type CRMAction =
  | { type: 'SET_DATA'; payload: CRMState }
  | { type: 'ADD_OPPORTUNITY'; payload: Opportunity }
  | { type: 'CLOSE_OPPORTUNITY'; payload: { id: string; status: 'won' | 'lost'; actualCloseDate: string } };

const initialState: CRMState = {
  leads: [],
  customers: [],
  opportunities: [],
  followUpRecords: [],
};

function crmReducer(state: CRMState, action: CRMAction): CRMState {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;
    case 'ADD_OPPORTUNITY':
      return {
        ...state,
        opportunities: [...state.opportunities, action.payload],
      };
    case 'CLOSE_OPPORTUNITY':
      return {
        ...state,
        opportunities: state.opportunities.map((opp) =>
          opp.id === action.payload.id
            ? { ...opp, status: action.payload.status as OpportunityStatus, actualCloseDate: action.payload.actualCloseDate }
            : opp
        ),
      };
    default:
      return state;
  }
}

function generateMockData(): CRMState {
  const leadSources: LeadSource[] = ['线上广告', '线下展会', '朋友推荐', '主动搜索', 'website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'advertisement', 'direct_mail'];
  const leadStatuses: LeadStatus[] = ['待跟进', '跟进中', '已成交', '已流失', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  const followUpTypes: FollowUpType[] = ['call', 'email', 'meeting', 'presentation', 'demo', 'quote', 'contract', 'note'];
  const opportunityStatuses: OpportunityStatus[] = ['open', 'in_progress', 'proposal_sent', 'negotiation', 'won', 'lost'];

  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇'];
  const companies = ['科技有限公司', '信息技术有限公司', '网络科技有限公司', '电子商务有限公司', '数据服务有限公司', '智能科技有限公司'];
  const industries = ['互联网', '金融', '教育', '医疗', '制造业', '零售业', '能源', '咨询'];
  const companySizes = ['1-50人', '51-200人', '201-500人', '501-1000人', '1000人以上'];

  const leads: Lead[] = [];
  const customers: Customer[] = [];
  const opportunities: Opportunity[] = [];
  const followUpRecords: FollowUpRecord[] = [];

  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const leadId = uuidv4();
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const contactPerson = firstName + lastName;
    const companyName = lastName + companies[Math.floor(Math.random() * companies.length)];

    const lead: Lead = {
      id: leadId,
      companyName,
      contactPerson,
      phone: `1${Math.floor(Math.random() * 9 + 3)}${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')}`,
      email: `${firstName}${lastName}@example.com`.toLowerCase(),
      company: companyName,
      source: leadSources[Math.floor(Math.random() * leadSources.length)],
      status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
      score: Math.floor(Math.random() * 100),
      assignee: '销售员' + (Math.floor(Math.random() * 5) + 1),
      notes: '',
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      followUpRecords: [],
    };

    leads.push(lead);

    if (lead.status === 'converted' || lead.status === '已成交') {
      const convertedDaysAgo = Math.floor(Math.random() * 30);
      const convertedDate = new Date(createdAt.getTime() + convertedDaysAgo * 24 * 60 * 60 * 1000);
      const customerId = uuidv4();

      const customer: Customer = {
        id: customerId,
        leadId,
        name: lead.contactPerson,
        email: lead.email || `${firstName}${lastName}@example.com`.toLowerCase(),
        phone: lead.phone,
        company: lead.company || lead.companyName,
        industry: industries[Math.floor(Math.random() * industries.length)],
        companySize: companySizes[Math.floor(Math.random() * companySizes.length)],
        address: '北京市朝阳区xxx街道xxx号',
        convertedDate: convertedDate.toISOString(),
        totalRevenue: 0,
        activeContracts: Math.floor(Math.random() * 3),
      };

      customers.push(customer);

      const opportunityCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < opportunityCount; j++) {
        const oppId = uuidv4();
        const oppStatus = opportunityStatuses[Math.floor(Math.random() * opportunityStatuses.length)];
        const expectedCloseDate = new Date(now.getTime() + (Math.floor(Math.random() * 60) - 15) * 24 * 60 * 60 * 1000);
        const value = (Math.floor(Math.random() * 50) + 5) * 1000;

        const opportunity: Opportunity = {
          id: oppId,
          leadId,
          customerId,
          title: `${lead.companyName} - 合作项目 ${j + 1}`,
          description: '关于产品服务的合作洽谈',
          value,
          probability: oppStatus === 'won' ? 100 : oppStatus === 'lost' ? 0 : Math.floor(Math.random() * 60) + 20,
          status: oppStatus,
          stage: oppStatus === 'won' ? '已成交' : oppStatus === 'lost' ? '已流失' : ['初步接触', '需求确认', '方案报价', '商务谈判'][Math.floor(Math.random() * 4)],
          expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
          actualCloseDate: ['won', 'lost'].includes(oppStatus) ? expectedCloseDate.toISOString().split('T')[0] : undefined,
          assignee: lead.assignee || '销售员1',
          createdAt: convertedDate.toISOString(),
          updatedAt: convertedDate.toISOString(),
        };

        opportunities.push(opportunity);

        if (oppStatus === 'won') {
          customer.totalRevenue += value;
        }
      }
    }

    if (Math.random() > 0.4) {
      const recordCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < recordCount; j++) {
        const recordDaysAgo = Math.floor(Math.random() * daysAgo);
        const recordDate = new Date(now.getTime() - recordDaysAgo * 24 * 60 * 60 * 1000);

        const record: FollowUpRecord = {
          id: uuidv4(),
          leadId,
          type: followUpTypes[Math.floor(Math.random() * followUpTypes.length)],
          content: ['电话沟通需求', '发送产品资料', '安排产品演示', '讨论合作方案', '确认报价细节'][Math.floor(Math.random() * 5)],
          date: recordDate.toISOString(),
          nextFollowUpDate: Math.random() > 0.5 ? new Date(recordDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          duration: Math.floor(Math.random() * 60) + 15,
          userId: 'user' + (Math.floor(Math.random() * 5) + 1),
          userName: '销售员' + (Math.floor(Math.random() * 5) + 1),
        };

        followUpRecords.push(record);

        const recordItem: FollowUpRecordItem = {
          id: record.id,
          type: record.type,
          content: record.content,
          date: record.date,
          nextFollowUpDate: record.nextFollowUpDate,
          duration: record.duration,
          userId: record.userId,
          userName: record.userName,
        };

        lead.followUpRecords.unshift(recordItem);
      }
    }
  }

  return { leads, customers, opportunities, followUpRecords };
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  useEffect(() => {
    const mockData = generateMockData();
    dispatch({ type: 'SET_DATA', payload: mockData });
  }, []);

  const addOpportunity = (customerId: string, data: { name: string; expectedAmount: number; expectedCloseDate: string }) => {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return;

    const newOpportunity: Opportunity = {
      id: uuidv4(),
      leadId: customer.leadId,
      customerId,
      title: data.name,
      description: '',
      value: data.expectedAmount,
      probability: 10,
      status: 'open',
      stage: '初步接触',
      expectedCloseDate: data.expectedCloseDate,
      assignee: '当前用户',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_OPPORTUNITY', payload: newOpportunity });
  };

  const closeOpportunity = (opportunityId: string, status: 'won' | 'lost') => {
    dispatch({
      type: 'CLOSE_OPPORTUNITY',
      payload: { id: opportunityId, status, actualCloseDate: new Date().toISOString().split('T')[0] },
    });
  };

  const getCustomerConversionRate = (customerId: string): number => {
    const customerOpps = state.opportunities.filter((o) => o.customerId === customerId);
    if (customerOpps.length === 0) return 0;
    const closedOpps = customerOpps.filter((o) => o.status === 'won' || o.status === 'lost');
    if (closedOpps.length === 0) return 0;
    const wonOpps = customerOpps.filter((o) => o.status === 'won');
    return Math.round((wonOpps.length / closedOpps.length) * 100);
  };

  const getDailyLeadsLast30Days = (): Array<{ date: string; leads: number; isToday: boolean }> => {
    const result: Array<{ date: string; leads: number; isToday: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = state.leads.filter((lead) => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= date && leadDate < nextDate;
      }).length;

      result.push({
        date: dateStr,
        leads: count,
        isToday: i === 0,
      });
    }

    return result;
  };

  const getLeadSourceDistribution = (): Array<{ source: string; count: number; percentage: number }> => {
    const sourceMap = new Map<string, number>();
    state.leads.forEach((lead) => {
      const displayName = getSourceDisplayName(lead.source);
      sourceMap.set(displayName, (sourceMap.get(displayName) || 0) + 1);
    });

    const total = state.leads.length;
    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getSourceDisplayName = (source: LeadSource): string => {
    const names: Record<LeadSource, string> = {
      '线上广告': '线上广告',
      '线下展会': '线下展会',
      '朋友推荐': '朋友推荐',
      '主动搜索': '主动搜索',
      website: '官网',
      referral: '推荐',
      social_media: '社交媒体',
      email_campaign: '邮件营销',
      cold_call: '电话拓展',
      trade_show: '展会',
      advertisement: '广告',
      direct_mail: '直邮',
    };
    return names[source] || source;
  };

  const getTotalLeads = (): number => state.leads.length;

  const getOverallConversionRate = (): number => {
    if (state.leads.length === 0) return 0;
    const converted = state.leads.filter((l) => l.status === 'converted' || l.status === '已成交').length;
    return Math.round((converted / state.leads.length) * 100);
  };

  const getTotalWonAmount = (): number => {
    return state.opportunities.filter((o) => o.status === 'won').reduce((sum, o) => sum + o.value, 0);
  };

  return (
    <CRMContext.Provider
      value={{
        ...state,
        addOpportunity,
        closeOpportunity,
        getCustomerConversionRate,
        getDailyLeadsLast30Days,
        getLeadSourceDistribution,
        getTotalLeads,
        getOverallConversionRate,
        getTotalWonAmount,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}

export type { Lead, Customer, Opportunity, FollowUpRecord, FollowUpRecordItem, LeadSource, LeadStatus, OpportunityStatus, FollowUpType };
