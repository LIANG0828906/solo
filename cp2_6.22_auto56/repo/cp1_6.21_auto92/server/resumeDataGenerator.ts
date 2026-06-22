export interface ResumeInput {
  name: string;
  phone: string;
  email: string;
  targetPosition: string;
  templateId: string;
}

export interface SectionItem {
  field: string;
  value: string;
  style?: Record<string, string>;
}

export interface ResumeSection {
  title: string;
  items: SectionItem[];
  style: Record<string, string>;
}

export interface TemplateMeta {
  fieldLayout: string[];
  fontPriorityCN: string[];
  fontPriorityEN: string[];
  sectionTitleStyle: Record<string, Record<string, string>>;
}

export interface ResumeData {
  metadata: {
    templateId: string;
    templateMeta: TemplateMeta;
  };
  sections: ResumeSection[];
}

const TEMPLATE_CONFIGS: Record<string, { titleColor: string; fontFamily: string; accentColor: string }> = {
  business: { titleColor: '#1E293B', fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif', accentColor: '#3B82F6' },
  creative: { titleColor: '#BE123C', fontFamily: '"Noto Serif SC", "STSong", serif', accentColor: '#E11D48' },
  tech:     { titleColor: '#059669', fontFamily: '"Fira Code", "Source Code Pro", "Noto Sans SC", monospace', accentColor: '#10B981' },
};

const POSITION_SKILL_MAP: Record<string, string[]> = {
  '前端工程师':   ['HTML5/CSS3', 'JavaScript/TypeScript', 'React/Vue', 'Webpack/Vite', '响应式设计', '性能优化'],
  '后端工程师':   ['Java/Go/Python', 'Spring Boot/Gin', 'MySQL/PostgreSQL', 'Redis', '微服务架构', 'RESTful API设计'],
  '产品经理':     ['需求分析', '用户调研', '原型设计(Axure/Figma)', '数据分析', '项目管理', '跨部门协作'],
  'UI设计师':     ['Figma/Sketch', '视觉设计', '交互设计', '设计系统', '用户研究', '动效设计'],
  '数据分析师':   ['Python/R', 'SQL', 'Tableau/PowerBI', '统计分析', '数据建模', 'A/B测试'],
  '测试工程师':   ['自动化测试', 'Selenium/Playwright', '性能测试', '接口测试', '测试用例设计', 'CI/CD'],
  '运维工程师':   ['Linux', 'Docker/K8s', 'CI/CD', '监控告警', 'Shell/Python', '云服务(AWS/阿里云)'],
  '项目经理':     ['敏捷管理', '风险管控', '资源协调', '进度跟踪', '干系人管理', 'PMP/PRINCE2'],
};

const DEFAULT_SKILLS = ['团队协作', '沟通表达', '问题解决', '时间管理', '持续学习', '文档撰写'];

function getSkillsForPosition(position: string): string[] {
  for (const [key, skills] of Object.entries(POSITION_SKILL_MAP)) {
    if (position.includes(key) || key.includes(position)) {
      return skills;
    }
  }
  return DEFAULT_SKILLS;
}

function buildTemplateMeta(templateId: string): TemplateMeta {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.business;
  return {
    fieldLayout: ['personalInfo', 'education', 'workExperience', 'skills', 'selfEvaluation'],
    fontPriorityCN: ['Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'SimHei'],
    fontPriorityEN: ['Inter', 'Roboto', 'Helvetica Neue', 'Arial'],
    sectionTitleStyle: {
      personalInfo:    { color: config.titleColor, fontSize: '18px', fontWeight: '700', fontFamily: config.fontFamily, borderBottom: `2px solid ${config.accentColor}` },
      education:       { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily, borderBottom: `1px solid ${config.accentColor}` },
      workExperience:  { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily, borderBottom: `1px solid ${config.accentColor}` },
      skills:          { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily, borderBottom: `1px solid ${config.accentColor}` },
      selfEvaluation:  { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily, borderBottom: `1px solid ${config.accentColor}` },
    },
  };
}

function buildPersonalInfo(input: ResumeInput, config: typeof TEMPLATE_CONFIGS.business): ResumeSection {
  return {
    title: '个人信息',
    items: [
      { field: 'name', value: input.name },
      { field: 'phone', value: input.phone },
      { field: 'email', value: input.email },
      { field: 'targetPosition', value: input.targetPosition },
    ],
    style: { color: config.titleColor, fontSize: '18px', fontWeight: '700', fontFamily: config.fontFamily },
  };
}

function buildEducation(input: ResumeInput, config: typeof TEMPLATE_CONFIGS.business): ResumeSection {
  const majorMap: Record<string, string> = {
    '前端工程师': '计算机科学与技术',
    '后端工程师': '计算机科学与技术',
    '产品经理': '信息管理与信息系统',
    'UI设计师': '视觉传达设计',
    '数据分析师': '统计学',
    '测试工程师': '软件工程',
    '运维工程师': '计算机科学与技术',
    '项目经理': '管理科学与工程',
  };
  const major = majorMap[input.targetPosition] || '相关领域专业';
  return {
    title: '教育背景',
    items: [
      {
        field: 'education1',
        value: `${major} · 硕士 | XX大学 | 2019.09 - 2022.06`,
        style: { fontWeight: '600' },
      },
      {
        field: 'education1Detail',
        value: `GPA: 3.8/4.0 | 核心课程：高级软件工程、数据结构与算法、${major}前沿专题`,
      },
      {
        field: 'education2',
        value: `${major} · 学士 | XX大学 | 2015.09 - 2019.06`,
        style: { fontWeight: '600' },
      },
    ],
    style: { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily },
  };
}

function buildWorkExperience(input: ResumeInput, config: typeof TEMPLATE_CONFIGS.business): ResumeSection {
  const experienceMap: Record<string, { title: string; company: string; achievements: string[] }[]> = {
    '前端工程师': [
      { title: '高级前端开发工程师', company: 'XX科技有限公司', achievements: [
        '主导公司核心产品前端架构升级，采用React+TypeScript技术栈，页面加载速度提升40%',
        '推动前端工程化建设，搭建组件库和CI/CD流水线，团队开发效率提升35%',
      ]},
      { title: '前端开发工程师', company: 'XX互联网公司', achievements: [
        '独立完成3个ToB项目的前端开发，客户满意度达95%以上',
        '优化首屏渲染性能，FCP从3.2s降至1.1s，用户留存率提升18%',
      ]},
    ],
    '后端工程师': [
      { title: '高级后端开发工程师', company: 'XX科技有限公司', achievements: [
        '主导微服务架构改造，系统可用性从99.5%提升至99.99%，日均处理请求量达千万级',
        '设计并实现分布式缓存方案，核心接口响应时间降低60%',
      ]},
      { title: '后端开发工程师', company: 'XX互联网公司', achievements: [
        '独立完成订单系统重构，支撑日均50万订单处理，零重大故障运行12个月',
        '优化数据库查询性能，慢查询数量减少80%，系统吞吐量提升2倍',
      ]},
    ],
  };
  const defaultExperience = [
    { title: '高级专员', company: 'XX科技有限公司', achievements: [
      `主导${input.targetPosition}相关核心项目，推动业务指标增长30%`,
      '优化工作流程，提升团队协作效率，项目交付周期缩短25%',
    ]},
    { title: '专员', company: 'XX互联网公司', achievements: [
      `独立完成${input.targetPosition}领域3个重点项目的落地执行`,
      '制定标准化操作流程，培训新成员5人，团队整体产出提升20%',
    ]},
  ];
  const experiences = experienceMap[input.targetPosition] || defaultExperience;
  const items: SectionItem[] = [];
  experiences.forEach((exp, idx) => {
    items.push({ field: `work${idx}_title`, value: `${exp.title} | ${exp.company} | 2022.03 - 至今`, style: { fontWeight: '600' } });
    exp.achievements.forEach((a, ai) => {
      items.push({ field: `work${idx}_achieve${ai}`, value: `• ${a}` });
    });
  });
  return {
    title: '工作经历',
    items,
    style: { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily },
  };
}

function buildSkills(input: ResumeInput, config: typeof TEMPLATE_CONFIGS.business): ResumeSection {
  const skills = getSkillsForPosition(input.targetPosition);
  return {
    title: '专业技能',
    items: skills.map((skill, idx) => ({
      field: `skill${idx}`,
      value: skill,
    })),
    style: { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily },
  };
}

function buildSelfEvaluation(input: ResumeInput, config: typeof TEMPLATE_CONFIGS.business): ResumeSection {
  return {
    title: '自我评价',
    items: [
      {
        field: 'selfEval',
        value: `${input.name}，具备扎实的${input.targetPosition}领域专业能力，注重结果导向与持续优化。善于跨团队沟通协作，能够在高压环境下高效交付优质成果。对新技术和行业趋势保持敏锐洞察，持续推动个人与团队成长。`,
      },
    ],
    style: { color: config.titleColor, fontSize: '16px', fontWeight: '600', fontFamily: config.fontFamily },
  };
}

export function generateResumeData(input: ResumeInput): ResumeData {
  const config = TEMPLATE_CONFIGS[input.templateId] || TEMPLATE_CONFIGS.business;
  return {
    metadata: {
      templateId: input.templateId,
      templateMeta: buildTemplateMeta(input.templateId),
    },
    sections: [
      buildPersonalInfo(input, config),
      buildEducation(input, config),
      buildWorkExperience(input, config),
      buildSkills(input, config),
      buildSelfEvaluation(input, config),
    ],
  };
}
