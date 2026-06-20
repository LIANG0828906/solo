import type { SkillDimension } from '../types';

export const SKILL_KEYWORDS: Record<SkillDimension, string[]> = {
  前端: [
    'HTML', 'HTML5', 'CSS', 'CSS3', 'JavaScript', 'JS', 'TypeScript', 'TS',
    'React', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt',
    'Webpack', 'Vite', 'Rollup', 'Babel', 'Sass', 'Less', 'Stylus', 'PostCSS',
    'Tailwind', 'Bootstrap', 'Element UI', 'Ant Design', 'AntD',
    'Redux', 'Vuex', 'Pinia', 'MobX', 'Zustand', 'Jotai',
    'Canvas', 'SVG', 'WebGL', 'Three.js', 'D3.js', 'ECharts', 'Chart.js',
    '响应式', '移动端适配', '跨端', '小程序', 'Taro', 'UniApp', 'Electron',
    '性能优化', '打包优化', '代码分割', '按需加载', 'PWA', 'SSR', 'CSR',
    '前端工程化', '前端架构', '组件化', '模块化', 'ES6', 'ES2015',
    'ESLint', 'Prettier', '单元测试', 'Jest', 'Vitest', 'Cypress',
    'JSX', 'TSX', 'Virtual DOM', 'Diff算法', 'Hooks', 'Composition API',
    '浏览器兼容性', '跨域', 'CORS', 'XSS', 'CSRF', 'Web安全'
  ],
  后端: [
    'Node.js', 'Node', 'Express', 'Koa', 'NestJS', 'Midway', 'Egg',
    'Java', 'Spring', 'Spring Boot', 'Spring Cloud', 'Spring MVC', 'MyBatis',
    'Python', 'Django', 'Flask', 'FastAPI', 'Tornado', 'Tornado',
    'Go', 'Golang', 'Gin', 'Beego', 'Gorm',
    'PHP', 'Laravel', 'ThinkPHP', 'Yii', 'Swoole',
    'C#', '.NET', 'ASP.NET', 'C++', 'Rust',
    'RESTful', 'API设计', '微服务', 'RPC', 'gRPC', 'Dubbo', 'Thrift',
    'Nginx', 'Tomcat', 'Jetty', 'Docker', 'Kubernetes', 'K8s',
    'CI/CD', 'Jenkins', 'GitLab CI', 'GitHub Actions',
    '消息队列', 'Kafka', 'RabbitMQ', 'RocketMQ', 'Redis',
    '分布式', '高并发', '高可用', '负载均衡', '容灾',
    '反向代理', '网关', '鉴权', 'OAuth', 'JWT', 'Token',
    'ORM', '数据库事务', 'ACID', 'CAP', 'BASE理论',
    '多线程', '并发编程', '进程间通信', 'IO模型',
    '单元测试', '集成测试', 'TDD', 'DDD', '领域驱动'
  ],
  数据库: [
    'MySQL', 'PostgreSQL', 'Postgre', 'SQL Server', 'Oracle', 'SQLite',
    'MongoDB', 'Redis', 'Memcached', 'Elasticsearch', 'ES',
    'Cassandra', 'HBase', 'Neo4j', 'InfluxDB', 'ClickHouse',
    'SQL', 'NoSQL', 'NewSQL', 'TiDB', 'OceanBase',
    '索引', 'B+树', '聚簇索引', '覆盖索引', '最左前缀',
    '查询优化', '慢查询', 'EXPLAIN', '执行计划',
    '事务', '隔离级别', 'MVCC', '死锁', '乐观锁', '悲观锁',
    '分库分表', '读写分离', '主从复制', '数据备份', '数据恢复',
    '连接池', '数据库集群', '数据同步', 'CDC', 'Binlog',
    'ORM框架', 'Hibernate', 'MyBatis', 'Prisma', 'TypeORM',
    '数据仓库', 'OLAP', 'OLTP', 'ETL', 'Hadoop', 'Hive', 'Spark',
    'Flink', '数据建模', '范式', 'ER图', '数据一致性'
  ],
  设计: [
    'UI设计', 'UX', '交互设计', '用户体验', '产品设计',
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'PS', 'Illustrator', 'AI',
    'Axure', '墨刀', '蓝湖', '设计规范', 'Design System',
    '视觉设计', '平面设计', '品牌设计', 'Logo', '海报',
    '原型设计', '线框图', '低保真', '高保真', '可用性测试',
    '信息架构', '用户研究', '用户画像', '用户旅程',
    '色彩理论', '版式', '排版', '字体设计', '图标设计',
    '动效设计', 'Lottie', '动画原型', '微交互',
    '响应式设计', '移动端设计', 'Material Design', 'iOS Design',
    'A/B测试', '数据驱动设计', '无障碍设计', '可访问性',
    '切图', '标注', '设计评审', '组件库', '素材管理'
  ],
  项目管理: [
    '敏捷开发', 'Agile', 'Scrum', 'Sprint', 'Kanban', '看板',
    '产品经理', '项目经理', 'PM', '需求分析', '需求管理',
    'PRD', 'BRD', 'MRD', '用户故事', 'Backlog', '待办',
    'Jira', 'Confluence', 'Trello', '禅道', '飞书', 'Notion',
    '项目计划', '排期', '里程碑', '甘特图', 'WBS', '任务分解',
    '风险管理', '问题管理', '变更管理', '资源管理', '成本管理',
    '迭代管理', '版本管理', '发布管理', '灰度发布', 'A/B测试',
    '跨部门协作', '向上管理', '汇报', '会议主持', '复盘',
    'OKR', 'KPI', '绩效管理', '进度跟踪', '质量管理',
    '流程优化', '项目治理', '文档管理', '知识库建设',
    '团队建设', '技术选型', '架构评审', '代码评审', 'Code Review',
    'Git', '版本控制', 'GitFlow', 'GitHub', 'GitLab', 'SVN'
  ],
  沟通: [
    '沟通能力', '表达能力', '演讲能力', '汇报能力', '谈判能力',
    '团队协作', '团队合作', '跨部门沟通', '客户沟通', '商务谈判',
    '文档撰写', '邮件撰写', '会议纪要', '需求文档', '方案撰写',
    '逻辑思维', '结构化思维', '数据分析思维', '批判性思维',
    '时间管理', '优先级管理', '目标管理', '执行力', '抗压能力',
    '学习能力', '适应能力', '解决问题', '问题定位', '快速学习',
    '责任心', '主动性', '积极主动', '创新意识', '主人翁意识',
    '英语', 'CET4', 'CET6', 'TOEFL', 'IELTS', '英文读写',
    '领导能力', '团队管理', '带人经验', 'Mentor', '导师',
    '客户成功', '售前支持', '技术支持', '培训经验', '知识分享'
  ]
};

export const ALL_DIMENSIONS: SkillDimension[] = [
  '前端', '后端', '数据库', '设计', '项目管理', '沟通'
];
