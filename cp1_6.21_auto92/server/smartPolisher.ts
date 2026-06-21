import { ResumeData, ResumeSection, SectionItem } from './resumeDataGenerator';

export interface PolishSuggestion {
  original: string;
  recommended: string;
  category: 'education' | 'work' | 'skills' | 'general';
  fieldPath: string;
}

interface ReplacementRule {
  pattern: RegExp;
  replacement: string;
  category: 'education' | 'work' | 'skills' | 'general';
}

const EDUCATION_RULES: ReplacementRule[] = [
  { pattern: /学过/g,  replacement: '系统掌握',    category: 'education' },
  { pattern: /做过/g,  replacement: '独立完成',    category: 'education' },
  { pattern: /了解/g,  replacement: '深入理解',    category: 'education' },
  { pattern: /学了/g,  replacement: '系统学习并掌握', category: 'education' },
  { pattern: /上课/g,  replacement: '系统研修',    category: 'education' },
  { pattern: /写论文/g, replacement: '完成学术研究', category: 'education' },
  { pattern: /考试/g,  replacement: '考核评估',    category: 'education' },
  { pattern: /及格/g,  replacement: '达标',        category: 'education' },
  { pattern: /参加了/g, replacement: '深度参与',    category: 'education' },
  { pattern: /毕业设计/g, replacement: '毕业研究项目', category: 'education' },
];

const WORK_RULES: ReplacementRule[] = [
  { pattern: /负责/g,   replacement: '主导推动',  category: 'work' },
  { pattern: /参与/g,   replacement: '深度参与',  category: 'work' },
  { pattern: /完成/g,   replacement: '高效交付',  category: 'work' },
  { pattern: /帮助/g,   replacement: '助力',      category: 'work' },
  { pattern: /做了/g,   replacement: '成功实现',  category: 'work' },
  { pattern: /改进/g,   replacement: '深度优化',  category: 'work' },
  { pattern: /处理/g,   replacement: '高效解决',  category: 'work' },
  { pattern: /配合/g,   replacement: '协同推进',  category: 'work' },
  { pattern: /维护/g,   replacement: '持续保障',  category: 'work' },
  { pattern: /使用/g,   replacement: '熟练运用',  category: 'work' },
  { pattern: /编写/g,   replacement: '高质量输出', category: 'work' },
  { pattern: /沟通/g,   replacement: '高效协同沟通', category: 'work' },
  { pattern: /安排/g,   replacement: '统筹规划',  category: 'work' },
  { pattern: /解决/g,   replacement: '攻坚克难解决', category: 'work' },
];

const SKILLS_RULES: ReplacementRule[] = [
  { pattern: /熟悉/g,   replacement: '熟练掌握',  category: 'skills' },
  { pattern: /会/g,     replacement: '精通',      category: 'skills' },
  { pattern: /懂/g,     replacement: '深入理解',  category: 'skills' },
];

const ALL_RULES: ReplacementRule[] = [...EDUCATION_RULES, ...WORK_RULES, ...SKILLS_RULES];

function matchRules(text: string, rules: ReplacementRule[]): { match: RegExpMatchArray; replacement: string; category: PolishSuggestion['category'] } | null {
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) {
      return { match, replacement: rule.replacement, category: rule.category };
    }
  }
  return null;
}

function getSectionCategory(sectionTitle: string): 'education' | 'work' | 'skills' | 'general' {
  if (/教育|学历|毕业/.test(sectionTitle)) return 'education';
  if (/工作|经历|项目/.test(sectionTitle)) return 'work';
  if (/技能|专长|能力/.test(sectionTitle)) return 'skills';
  return 'general';
}

function getRulesForCategory(category: 'education' | 'work' | 'skills' | 'general'): ReplacementRule[] {
  switch (category) {
    case 'education': return [...EDUCATION_RULES, ...ALL_RULES.filter(r => r.category === 'general')];
    case 'work':      return [...WORK_RULES, ...ALL_RULES.filter(r => r.category === 'general')];
    case 'skills':    return [...SKILLS_RULES, ...ALL_RULES];
    default:          return ALL_RULES;
  }
}

function scanSection(section: ResumeSection, sectionIdx: number): PolishSuggestion[] {
  const suggestions: PolishSuggestion[] = [];
  const category = getSectionCategory(section.title);
  const rules = getRulesForCategory(category);

  section.items.forEach((item: SectionItem, itemIdx: number) => {
    const result = matchRules(item.value, rules);
    if (result && result.match.index !== undefined) {
      const matched = result.match[0];
      if (matched !== result.replacement) {
        suggestions.push({
          original: matched,
          recommended: result.replacement,
          category: result.category,
          fieldPath: `sections.${sectionIdx}.items.${itemIdx}.value`,
        });
      }
    }
  });

  return suggestions;
}

function addSkillLevelSuggestions(sections: ResumeSection[]): PolishSuggestion[] {
  const suggestions: PolishSuggestion[] = [];
  sections.forEach((section, sectionIdx) => {
    if (!/技能|专长/.test(section.title)) return;
    section.items.forEach((item: SectionItem, itemIdx: number) => {
      if (/\d/.test(item.value)) return;
      if (/(精通|熟练|掌握|深入|了解|熟悉)/.test(item.value)) return;
      suggestions.push({
        original: item.value,
        recommended: `${item.value}（熟练）`,
        category: 'skills',
        fieldPath: `sections.${sectionIdx}.items.${itemIdx}.value`,
      });
    });
  });
  return suggestions;
}

export function polishResume(resumeData: ResumeData): PolishSuggestion[] {
  const suggestions: PolishSuggestion[] = [];

  for (let i = 0; i < resumeData.sections.length; i++) {
    const section = resumeData.sections[i];
    const sectionSuggestions = scanSection(section, i);
    suggestions.push(...sectionSuggestions);
  }

  const skillLevelSuggestions = addSkillLevelSuggestions(resumeData.sections);
  suggestions.push(...skillLevelSuggestions);

  const seen = new Set<string>();
  return suggestions.filter(s => {
    const key = `${s.fieldPath}:${s.original}:${s.recommended}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
