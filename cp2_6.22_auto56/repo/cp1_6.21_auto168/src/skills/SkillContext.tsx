import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Skill {
  id: string;
  name: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
  };
  rating: number;
  category: string;
  createdAt: string;
}

interface SkillContextType {
  skills: Skill[];
  loading: boolean;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  loadSkills: (params?: { search?: string }) => Promise<void>;
  addSkill: (skill: Skill) => void;
  updateSkillRating: (skillId: string, rating: number) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

const mockSkills: Skill[] = [
  {
    id: '1',
    name: 'React 高级开发',
    description: '深入学习 React Hooks、Context、性能优化等高级特性。包含自定义 Hook 设计模式、状态管理最佳实践、代码分割与懒加载等实战内容。适合有一定 React 基础的开发者进阶学习。',
    instructor: { name: '张教授', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang' },
    rating: 4.8,
    category: '前端开发',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    name: 'Python 数据分析',
    description: '使用 Pandas、NumPy、Matplotlib 进行数据分析实战。涵盖数据清洗、可视化、统计分析等核心技能，适合希望进入数据领域的初学者。',
    instructor: { name: '李老师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' },
    rating: 4.5,
    category: '数据科学',
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    name: 'UI/UX 设计入门',
    description: '从零开始学习用户界面和用户体验设计。包括设计原则、Figma 工具使用、原型设计、用户研究方法等内容。',
    instructor: { name: '王设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang' },
    rating: 4.9,
    category: '设计',
    createdAt: '2026-01-08',
  },
  {
    id: '4',
    name: 'Node.js 后端开发',
    description: '构建高性能的 Node.js 后端服务。学习 Express 框架、数据库设计、RESTful API 开发、认证授权等核心技能。',
    instructor: { name: '陈工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen' },
    rating: 4.7,
    category: '后端开发',
    createdAt: '2026-01-05',
  },
  {
    id: '5',
    name: '英语口语提升',
    description: '通过日常对话场景练习英语口语，提升听说能力。包含商务英语、日常交流、面试技巧等多个模块。',
    instructor: { name: 'Emily', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' },
    rating: 4.6,
    category: '语言学习',
    createdAt: '2026-01-03',
  },
  {
    id: '6',
    name: '摄影技巧进阶',
    description: '学习专业摄影技巧，包括构图、光线控制、后期处理等。适合有基础的摄影爱好者提升水平。',
    instructor: { name: '刘摄影师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu' },
    rating: 4.8,
    category: '摄影',
    createdAt: '2026-01-01',
  },
  {
    id: '7',
    name: '投资理财入门',
    description: '了解基金、股票、债券等投资工具，学习资产配置和风险管理，建立正确的投资理财观念。',
    instructor: { name: '赵理财师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao' },
    rating: 4.4,
    category: '理财',
    createdAt: '2025-12-28',
  },
  {
    id: '8',
    name: '机器学习基础',
    description: '从零开始学习机器学习，涵盖监督学习、无监督学习、神经网络等核心算法及实践应用。',
    instructor: { name: '孙博士', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun' },
    rating: 4.9,
    category: '人工智能',
    createdAt: '2025-12-25',
  },
];

export function SkillProvider({ children }: { children: React.ReactNode }) {
  const [skills, setSkills] = useState<Skill[]>(mockSkills);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadSkills = useCallback(async (params?: { search?: string }) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (params?.search) {
      const keyword = params.search.toLowerCase();
      setSkills(
        mockSkills.filter(
          skill =>
            skill.name.toLowerCase().includes(keyword) ||
            skill.description.toLowerCase().includes(keyword) ||
            skill.category.toLowerCase().includes(keyword)
        )
      );
    } else {
      setSkills(mockSkills);
    }
    setLoading(false);
  }, []);

  const addSkill = useCallback((skill: Skill) => {
    setSkills(prev => [skill, ...prev]);
  }, []);

  const updateSkillRating = useCallback((skillId: string, rating: number) => {
    setSkills(prev =>
      prev.map(skill =>
        skill.id === skillId ? { ...skill, rating } : skill
      )
    );
  }, []);

  return (
    <SkillContext.Provider
      value={{
        skills,
        loading,
        searchKeyword,
        setSearchKeyword,
        loadSkills,
        addSkill,
        updateSkillRating,
      }}
    >
      {children}
    </SkillContext.Provider>
  );
}

export function useSkills() {
  const context = useContext(SkillContext);
  if (!context) {
    throw new Error('useSkills must be used within a SkillProvider');
  }
  return context;
}
