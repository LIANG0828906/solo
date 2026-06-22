import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, Moon, Sun } from 'lucide-react';
import { ClassCard } from '@/components/ClassCard';
import { classApi, essayApi } from '@/api';
import type { Class, Essay } from '@/types';

export const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [essaysMap, setEssaysMap] = useState<Record<string, Essay[]>>({});
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await classApi.getClasses();
        if (res.code === 200) {
          setClasses(res.data);
          res.data.forEach(async (c) => {
            try {
              const essayRes = await essayApi.getEssaysByClass(c.id);
              if (essayRes.code === 200) {
                setEssaysMap((prev) => ({ ...prev, [c.id]: essayRes.data }));
              }
            } catch {
              // ignore
            }
          });
        }
      } catch {
        const mockClasses: Class[] = [
          { id: 'class-001', name: '高三(1)班', studentCount: 45, lastGradedDate: '2024-01-15' },
          { id: 'class-002', name: '高三(2)班', studentCount: 42, lastGradedDate: '2024-01-14' },
          { id: 'class-003', name: '高三(3)班', studentCount: 48, lastGradedDate: '2024-01-13' },
          { id: 'class-004', name: '高二(1)班', studentCount: 40, lastGradedDate: '2024-01-12' },
          { id: 'class-005', name: '高二(2)班', studentCount: 43, lastGradedDate: '2024-01-11' },
          { id: 'class-006', name: '高二(3)班', studentCount: 46, lastGradedDate: '' },
        ];
        setClasses(mockClasses);
      }
    };
    loadData();
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleClassClick = (classItem: Class) => {
    const essays = essaysMap[classItem.id];
    let essayId = 'essay-001';
    if (essays && essays.length > 0) {
      essayId = essays[0].id;
    } else {
      essayId = `essay-${classItem.id.split('-')[1]}-001`;
    }
    navigate(`/grading/${classItem.id}/${essayId}`);
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="bg-bg-panel shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">作文批改系统</h1>
              <p className="text-xs text-text-secondary">在线教育平台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/stats')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <BarChart3 size={18} />
              统计仪表盘
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">
              张
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-1">班级列表</h2>
          <p className="text-text-secondary">选择班级进入作文批改页面</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem, index) => (
            <div
              key={classItem.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in-up"
            >
              <ClassCard classItem={classItem} onClick={() => handleClassClick(classItem)} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
