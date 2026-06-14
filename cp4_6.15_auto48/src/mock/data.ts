import { v4 as uuidv4 } from 'uuid';
import type {
  Lead,
  LeadSource,
  LeadStatus,
  FollowUpRecord,
  FollowUpType,
  Customer,
  Opportunity,
  OpportunityStatus,
  FollowUpRecordItem,
} from '../types';

const firstNames = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '陈明', '刘华', '黄强', '杨伟', '赵敏', '周杰', '吴涛', '郑浩',
  '孙磊', '马超', '朱婷', '胡歌', '郭靖', '黄蓉', '杨过', '小龙女',
  '张无忌', '周芷若', '赵敏', '杨逍', '范遥', '韦一笑', '殷天正', '谢逊',
  'Anna', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Leo', 'Mary', 'Nick', 'Olivia', 'Peter',
];

const lastNames = [
  '科技有限公司', '实业集团', '贸易有限公司', '信息技术有限公司',
  '文化传媒有限公司', '电子商务有限公司', '咨询服务有限公司',
  '网络科技有限公司', '软件开发有限公司', '数据服务有限公司',
  '智能科技有限公司', '创新科技有限公司', '数字科技有限公司',
  '云计算有限公司', '人工智能有限公司', '物联网有限公司',
  'Tech', 'Corp', 'Ltd', 'Inc', 'Group', 'Solutions', 'Systems', 'Services',
];

const industries = [
  '互联网', '金融', '教育', '医疗健康', '制造业', '零售',
  '房地产', '物流', '能源', '电信', '媒体', '广告',
  '咨询', '法律', '会计', '人力资源', '政府机构', '非营利组织',
];

const companySizes = ['1-10人', '11-50人', '51-200人', '201-500人', '501-1000人', '1000人以上'];

const cities = [
  '北京市朝阳区', '上海市浦东新区', '广州市天河区', '深圳市南山区',
  '杭州市西湖区', '成都市高新区', '武汉市洪山区', '南京市鼓楼区',
  '西安市雁塔区', '重庆市渝北区', '苏州市工业园区', '青岛市市南区',
  '大连市中山区', '厦门市思明区', '宁波市鄞州区', '无锡市滨湖区',
];

const assignees = [
  '张明', '李华', '王芳', '刘强', '陈静', '赵伟', '孙丽', '周杰',
];

const leadSources: LeadSource[] = [
  '线上广告', '线下展会', '朋友推荐', '主动搜索',
];

const leadStatuses: LeadStatus[] = [
  '待跟进', '跟进中', '已成交', '已流失',
];

const followUpTypes: FollowUpType[] = [
  'call', 'email', 'meeting', 'presentation', 'demo', 'quote', 'contract', 'note',
];

const opportunityStatuses: OpportunityStatus[] = [
  'open', 'in_progress', 'proposal_sent', 'negotiation', 'won', 'lost',
];

const opportunityStages = [
  '需求分析', '方案设计', '报价阶段', '商务谈判', '合同签署', '项目交付',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatePhone(): string {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = randomItem(prefixes);
  const suffix = Array.from({ length: 8 }, () => randomInt(0, 9)).join('');
  return `${prefix}${suffix}`;
}

function generateEmail(name: string, company: string): string {
  const domains = ['gmail.com', 'qq.com', '163.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  const namePart = name.toLowerCase().replace(/\s+/g, '.');
  const companyPart = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${namePart}@${companyPart || randomItem(domains)}`;
}

export function generateLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const company = `${firstName}${lastName}`;
    const createdAt = formatDate(randomDate(sixMonthsAgo, now));

    const statusWeights = [35, 30, 20, 15];
    let random = Math.random() * 100;
    let statusIndex = 0;
    for (let j = 0; j < statusWeights.length; j++) {
      random -= statusWeights[j];
      if (random <= 0) {
        statusIndex = j;
        break;
      }
    }

    const sourceWeights = [35, 25, 25, 15];
    random = Math.random() * 100;
    let sourceIndex = 0;
    for (let j = 0; j < sourceWeights.length; j++) {
      random -= sourceWeights[j];
      if (random <= 0) {
        sourceIndex = j;
        break;
      }
    }

    const followUpCount = randomInt(0, 3);
    const followUpRecords: FollowUpRecordItem[] = [];
    for (let k = 0; k < followUpCount; k++) {
      const followUpDate = randomDate(new Date(createdAt), now);
      followUpRecords.push({
        id: uuidv4(),
        type: randomItem(followUpTypes),
        content: '跟进记录内容',
        date: formatDate(followUpDate),
        duration: randomInt(15, 120),
        userId: uuidv4(),
        userName: randomItem(assignees),
      });
    }

    leads.push({
      id: uuidv4(),
      companyName: company,
      contactPerson: firstName,
      phone: generatePhone(),
      email: generateEmail(firstName, company),
      company,
      source: leadSources[sourceIndex],
      status: leadStatuses[statusIndex],
      score: randomInt(10, 100),
      assignee: randomItem(assignees),
      notes: `潜在客户来自${leadSources[sourceIndex]}，对我们的产品有浓厚兴趣。`,
      createdAt,
      updatedAt: createdAt,
      followUpRecords,
    });
  }

  return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateFollowUpRecords(leads: Lead[], count: number): FollowUpRecord[] {
  const records: FollowUpRecord[] = [];
  const convertedLeads = leads.filter(l => l.status === '已成交');
  const activeLeads = leads.filter(l => l.status !== '已成交' && l.status !== '已流失');
  const allRelevantLeads = [...convertedLeads.slice(0, 12), ...activeLeads.slice(0, 30)];

  const followUpContents: Record<FollowUpType, string[]> = {
    call: [
      '初次电话沟通，客户表示对产品感兴趣，约定下周发送详细资料',
      '电话回访，询问客户对方案的意见，客户希望调整报价',
      '电话确认会议时间，客户表示下周三下午有空',
      '客户主动来电咨询产品功能细节，已详细解答',
    ],
    email: [
      '发送产品介绍邮件，包含功能列表和价格方案',
      '回复客户咨询邮件，附上技术规格文档',
      '发送会议纪要邮件，确认下次跟进时间',
      '节日问候邮件，附带最新产品优惠信息',
    ],
    meeting: [
      '客户拜访会议，详细演示产品功能，客户反馈良好',
      '季度复盘会议，讨论项目进度和下一阶段计划',
      '需求沟通会议，客户详细描述业务场景和痛点',
      '项目启动会议，确定项目范围和时间节点',
    ],
    presentation: [
      '产品演示会议，客户方5人参会，对数据分析功能很感兴趣',
      '线上产品推介会，向客户团队展示完整解决方案',
      '竞品对比演示，突出我们产品的差异化优势',
    ],
    demo: [
      '现场产品演示，客户技术团队参与，对API接口很关注',
      '定制化功能演示，根据客户需求展示特定场景',
      '移动端功能演示，客户对移动端体验表示满意',
    ],
    quote: [
      '发送正式报价单，包含标准版和企业版两个方案',
      '根据客户反馈调整报价，增加了折扣优惠',
      '客户要求拆分报价，已按模块重新计算并发送',
    ],
    contract: [
      '发送标准合同模板，客户法务正在审核',
      '合同条款沟通，就付款方式和服务内容达成一致',
      '合同签署完成，正式成为我们的客户',
    ],
    note: [
      '客户提到预算有限，需要在下季度重新评估',
      '客户公司正在进行组织结构调整，项目暂时搁置',
      '客户反馈竞争对手给出更低价格，需要重新评估报价策略',
      '客户对售后服务有特殊要求，需要协调售后团队',
    ],
  };

  for (let i = 0; i < count; i++) {
    const lead = randomItem(allRelevantLeads);
    const type = randomItem(followUpTypes);
    const content = randomItem(followUpContents[type]);
    const leadCreatedAt = new Date(lead.createdAt);
    const now = new Date();
    const date = formatDate(randomDate(leadCreatedAt, now));
    const hasNextFollowUp = Math.random() > 0.5 && lead.status !== '已成交' && lead.status !== '已流失';

    records.push({
      id: uuidv4(),
      leadId: lead.id,
      type,
      content,
      date,
      nextFollowUpDate: hasNextFollowUp
        ? formatDate(randomDate(new Date(date), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)))
        : undefined,
      duration: randomInt(15, 120),
      userId: uuidv4(),
      userName: lead.assignee || randomItem(assignees),
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateCustomers(leads: Lead[], count: number): Customer[] {
  const convertedLeads = leads.filter(l => l.status === '已成交');
  const selectedLeads = convertedLeads.slice(0, count);

  return selectedLeads.map((lead) => {
    const convertedDate = new Date(lead.createdAt);

    return {
      id: uuidv4(),
      leadId: lead.id,
      name: lead.contactPerson,
      email: lead.email || generateEmail(lead.contactPerson, lead.companyName),
      phone: lead.phone,
      company: lead.companyName,
      industry: randomItem(industries),
      companySize: randomItem(companySizes),
      address: randomItem(cities),
      convertedDate: formatDate(convertedDate),
      totalRevenue: randomInt(10000, 500000),
      activeContracts: randomInt(1, 5),
    };
  });
}

export function generateOpportunities(
  leads: Lead[],
  customers: Customer[],
  count: number
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const opportunityTitles = [
    '企业版软件采购', '年度服务续约', '数据分析平台建设', 'CRM系统升级',
    '云服务迁移项目', '移动端应用开发', '数据安全咨询服务', '系统集成项目',
    'AI解决方案部署', '数字化转型咨询', '员工培训计划', '技术支持服务包',
    '定制化功能开发', '多站点部署项目', '性能优化服务', '安全审计服务',
  ];

  const statusWeights = [20, 25, 18, 15, 15, 7];

  for (let i = 0; i < count; i++) {
    const useCustomer = i < Math.floor(count * 0.6);
    const customer = useCustomer ? customers[i % customers.length] : undefined;
    const lead = customer
      ? leads.find(l => l.id === customer.leadId)!
      : leads.filter(l => l.status !== '已成交' && l.status !== '已流失')[i % leads.length];

    const createdAt = randomDate(sixMonthsAgo, now);
    const expectedCloseDate = randomDate(
      createdAt,
      new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    );

    let random = Math.random() * 100;
    let statusIndex = 0;
    for (let j = 0; j < statusWeights.length; j++) {
      random -= statusWeights[j];
      if (random <= 0) {
        statusIndex = j;
        break;
      }
    }

    const status = opportunityStatuses[statusIndex];
    const isWon = status === 'won';
    const isLost = status === 'lost';

    const probabilityByStatus: Record<OpportunityStatus, number> = {
      open: randomInt(10, 30),
      in_progress: randomInt(30, 50),
      proposal_sent: randomInt(50, 70),
      negotiation: randomInt(70, 90),
      won: 100,
      lost: 0,
    };

    opportunities.push({
      id: uuidv4(),
      leadId: lead.id,
      customerId: customer?.id,
      title: randomItem(opportunityTitles),
      description: `${lead.companyName}的${opportunityStages[statusIndex]}阶段项目，预计价值较高。`,
      value: randomInt(5000, 200000),
      probability: probabilityByStatus[status],
      status,
      stage: opportunityStages[Math.min(statusIndex, opportunityStages.length - 1)],
      expectedCloseDate: formatDate(expectedCloseDate),
      actualCloseDate: isWon || isLost
        ? formatDate(randomDate(createdAt, now))
        : undefined,
      assignee: lead.assignee || randomItem(assignees),
      createdAt: formatDate(createdAt),
      updatedAt: isWon || isLost
        ? formatDate(createdAt)
        : formatDate(randomDate(createdAt, now)),
    });
  }

  return opportunities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockData() {
  const leads = generateLeads(100);
  const followUpRecords = generateFollowUpRecords(leads, 40);
  const customers = generateCustomers(leads, 12);
  const opportunities = generateOpportunities(leads, customers, 25);

  return {
    leads,
    followUpRecords,
    customers,
    opportunities,
  };
}
