import type { JobRole, JobBenchmark, SkillScores } from '../types';

const FRONTEND_BASELINE: SkillScores = {
  前端: 90,
  后端: 40,
  数据库: 45,
  设计: 60,
  项目管理: 50,
  沟通: 65
};

const DATA_BASELINE: SkillScores = {
  前端: 45,
  后端: 85,
  数据库: 92,
  设计: 35,
  项目管理: 55,
  沟通: 60
};

const PM_BASELINE: SkillScores = {
  前端: 55,
  后端: 55,
  数据库: 50,
  设计: 75,
  项目管理: 95,
  沟通: 90
};

export const JOB_TEMPLATES: Record<JobRole, JobBenchmark> = {
  前端工程师: {
    baseline: FRONTEND_BASELINE,
    description: '负责Web前端页面和交互开发，要求精通前端技术栈，具备良好的视觉还原和性能优化能力',
    keywords: [
      'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue',
      'Webpack', 'Vite', 'Sass', 'Less', 'Tailwind', 'Ant Design',
      'Redux', 'Pinia', 'Zustand', 'Canvas', 'ECharts',
      '响应式', '移动端适配', '小程序', '性能优化',
      '前端工程化', '组件化', 'ES6', 'Hooks',
      '浏览器兼容性', 'Web安全', 'Jest', 'Vitest',
      'Next.js', 'SSR', 'Electron', '跨端'
    ]
  },
  数据工程师: {
    baseline: DATA_BASELINE,
    description: '负责数据采集、清洗、存储和分析，要求精通数据库、数据处理和分布式架构',
    keywords: [
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'SQL', 'NoSQL', 'TiDB', 'ClickHouse', '索引', '查询优化',
      '分库分表', '主从复制', '数据仓库', 'OLAP', 'OLTP',
      'ETL', 'Hadoop', 'Hive', 'Spark', 'Flink',
      'Python', 'Java', 'Go', 'Node.js',
      'Kafka', 'RabbitMQ', '分布式', '高并发',
      'Docker', 'Kubernetes', '数据建模', '数据同步',
      '事务', 'ACID', 'ORM', 'Prisma', 'MyBatis',
      '慢查询', '执行计划', 'Binlog', 'CDC'
    ]
  },
  产品经理: {
    baseline: PM_BASELINE,
    description: '负责产品规划、需求管理和跨团队推动，要求具备优秀的用户思维和商业sense',
    keywords: [
      'PRD', '需求分析', '产品设计', '用户体验', 'UX',
      '交互设计', '原型设计', 'Axure', 'Figma', '墨刀',
      'Scrum', '敏捷开发', 'Sprint', 'Jira', 'Confluence',
      '用户研究', '用户画像', '用户旅程', '信息架构',
      '数据分析', 'A/B测试', 'OKR', 'KPI',
      '跨部门协作', '沟通能力', '汇报能力', '逻辑思维',
      '结构化思维', '文档撰写', '项目管理', '排期',
      '需求管理', 'Backlog', '用户故事', '可用性测试',
      '竞品分析', '市场调研', '商业模式', '增长'
    ]
  }
};

export const DEFAULT_JOB: JobRole = '前端工程师';
