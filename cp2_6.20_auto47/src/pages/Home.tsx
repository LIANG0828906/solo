import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ResumeEditor from '@/modules/resume/components/ResumeEditor';
import type { Resume } from '@/types';

const demoResume: Resume = {
  id: uuidv4(),
  title: '我的简历',
  template: 'business',
  personalInfo: {
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    location: '北京',
    title: '高级前端工程师',
    summary: '拥有5年前端开发经验，精通React、TypeScript等技术栈...',
  },
  sections: [
    {
      id: uuidv4(),
      type: 'personalInfo',
      title: '个人信息',
      order: 0,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'workExperience',
      title: '工作经历',
      order: 1,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'education',
      title: '教育背景',
      order: 2,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'skills',
      title: '技能标签',
      order: 3,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'projects',
      title: '项目经验',
      order: 4,
      visible: true,
    },
  ],
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function Home() {
  const [resume, setResume] = useState<Resume>(demoResume);
  const [historyInfo, setHistoryInfo] = useState({ index: 0, total: 1 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (!e.shiftKey) {
          console.log('撤销 (Ctrl+Z)');
        } else {
          console.log('重做 (Ctrl+Shift+Z)');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen gradient-bg">
      {/* 顶部导航 */}
      <nav className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              简
            </div>
            <span className="font-semibold text-gray-800">简历工坊</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">演示模式</span>
          </div>
        </div>
      </nav>

      {/* 提示栏 */}
      <div className="bg-blue-50/50 border-b border-blue-100 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-sm text-blue-700">
          <span className="font-medium">💡 试试这些操作：</span>
          <span>拖拽左侧模块调整顺序 → </span>
          <span>按 <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-200 font-mono text-xs">Ctrl+Z</kbd> 撤销 → </span>
          <span>按 <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-200 font-mono text-xs">Ctrl+Shift+Z</kbd> 重做</span>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="h-[calc(100vh-3.5rem-2.5rem)]">
        <ResumeEditor resume={resume} onChange={setResume} />
      </div>
    </div>
  );
}
