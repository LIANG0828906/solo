import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export interface ParseProgress {
  stage: string;
  percent: number;
}

export interface ResumeSkill {
  name: string;
  level?: '初级' | '中级' | '高级' | '专家';
}

export interface ResumeExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  duration: string;
  description: string;
  achievements: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ResumeProject {
  name: string;
  role: string;
  duration: string;
  description: string;
  technologies: string[];
  highlights: string[];
}

export interface ResumeData {
  basicInfo: {
    name: string;
    gender: string;
    age: number;
    phone: string;
    email: string;
    location: string;
    avatar?: string;
    currentPosition: string;
    yearsOfExperience: number;
    expectedSalary?: string;
    selfIntroduction: string;
  };
  skills: ResumeSkill[];
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: string[];
  languages: { name: string; level: string }[];
  extractedText: string;
}

export async function parseResume(
  file: File,
  onProgress: (p: ParseProgress) => void
): Promise<ResumeData> {
  onProgress({ stage: '读取PDF文件', percent: 0 });

  const arrayBuffer = await file.arrayBuffer();
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '读取PDF文件', percent: 15 });

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '读取PDF文件', percent: 30 });

  onProgress({ stage: '提取文本内容', percent: 30 });
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '提取文本内容', percent: 45 });

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '提取文本内容', percent: 60 });

  onProgress({ stage: '结构化解析', percent: 60 });
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '结构化解析', percent: 77 });

  const resumeData = mockStructuredExtraction(fullText);
  await new Promise(r => setTimeout(r, 300));
  onProgress({ stage: '结构化解析', percent: 95 });

  onProgress({ stage: '解析完成', percent: 100 });
  return resumeData;
}

export function mockStructuredExtraction(text: string): ResumeData {
  return {
    basicInfo: {
      name: '张三',
      gender: '男',
      age: 29,
      phone: '138****8888',
      email: 'zhangsan@example.com',
      location: '北京市海淀区',
      currentPosition: '高级前端工程师',
      yearsOfExperience: 5,
      expectedSalary: '35k-50k',
      selfIntroduction:
        '5年前端开发经验，深耕React生态与TypeScript工程化实践，具备大型SPA项目架构设计能力。曾主导过亿级用户量的Web应用性能优化，首屏加载时间从3.2s降至0.8s。注重代码质量与团队协作，推动团队从jQuery向React技术栈平滑迁移，沉淀了完整的组件库与开发规范。'
    },
    skills: [
      { name: 'React', level: '专家' },
      { name: 'TypeScript', level: '专家' },
      { name: 'Vue', level: '高级' },
      { name: 'JavaScript', level: '专家' },
      { name: 'CSS3', level: '高级' },
      { name: 'HTML5', level: '高级' },
      { name: 'Webpack', level: '高级' },
      { name: 'Vite', level: '高级' },
      { name: 'Node.js', level: '中级' },
      { name: 'Next.js', level: '高级' },
      { name: 'Redux', level: '高级' },
      { name: 'MobX', level: '中级' },
      { name: 'Jest', level: '高级' },
      { name: 'Cypress', level: '中级' },
      { name: 'Ant Design', level: '高级' },
      { name: 'Element UI', level: '中级' },
      { name: 'Git', level: '高级' },
      { name: 'Docker', level: '初级' },
      { name: 'GraphQL', level: '中级' },
      { name: '微前端', level: '高级' }
    ],
    experiences: [
      {
        company: '字节跳动',
        position: '高级前端工程师',
        startDate: '2022-03',
        endDate: '至今',
        duration: '3年3个月',
        description:
          '负责抖音创作者中心Web端的核心业务开发与架构优化，带领5人小组完成多个重要版本迭代。',
        achievements: [
          '主导创作者中心首页性能优化，通过懒加载、代码分割、CDN缓存等策略，首屏加载时间从3.2s降至0.8s，用户留存率提升12%',
          '设计并落地微前端架构方案，将原有单体应用拆分为7个子应用，独立部署效率提升300%，跨团队协作成本降低60%',
          '搭建前端监控体系（性能监控、错误监控、行为埋点），线上问题发现响应时间从小时级缩短至分钟级',
          '推动TypeScript全量落地，代码类型覆盖率从20%提升至95%，线上类型相关BUG降低80%',
          '封装通用业务组件库（30+组件），复用率达85%，新人上手时间从2周缩短至3天'
        ]
      },
      {
        company: '阿里巴巴',
        position: '前端工程师',
        startDate: '2020-01',
        endDate: '2022-02',
        duration: '2年2个月',
        description:
          '参与天猫双11大促活动页开发，负责商家后台管理系统的核心模块开发与维护。',
        achievements: [
          '参与2020/2021双11大促活动页开发，承接亿级PV，系统零故障，峰值QPS达15万',
          '负责商家后台「商品管理」模块重构，采用React+TypeScript+Ant Design技术栈，页面渲染性能提升200%',
          '设计并实现可视化搭建平台，支持运营人员通过拖拽配置生成活动页，上线后节省前端人力约60%',
          '参与团队代码规范制定与ESLint规则定制，代码评审通过率提升40%'
        ]
      }
    ],
    education: [
      {
        school: '浙江大学',
        degree: '本科',
        major: '计算机科学与技术',
        startDate: '2016-09',
        endDate: '2020-06',
        gpa: '3.8/4.0'
      }
    ],
    projects: [
      {
        name: '抖音创作者中心',
        role: '前端技术负责人',
        duration: '2022-06 - 至今',
        description:
          '面向抖音内容创作者的一站式运营平台，提供数据分析、内容管理、粉丝互动、变现工具等核心能力，日活创作者超过500万。',
        technologies: ['React', 'TypeScript', 'Next.js', 'Redux Toolkit', 'Webpack5', '微前端', 'Jest'],
        highlights: [
          '从0到1搭建微前端架构，采用qiankun框架实现子应用独立开发与部署',
          '设计并实现SSR渲染方案，SEO友好页面首屏速度提升至1s以内',
          '推动前端工程化建设，集成CI/CD流水线，部署时间从20min降至3min'
        ]
      },
      {
        name: '天猫活动搭建平台',
        role: '核心开发',
        duration: '2021-03 - 2022-01',
        description:
          '服务于天猫运营团队的可视化活动搭建系统，支持拖拽式页面配置、实时预览、一键发布，日均创建活动页200+。',
        technologies: ['Vue3', 'TypeScript', 'Vite', 'Pinia', 'Element Plus', 'Node.js', 'MongoDB'],
        highlights: [
          '实现基于JSON Schema的组件协议，支持50+业务组件的灵活配置',
          '开发实时协作编辑功能，基于CRDT算法解决多人编辑冲突问题',
          '搭建页面性能评测体系，自动检测并优化页面性能问题'
        ]
      },
      {
        name: '商家后台管理系统重构',
        role: '主力开发',
        duration: '2020-05 - 2020-12',
        description:
          '天猫商家后台核心管理系统重构项目，涉及商品、订单、营销、物流等10+业务模块。',
        technologies: ['React', 'TypeScript', 'Ant Design', 'Redux', 'Webpack', 'Jest'],
        highlights: [
          '完成商品管理模块（SKU管理、库存、上下架）的完整重构',
          '设计通用表单解决方案，基于配置化思想减少70%重复代码',
          '单元测试覆盖率达到80%，核心流程100%覆盖'
        ]
      }
    ],
    certifications: [
      '阿里云前端开发高级工程师认证（2023）',
      '字节跳动技术专家评级T4（2023）',
      'Google Professional Cloud Developer（2022）'
    ],
    languages: [
      { name: '英语', level: 'CET-6 / 流利读写' },
      { name: '普通话', level: '母语' }
    ],
    extractedText: text
  };
}
