import { useState, useCallback } from 'react';

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  workExperience: WorkExperience[];
}

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const initialData: ResumeData = {
  personalInfo: {
    name: '张三',
    title: '前端开发工程师',
    email: 'zhangsan@example.com',
    phone: '138-0000-0000',
    location: '北京市',
    summary: '5年前端开发经验，精通React、Vue等主流框架，熟悉TypeScript、Node.js等技术栈。具备良好的代码规范和团队协作能力，热爱技术，追求卓越的用户体验。',
  },
  education: [
    {
      id: generateId(),
      school: '北京大学',
      degree: '硕士',
      major: '计算机科学与技术',
      startDate: '2016-09',
      endDate: '2019-06',
      description: '主修方向：软件工程、分布式系统',
    },
    {
      id: generateId(),
      school: '清华大学',
      degree: '本科',
      major: '软件工程',
      startDate: '2012-09',
      endDate: '2016-06',
      description: 'GPA: 3.8/4.0，获得国家奖学金',
    },
  ],
  workExperience: [
    {
      id: generateId(),
      company: '字节跳动',
      position: '高级前端工程师',
      startDate: '2021-03',
      endDate: '至今',
      description: '负责抖音电商核心业务的前端架构设计与开发',
      highlights: [
        '主导电商直播间前端重构，性能提升40%',
        '设计并实现组件库，提升团队开发效率30%',
        '推动前端监控体系建设，线上问题发现率提升50%',
      ],
    },
    {
      id: generateId(),
      company: '阿里巴巴',
      position: '前端工程师',
      startDate: '2019-07',
      endDate: '2021-02',
      description: '参与淘宝商家后台系统的开发与维护',
      highlights: [
        '负责商品管理模块开发，服务百万级商家',
        '优化页面性能，首屏加载时间减少50%',
        '参与团队技术分享，累计输出10+技术文章',
      ],
    },
  ],
};

export const useResumeState = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);

  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  }, []);

  const addEducation = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: generateId(),
          school: '',
          degree: '',
          major: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  }, []);

  const updateEducation = useCallback((id: string, field: keyof Education, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  }, []);

  const addWorkExperience = useCallback(() => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: generateId(),
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
          highlights: [''],
        },
      ],
    }));
  }, []);

  const updateWorkExperience = useCallback(
    (id: string, field: keyof Omit<WorkExperience, 'highlights'>, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((work) =>
          work.id === id ? { ...work, [field]: value } : work
        ),
      }));
    },
    []
  );

  const updateWorkHighlight = useCallback(
    (workId: string, highlightIndex: number, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((work) =>
          work.id === workId
            ? {
                ...work,
                highlights: work.highlights.map((h, i) => (i === highlightIndex ? value : h)),
              }
            : work
        ),
      }));
    },
    []
  );

  const addWorkHighlight = useCallback((workId: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((work) =>
        work.id === workId ? { ...work, highlights: [...work.highlights, ''] } : work
      ),
    }));
  }, []);

  const removeWorkHighlight = useCallback((workId: string, highlightIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((work) =>
        work.id === workId
          ? {
              ...work,
              highlights: work.highlights.filter((_, i) => i !== highlightIndex),
            }
          : work
      ),
    }));
  }, []);

  const removeWorkExperience = useCallback((id: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((work) => work.id !== id),
    }));
  }, []);

  return {
    resumeData,
    updatePersonalInfo,
    addEducation,
    updateEducation,
    removeEducation,
    addWorkExperience,
    updateWorkExperience,
    updateWorkHighlight,
    addWorkHighlight,
    removeWorkHighlight,
    removeWorkExperience,
  };
};
