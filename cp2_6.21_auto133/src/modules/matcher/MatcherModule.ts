import { ResumeData, JobRequirement, MatchResult, RadarDimension } from '../../types';

export const PRESET_JOBS: JobRequirement[] = [
  {
    id: 'frontend',
    title: '高级前端工程师',
    company: '字节跳动',
    location: '北京',
    description: '负责公司核心产品的前端开发，参与技术架构设计与性能优化。',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'],
    preferredSkills: ['Vue', 'Node.js', 'Webpack', 'Vite', 'Jest'],
    experienceYears: 3,
    educationLevel: '本科',
    industry: '互联网',
  },
  {
    id: 'backend',
    title: '后端开发工程师',
    company: '阿里巴巴',
    location: '杭州',
    description: '负责电商平台核心服务的设计与开发，保障系统高可用和高性能。',
    requiredSkills: ['Java', 'Spring Boot', 'MySQL', 'Redis', '微服务'],
    preferredSkills: ['Kafka', 'Docker', 'Kubernetes', 'MongoDB'],
    experienceYears: 3,
    educationLevel: '本科',
    industry: '电商',
  },
  {
    id: 'data',
    title: '数据分析师',
    company: '腾讯',
    location: '深圳',
    description: '负责业务数据分析，构建数据指标体系，输出数据驱动的决策建议。',
    requiredSkills: ['SQL', 'Python', 'Excel', '数据分析', '数据可视化'],
    preferredSkills: ['Tableau', 'Power BI', '机器学习', 'Hadoop', 'Spark'],
    experienceYears: 2,
    educationLevel: '本科',
    industry: '互联网',
  },
  {
    id: 'product',
    title: '产品经理',
    company: '美团',
    location: '北京',
    description: '负责产品规划与设计，推动产品迭代，协调研发、设计、运营团队。',
    requiredSkills: ['需求分析', '产品设计', 'Axure', '用户研究', '项目管理'],
    preferredSkills: ['数据分析', 'SQL', 'UI设计', '商业化运营'],
    experienceYears: 3,
    educationLevel: '本科',
    industry: '本地生活',
  },
  {
    id: 'ui',
    title: 'UI设计师',
    company: '网易',
    location: '广州',
    description: '负责移动端和Web端产品的视觉设计，输出高质量设计稿和规范。',
    requiredSkills: ['Figma', 'Sketch', 'Photoshop', '视觉设计', '设计规范'],
    preferredSkills: ['动效设计', '插画', '用户研究', 'Prototyping'],
    experienceYears: 2,
    educationLevel: '本科',
    industry: '游戏/互联网',
  },
];

const DIMENSIONS = ['编程能力', '项目经验', '教育背景', '软技能', '行业知识'];

function calculateProgrammingScore(resume: ResumeData, job: JobRequirement): number {
  const allSkills = [...job.requiredSkills, ...job.preferredSkills];
  const matched = resume.skills.filter((s) =>
    allSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  );
  const requiredMatched = resume.skills.filter((s) =>
    job.requiredSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  );
  const base = (requiredMatched.length / job.requiredSkills.length) * 60;
  const bonus = (matched.length / allSkills.length) * 40;
  return Math.min(100, Math.round(base + bonus));
}

function calculateExperienceScore(resume: ResumeData, job: JobRequirement): number {
  const totalYears = resume.experience.reduce((acc, exp) => {
    const match = exp.duration.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);
  const ratio = Math.min(totalYears / job.experienceYears, 1.5);
  const projectCountScore = Math.min(resume.experience.length * 15, 30);
  return Math.min(100, Math.round(ratio * 50 + projectCountScore + 20));
}

function calculateEducationScore(resume: ResumeData, job: JobRequirement): number {
  const levelOrder = ['高中', '大专', '本科', '硕士', '博士'];
  const jobLevelIdx = levelOrder.findIndex((l) => job.educationLevel.includes(l));
  let userHighestIdx = 0;
  resume.education.forEach((edu) => {
    const idx = levelOrder.findIndex((l) => edu.degree.includes(l));
    if (idx > userHighestIdx) userHighestIdx = idx;
  });
  if (userHighestIdx >= jobLevelIdx) {
    const diff = userHighestIdx - jobLevelIdx;
    return Math.min(100, 75 + diff * 12);
  }
  return Math.max(30, 75 - (jobLevelIdx - userHighestIdx) * 20);
}

function calculateSoftSkillScore(resume: ResumeData): number {
  const commonSoftSkills = ['沟通', '协作', '团队', '学习', '领导', '问题解决', '创新', '责任'];
  const resumeText = `${resume.summary || ''} ${resume.softSkills.join(' ')} ${resume.experience.map((e) => e.description || '').join(' ')}`;
  const matched = commonSoftSkills.filter((s) => resumeText.includes(s));
  const baseScore = 50;
  return Math.min(100, baseScore + matched.length * 7 + resume.softSkills.length * 4);
}

function calculateIndustryScore(resume: ResumeData, job: JobRequirement): number {
  const industryKeywords: Record<string, string[]> = {
    互联网: ['互联网', 'Web', 'APP', '小程序', '云', '平台'],
    电商: ['电商', '交易', '支付', '订单', '商品', '商家', '淘宝', '天猫', '京东'],
    本地生活: ['外卖', '到店', '餐饮', '酒店', '出行', '团购'],
    '游戏/互联网': ['游戏', 'Unity', 'Unreal', '3D', '玩家', '关卡'],
  };
  const keywords = industryKeywords[job.industry] || [];
  const resumeText = `${resume.summary || ''} ${resume.industryKnowledge.join(' ')} ${resume.experience.map((e) => `${e.company} ${e.description || ''}`).join(' ')}`;
  const matched = keywords.filter((k) => resumeText.includes(k));
  const baseScore = 40;
  return Math.min(100, baseScore + matched.length * 12 + resume.industryKnowledge.length * 5);
}

function generateStrengths(resume: ResumeData, job: JobRequirement, scores: Record<string, number>): string[] {
  const strengths: string[] = [];
  const matchedSkills = resume.skills.filter((s) =>
    job.requiredSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  );
  if (matchedSkills.length > 0) {
    const top = matchedSkills.slice(0, 3).join('、');
    strengths.push(`${top}技能匹配`);
  }
  if (scores['项目经验'] >= 75) strengths.push('项目经验丰富');
  if (scores['教育背景'] >= 75) strengths.push('学历背景优秀');
  if (scores['软技能'] >= 75) strengths.push('软技能突出');
  if (scores['行业知识'] >= 75) strengths.push('行业认知深入');
  if (strengths.length === 0) strengths.push('具备基础岗位胜任能力');
  return strengths.slice(0, 5);
}

function generateWeaknesses(resume: ResumeData, job: JobRequirement, scores: Record<string, number>): string[] {
  const weaknesses: string[] = [];
  const missingRequired = job.requiredSkills.filter((js) =>
    !resume.skills.some((s) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
  );
  if (missingRequired.length > 0) {
    const top = missingRequired.slice(0, 3).join('、');
    weaknesses.push(`缺少${top}技能`);
  }
  if (scores['项目经验'] < 60) weaknesses.push('项目经验不足');
  if (scores['教育背景'] < 60) weaknesses.push('学历待提升');
  if (scores['软技能'] < 60) weaknesses.push('软技能需加强');
  if (scores['行业知识'] < 60) weaknesses.push('行业认知待积累');
  if (weaknesses.length === 0) weaknesses.push('无明显短板');
  return weaknesses.slice(0, 5);
}

export const MatcherModule = {
  matchResumeToJob(resume: ResumeData, job: JobRequirement): MatchResult {
    const programming = calculateProgrammingScore(resume, job);
    const experience = calculateExperienceScore(resume, job);
    const education = calculateEducationScore(resume, job);
    const softSkill = calculateSoftSkillScore(resume);
    const industry = calculateIndustryScore(resume, job);

    const scores: Record<string, number> = {
      编程能力: programming,
      项目经验: experience,
      教育背景: education,
      软技能: softSkill,
      行业知识: industry,
    };

    const radarData: RadarDimension[] = DIMENSIONS.map((d) => ({
      dimension: d,
      score: scores[d],
      fullMark: 100,
    }));

    const overallScore = Math.round(
      programming * 0.3 + experience * 0.25 + education * 0.15 + softSkill * 0.15 + industry * 0.15
    );

    const matchedSkills = resume.skills.filter((s) =>
      job.requiredSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
    );
    const unmatchedSkills = resume.skills.filter((s) =>
      !job.requiredSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
    );
    const missingSkills = job.requiredSkills.filter((js) =>
      !resume.skills.some((s) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
    );

    return {
      jobId: job.id,
      overallScore,
      radarData,
      strengths: generateStrengths(resume, job, scores),
      weaknesses: generateWeaknesses(resume, job, scores),
      matchedSkills,
      unmatchedSkills,
      missingSkills,
    };
  },
};
