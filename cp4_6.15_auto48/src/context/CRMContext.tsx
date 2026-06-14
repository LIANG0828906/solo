import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Lead,
  Customer,
  Opportunity,
  FollowUpRecord,
  LeadSource,
  LeadStatus,
  FollowUpMethod,
  OpportunityStatus,
  DailyLeadData,
  SourceDistribution,
  DashboardMetrics,
} from '@/types';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CRMState {
  leads: Lead[];
  customers: Customer[];
  opportunities: Opportunity[];
}

interface CRMContextType extends CRMState {
  addLead: (data: {
    companyName: string;
    contactPerson: string;
    phone: string;
    source: LeadSource;
    status: LeadStatus;
  }) => void;
  updateLeadStatus: (leadId: string, status: LeadStatus) => void;
  getLeadById: (id: string) => Lead | undefined;
  addFollowUpRecord: (
    leadId: string,
    data: {
      method: FollowUpMethod;
      summary: string;
      nextReminderDate?: string;
    }
  ) => void;
  convertToCustomer: (leadId: string) => Customer | undefined;
  addOpportunity: (
    customerId: string,
    data: { name: string; expectedAmount: number; expectedCloseDate: string }
  ) => void;
  closeOpportunity: (opportunityId: string, status: OpportunityStatus) => void;
  getCustomerConversionRate: (customerId: string) => number;
  getDashboardMetrics: () => DashboardMetrics;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

type CRMAction =
  | { type: 'SET_DATA'; payload: CRMState }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'UPDATE_LEAD_STATUS'; payload: { id: string; status: LeadStatus } }
  | { type: 'ADD_FOLLOW_UP'; payload: { leadId: string; record: FollowUpRecord } }
  | { type: 'CONVERT_TO_CUSTOMER'; payload: { lead: Lead; customer: Customer } }
  | { type: 'ADD_OPPORTUNITY'; payload: Opportunity }
  | { type: 'CLOSE_OPPORTUNITY'; payload: { id: string; status: OpportunityStatus } };

const initialState: CRMState = {
  leads: [],
  customers: [],
  opportunities: [],
};

function crmReducer(state: CRMState, action: CRMAction): CRMState {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;
    case 'ADD_LEAD':
      return {
        ...state,
        leads: [action.payload, ...state.leads],
      };
    case 'UPDATE_LEAD_STATUS':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.id
            ? { ...lead, status: action.payload.status }
            : lead
        ),
      };
    case 'ADD_FOLLOW_UP':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.leadId
            ? {
                ...lead,
                followUpRecords: [action.payload.record, ...lead.followUpRecords],
              }
            : lead
        ),
      };
    case 'CONVERT_TO_CUSTOMER':
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.payload.lead.id
            ? { ...lead, status: '已转化' }
            : lead
        ),
        customers: [action.payload.customer, ...state.customers],
      };
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
            ? {
                ...opp,
                status: action.payload.status,
                progress: action.payload.status === '已赢单' ? 100 : 0,
              }
            : opp
        ),
      };
    default:
      return state;
  }
}

function generateMockData(): CRMState {
  const leadSources: LeadSource[] = ['线上广告', '线下展会', '朋友推荐', '主动搜索'];
  const leadStatuses: LeadStatus[] = ['新建', '跟进中', '已转化', '已流失'];
  const followUpMethods: FollowUpMethod[] = ['电话', '微信', '邮件', '面谈'];
  const opportunityStatuses: OpportunityStatus[] = ['进行中', '已赢单', '已输单'];

  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
  const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇'];
  const companies = ['科技有限公司', '信息技术有限公司', '网络科技有限公司', '电子商务有限公司', '数据服务有限公司', '智能科技有限公司'];

  const leads: Lead[] = [];
  const customers: Customer[] = [];
  const opportunities: Opportunity[] = [];

  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const leadId = uuidv4();
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const contactPerson = firstName + lastName;
    const companyName = lastName + companies[Math.floor(Math.random() * companies.length)];

    const followUpRecords: FollowUpRecord[] = [];
    if (Math.random() > 0.4) {
      const recordCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < recordCount; j++) {
        const recordDaysAgo = Math.floor(Math.random() * Math.max(daysAgo, 1));
        const recordDate = new Date(now.getTime() - recordDaysAgo * 24 * 60 * 60 * 1000);
        const isToday = recordDaysAgo === 0;

        followUpRecords.push({
          id: uuidv4(),
          leadId,
          method: followUpMethods[Math.floor(Math.random() * followUpMethods.length)],
          summary: ['电话沟通需求', '发送产品资料', '安排产品演示', '讨论合作方案', '确认报价细节'][Math.floor(Math.random() * 5)],
          date: formatLocalDate(recordDate),
          nextReminderDate: isToday ? formatLocalDate(recordDate) : undefined,
        });
      }
    }

    const lead: Lead = {
      id: leadId,
      companyName,
      contactPerson,
      phone: `1${Math.floor(Math.random() * 9 + 3)}${Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('')}`,
      source: leadSources[Math.floor(Math.random() * leadSources.length)],
      status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
      createdAt: formatLocalDate(createdAt),
      followUpRecords,
    };

    leads.push(lead);

    if (lead.status === '已转化') {
      const convertedDaysAgo = Math.floor(Math.random() * 30);
      const convertedAt = new Date(createdAt.getTime() + convertedDaysAgo * 24 * 60 * 60 * 1000);
      const customerId = uuidv4();

      const customer: Customer = {
        id: customerId,
        leadId,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        phone: lead.phone,
        convertedAt: formatLocalDate(convertedAt),
        conversionRate: 0,
      };

      customers.push(customer);

      const opportunityCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < opportunityCount; j++) {
        const oppId = uuidv4();
        const oppStatus = opportunityStatuses[Math.floor(Math.random() * opportunityStatuses.length)];
        const expectedCloseDate = new Date(now.getTime() + (Math.floor(Math.random() * 60) - 15) * 24 * 60 * 60 * 1000);
        const expectedAmount = (Math.floor(Math.random() * 50) + 5) * 1000;

        const opportunity: Opportunity = {
          id: oppId,
          customerId,
          name: `${lead.companyName} - 合作项目 ${j + 1}`,
          expectedAmount,
          expectedCloseDate: formatLocalDate(expectedCloseDate),
          progress: oppStatus === '已赢单' ? 100 : oppStatus === '已输单' ? 0 : Math.floor(Math.random() * 80) + 10,
          status: oppStatus,
        };

        opportunities.push(opportunity);
      }

      const closedOpps = opportunities.filter(
        (o) => o.customerId === customerId && o.status !== '进行中'
      );
      if (closedOpps.length > 0) {
        const wonOpps = closedOpps.filter((o) => o.status === '已赢单');
        customer.conversionRate = Math.round((wonOpps.length / closedOpps.length) * 100);
      }
    }
  }

  return { leads, customers, opportunities };
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  useEffect(() => {
    const mockData = generateMockData();
    dispatch({ type: 'SET_DATA', payload: mockData });
  }, []);

  const addLead: CRMContextType['addLead'] = (data) => {
    const newLead: Lead = {
      id: uuidv4(),
      ...data,
      createdAt: formatLocalDate(new Date()),
      followUpRecords: [],
    };
    dispatch({ type: 'ADD_LEAD', payload: newLead });
  };

  const updateLeadStatus: CRMContextType['updateLeadStatus'] = (leadId, status) => {
    dispatch({ type: 'UPDATE_LEAD_STATUS', payload: { id: leadId, status } });
  };

  const getLeadById: CRMContextType['getLeadById'] = (id) => {
    return state.leads.find((lead) => lead.id === id);
  };

  const addFollowUpRecord: CRMContextType['addFollowUpRecord'] = (leadId, data) => {
    const record: FollowUpRecord = {
      id: uuidv4(),
      leadId,
      ...data,
      date: formatLocalDate(new Date()),
    };
    dispatch({ type: 'ADD_FOLLOW_UP', payload: { leadId, record } });
  };

  const convertToCustomer: CRMContextType['convertToCustomer'] = (leadId) => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return undefined;

    const customer: Customer = {
      id: uuidv4(),
      leadId,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      convertedAt: formatLocalDate(new Date()),
      conversionRate: 0,
    };

    dispatch({ type: 'CONVERT_TO_CUSTOMER', payload: { lead, customer } });
    return customer;
  };

  const addOpportunity: CRMContextType['addOpportunity'] = (customerId, data) => {
    const newOpportunity: Opportunity = {
      id: uuidv4(),
      customerId,
      ...data,
      progress: 10,
      status: '进行中',
    };
    dispatch({ type: 'ADD_OPPORTUNITY', payload: newOpportunity });
  };

  const closeOpportunity: CRMContextType['closeOpportunity'] = (opportunityId, status) => {
    dispatch({ type: 'CLOSE_OPPORTUNITY', payload: { id: opportunityId, status } });
  };

  const getCustomerConversionRate: CRMContextType['getCustomerConversionRate'] = (customerId) => {
    const customerOpps = state.opportunities.filter((o) => o.customerId === customerId);
    if (customerOpps.length === 0) return 0;
    const closedOpps = customerOpps.filter((o) => o.status !== '进行中');
    if (closedOpps.length === 0) return 0;
    const wonOpps = closedOpps.filter((o) => o.status === '已赢单');
    return Math.round((wonOpps.length / closedOpps.length) * 100);
  };

  const getDailyLeadsLast30Days = (): DailyLeadData[] => {
    const result: DailyLeadData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateCounts = new Map<string, number>();
    state.leads.forEach((lead) => {
      const dateStr = lead.createdAt;
      dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    });

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = formatLocalDate(prevDate);

      result.push({
        date: dateStr,
        leads: dateCounts.get(dateStr) || 0,
        isToday: i === 0,
        previousDayLeads: dateCounts.get(prevDateStr) || 0,
      });
    }

    return result;
  };

  const getSourceDistribution = (): SourceDistribution[] => {
    const counts: Record<LeadSource, number> = {
      '线上广告': 0,
      '线下展会': 0,
      '朋友推荐': 0,
      '主动搜索': 0,
    };

    state.leads.forEach((lead) => {
      counts[lead.source]++;
    });

    const total = state.leads.length;
    const sources: LeadSource[] = ['线上广告', '线下展会', '朋友推荐', '主动搜索'];

    return sources.map((source) => ({
      source,
      count: counts[source],
      percentage: total > 0 ? Math.round((counts[source] / total) * 100) : 0,
    }));
  };

  const getTotalWonAmount = (): number => {
    return state.opportunities
      .filter((o) => o.status === '已赢单')
      .reduce((sum, o) => sum + o.expectedAmount, 0);
  };

  const getOverallConversionRate = (): number => {
    if (state.leads.length === 0) return 0;
    const converted = state.leads.filter((l) => l.status === '已转化').length;
    return Math.round((converted / state.leads.length) * 100);
  };

  const getDashboardMetrics: CRMContextType['getDashboardMetrics'] = () => {
    return {
      totalLeads: state.leads.length,
      conversionRate: getOverallConversionRate(),
      totalWonAmount: getTotalWonAmount(),
      dailyLeadsLast30Days: getDailyLeadsLast30Days(),
      sourceDistribution: getSourceDistribution(),
    };
  };

  const contextValue = useMemo(
    () => ({
      ...state,
      addLead,
      updateLeadStatus,
      getLeadById,
      addFollowUpRecord,
      convertToCustomer,
      addOpportunity,
      closeOpportunity,
      getCustomerConversionRate,
      getDashboardMetrics,
    }),
    [state]
  );

  return (
    <CRMContext.Provider value={contextValue}>
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

export type {
  Lead,
  Customer,
  Opportunity,
  FollowUpRecord,
  LeadSource,
  LeadStatus,
  FollowUpMethod,
  OpportunityStatus,
  DailyLeadData,
  SourceDistribution,
  DashboardMetrics,
};
