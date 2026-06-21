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
  onProgress({ stage: '读取PDF文件', percent: 15 });

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  onProgress({ stage: '读取PDF文件', percent: 30 });

  onProgress({ stage: '提取文本内容', percent: 30 });

  let fullText = '';
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
    const pageProgress = 30 + Math.round((i / totalPages) * 30);
    onProgress({ stage: '提取文本内容', percent: pageProgress });
  }

  onProgress({ stage: '结构化解析', percent: 60 });
  await new Promise(r => setTimeout(r, 200));
  onProgress({ stage: '结构化解析', percent: 75 });

  const resumeData = extractFromText(fullText);

  const skillProgress = 75 + Math.min(Math.round(resumeData.skills.length * 1.5), 15);
  onProgress({ stage: '结构化解析', percent: skillProgress });
  await new Promise(r => setTimeout(r, 150));

  const expProgress = skillProgress + Math.min(Math.round(resumeData.experiences.length * 2), 8);
  onProgress({ stage: '结构化解析', percent: Math.min(expProgress, 95) });
  await new Promise(r => setTimeout(r, 100));

  onProgress({ stage: '解析完成', percent: 100 });
  return resumeData;
}

const SKILL_DATABASE: string[] = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Less',
  'Node.js', 'Express', 'Koa', 'NestJS', 'Next.js', 'Nuxt.js',
  'Webpack', 'Vite', 'Rollup', 'Babel', 'ESLint',
  'Redux', 'MobX', 'Vuex', 'Pinia', 'Zustand',
  'Jest', 'Mocha', 'Cypress', 'Playwright', 'Vitest',
  'Ant Design', 'Element UI', 'Element Plus', 'Material UI', 'Tailwind CSS',
  'Git', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Java', 'Spring Boot', 'Spring Cloud', 'MyBatis', 'Maven',
  'Python', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy',
  'Go', 'Rust', 'C++', 'C#', 'Swift', 'Kotlin',
  'GraphQL', 'RESTful', 'gRPC', 'WebSocket',
  '微服务', '微前端', 'Serverless', '云原生', 'DevOps',
  'Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Axure',
  'Tableau', 'Power BI', 'Spark', 'Hadoop', 'Hive',
  'Linux', 'Nginx', 'AWS', 'Azure', 'GCP',
  '数据分析', '机器学习', '深度学习', '自然语言处理', '计算机视觉',
  '需求分析', '产品设计', '用户研究', '项目管理', '交互设计',
  '视觉设计', '动效设计', '设计规范', '设计系统', '插画',
];

const SOFT_SKILL_KEYWORDS: string[] = [
  '沟通', '协作', '团队合作', '领导', '管理', '学习', '创新', '解决问题',
  '责任心', '执行力', '抗压', '自驱', '主动', '细致', '逻辑',
];

const INDUSTRY_KEYWORDS: string[] = [
  '互联网', '电商', '金融', '教育', '医疗', '游戏', '社交',
  'SaaS', 'B2B', 'B2C', 'O2O', '人工智能', '大数据', '云计算',
  '物联网', '区块链', '信息安全', '小程序', 'APP', 'Web',
];

const COMPANY_SUFFIXES = ['有限公司', '科技', '网络', '集团', '公司', 'Inc', 'Corp', 'Ltd', 'LLC'];
const POSITION_KEYWORDS = ['工程师', '开发', '设计师', '经理', '总监', '主管', '专员', '架构师', '分析师', '产品', '运营', '实习生', '负责人'];

function extractName(lines: string[]): string {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cleaned = line.replace(/[\s|·\-—,，:：]/g, '');
    if (cleaned.length >= 2 && cleaned.length <= 6) {
      if (/^[\u4e00-\u9fa5]+$/.test(cleaned)) return cleaned;
    }
    const engMatch = line.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (engMatch) return engMatch[1];
  }
  return '未知';
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/1[3-9]\d{9}/);
  if (match) return match[0];
  const match2 = text.match(/(\+86[-\s]?)?1[3-9]\d{9}/);
  if (match2) return match2[0];
  const match3 = text.match(/\d{3}[-\s]?\d{4}[-\s]?\d{4}/);
  return match3 ? match3[0] : '';
}

function extractLocation(text: string): string {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州', '长沙', '重庆', '天津'];
  for (const city of cities) {
    if (text.includes(city)) return city;
  }
  return '';
}

function extractSkills(text: string): ResumeSkill[] {
  const found: ResumeSkill[] = [];
  const textUpper = text.toUpperCase();
  for (const skill of SKILL_DATABASE) {
    const isEng = /^[A-Za-z]/.test(skill);
    const present = isEng
      ? textUpper.includes(skill.toUpperCase()) || text.includes(skill)
      : text.includes(skill);
    if (present && !found.some(f => f.name === skill)) {
      found.push({ name: skill });
    }
  }
  return found;
}

function extractExperiences(text: string): ResumeExperience[] {
  const experiences: ResumeExperience[] = [];
  const lines = text.split(/\n/);
  const dateRangeRegex = /(\d{4}[\/\-年]\d{1,2}[月]?)\s*[-–—至到~]\s*(\d{4}[\/\-年]\d{1,2}[月]?|至今|present)/i;
  const linesWithDates: { lineIdx: number; line: string; start: string; end: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(dateRangeRegex);
    if (m) {
      linesWithDates.push({ lineIdx: i, line: lines[i], start: m[1], end: m[2] });
    }
  }

  for (let di = 0; di < linesWithDates.length; di++) {
    const { lineIdx, start, end } = linesWithDates[di];
    const prevLine = lineIdx > 0 ? lines[lineIdx - 1].trim() : '';
    const currentLine = lines[lineIdx].trim();
    const combined = prevLine + ' ' + currentLine;

    let company = '';
    let position = '';
    for (const suffix of COMPANY_SUFFIXES) {
      const idx = combined.indexOf(suffix);
      if (idx !== -1) {
        const sub = combined.substring(0, idx + suffix.length);
        const candidate = sub.match(/[\u4e00-\u9fa5A-Za-z0-9]+/g);
        if (candidate && candidate.length > 0) {
          company = candidate[candidate.length - 1] + suffix;
          break;
        }
      }
    }
    if (!company) {
      for (const kw of ['字节跳动', '阿里巴巴', '腾讯', '百度', '美团', '京东', '网易', '华为', '小米', '快手', '滴滴', '拼多多', '微软', '谷歌', '苹果', '亚马逊']) {
        if (combined.includes(kw)) { company = kw; break; }
      }
    }

    for (const pk of POSITION_KEYWORDS) {
      if (combined.includes(pk)) {
        const match = combined.match(new RegExp(`[\\u4e00-\\u9fa5A-Za-z0-9]*${pk}[\\u4e00-\\u9fa5A-Za-z0-9]*`));
        if (match) { position = match[0]; break; }
      }
    }

    const descLines: string[] = [];
    const nextDi = di + 1 < linesWithDates.length ? linesWithDates[di + 1].lineIdx : lines.length;
    for (let j = lineIdx + 1; j < Math.min(nextDi, lineIdx + 8); j++) {
      const l = lines[j].trim();
      if (l && !l.match(dateRangeRegex) && l.length > 3) {
        descLines.push(l);
      }
    }
    const description = descLines.join(' ').substring(0, 200);
    const achievements = descLines.filter(l => l.match(/^[•·\-\*►▸]\s/) || l.match(/^\d+[.、]/)).map(l => l.replace(/^[•·\-\*►▸]\s*/, '').replace(/^\d+[.、]\s*/, '')).slice(0, 5);
    if (!achievements.length && description) {
      achievements.push(description.substring(0, 100));
    }

    const startNorm = start.replace(/[\/年月]/g, '-').replace(/-$/, '');
    const endNorm = /至今|present/i.test(end) ? '至今' : end.replace(/[\/年月]/g, '-').replace(/-$/, '');
    let duration = '';
    const sMatch = start.match(/(\d{4})/);
    const eMatch = /至今|present/i.test(end) ? null : end.match(/(\d{4})/);
    if (sMatch) {
      const sYear = parseInt(sMatch[1]);
      const eYear = eMatch ? parseInt(eMatch[1]) : new Date().getFullYear();
      const diff = eYear - sYear;
      duration = diff > 0 ? `${diff}年` : '1年内';
    }

    experiences.push({
      company: company || `工作经历${di + 1}`,
      position: position || '职员',
      startDate: startNorm,
      endDate: endNorm,
      duration,
      description,
      achievements,
    });
  }

  return experiences;
}

function extractEducation(text: string): ResumeEducation[] {
  const education: ResumeEducation[] = [];
  const degreeKeywords = ['博士', '硕士', '研究生', '本科', '学士', '大专', '专科', 'MBA', 'PhD', 'Master', 'Bachelor'];
  const schoolKeywords = ['大学', '学院', 'School', 'University', 'Institute', '研究院'];
  const lines = text.split(/\n/);
  const eduBlocks: { lineIdx: number; line: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const hasDegree = degreeKeywords.some(d => l.includes(d));
    const hasSchool = schoolKeywords.some(s => l.includes(s));
    if (hasDegree || hasSchool) {
      eduBlocks.push({ lineIdx: i, line: l });
    }
  }

  for (const block of eduBlocks) {
    let school = '';
    let degree = '';
    let major = '';
    let duration = '';

    const schoolMatch = block.line.match(/[\u4e00-\u9fa5A-Za-z]+(?:大学|学院|University|Institute|School)/i);
    if (schoolMatch) school = schoolMatch[0];

    for (const dk of degreeKeywords) {
      if (block.line.includes(dk)) { degree = dk; break; }
    }

    const majorMatch = block.line.match(/(?:专业|专业方向|方向)[：:]\s*([^\s,，]+)/);
    if (majorMatch) major = majorMatch[1];

    const nearbyLines = lines.slice(Math.max(0, block.lineIdx - 2), Math.min(lines.length, block.lineIdx + 3)).join(' ');
    const dateMatch = nearbyLines.match(/(\d{4})[\/\-年](\d{1,2})?\s*[-–—至到~]\s*(\d{4})[\/\-年](\d{1,2})?/);
    if (dateMatch) {
      duration = `${dateMatch[1]}-${dateMatch[3]}`;
    }

    if (school || degree) {
      education.push({
        school: school || '未知院校',
        degree: degree || '未知',
        major: major || '',
        startDate: duration ? duration.split('-')[0] : '',
        endDate: duration ? duration.split('-')[1] : '',
      });
    }
  }

  return education;
}

function extractSoftSkills(text: string): string[] {
  return SOFT_SKILL_KEYWORDS.filter(kw => text.includes(kw));
}

function extractIndustryKnowledge(text: string): string[] {
  return INDUSTRY_KEYWORDS.filter(kw => text.includes(kw));
}

function extractSelfIntroduction(text: string, name: string): string {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 20);
  for (const line of lines) {
    if (line.includes(name) || line.includes('经验') || line.includes('擅长') || line.includes('专注') || line.includes('熟悉') || line.includes('精通')) {
      return line.substring(0, 200);
    }
  }
  return lines[0] ? lines[0].substring(0, 200) : '';
}

function estimateYearsOfExperience(experiences: ResumeExperience[]): number {
  let total = 0;
  for (const exp of experiences) {
    const m = exp.duration.match(/(\d+)/);
    if (m) total += parseInt(m[1]);
    else if (exp.endDate === '至今' && exp.startDate) {
      const startY = parseInt(exp.startDate.substring(0, 4));
      if (!isNaN(startY)) total += new Date().getFullYear() - startY;
    }
  }
  return total || 1;
}

function inferCurrentPosition(experiences: ResumeExperience[]): string {
  for (const exp of experiences) {
    if (exp.endDate === '至今') return exp.position;
  }
  return experiences.length > 0 ? experiences[0].position : '未知';
}

export function extractFromText(text: string): ResumeData {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const name = extractName(lines);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const location = extractLocation(text);
  const skills = extractSkills(text);
  const experiences = extractExperiences(text);
  const education = extractEducation(text);
  const selfIntroduction = extractSelfIntroduction(text, name);
  const yearsOfExperience = estimateYearsOfExperience(experiences);
  const currentPosition = inferCurrentPosition(experiences);

  return {
    basicInfo: {
      name,
      gender: '',
      age: 0,
      phone: phone || '',
      email: email || '',
      location,
      currentPosition,
      yearsOfExperience,
      expectedSalary: '',
      selfIntroduction,
    },
    skills,
    experiences,
    education,
    projects: [],
    certifications: [],
    languages: [],
    extractedText: text,
  };
}
