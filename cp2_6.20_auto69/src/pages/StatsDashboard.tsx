import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Moon, Sun, BookOpen } from 'lucide-react';
import { BarChart } from '@/components/BarChart';
import { PieChart } from '@/components/PieChart';
import { RadarChart } from '@/components/RadarChart';
import { classApi, statsApi } from '@/api';
import type { Class, DimensionStats, GradeDistribution, RadarData } from '@/types';

export const StatsDashboard: React.FC = () => {
  const { classId } = useParams<{ classId?: string }>();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(classId || '');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isDark, setIsDark] = useState(false);
  const [dimensionStats, setDimensionStats] = useState<DimensionStats[]>([]);
  const [distribution, setDistribution] = useState<GradeDistribution[]>([]);
  const [radarData, setRadarData] = useState<RadarData[]>([]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await classApi.getClasses();
        if (res.code === 200) {
          setClasses(res.data);
          if (!selectedClass && res.data.length > 0) {
            setSelectedClass(res.data[0].id);
          }
        }
      } catch {
        const mockClasses: Class[] = [
          { id: 'class-001', name: '高三(1)班', studentCount: 45, lastGradedDate: '2024-01-15' },
          { id: 'class-002', name: '高三(2)班', studentCount: 42, lastGradedDate: '2024-01-14' },
          { id: 'class-003', name: '高三(3)班', studentCount: 48, lastGradedDate: '2024-01-13' },
          { id: 'class-004', name: '高二(1)班', studentCount: 40, lastGradedDate: '2024-01-12' },
          { id: 'class-005', name: '高二(2)班', studentCount: 43, lastGradedDate: '2024-01-11' },
        ];
        setClasses(mockClasses);
        if (!selectedClass) setSelectedClass('class-001');
      }
    };
    loadClasses();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;

    const loadStats = async () => {
      try {
        const [dimRes, distRes, radarRes] = await Promise.all([
          statsApi.getDimensions(selectedClass),
          statsApi.getDistribution(selectedClass),
          statsApi.getStudentRadar('essay-001'),
        ]);
        if (dimRes.code === 200) setDimensionStats(dimRes.data);
        if (distRes.code === 200) setDistribution(distRes.data);
        if (radarRes.code === 200) setRadarData(radarRes.data);
      } catch {
        setDimensionStats([
          { dimension: '内容', average: 7.8, color: '#1976d2' },
          { dimension: '语言', average: 7.2, color: '#4caf50' },
          { dimension: '结构', average: 8.1, color: '#ff9800' },
          { dimension: '创意', average: 6.9, color: '#9c27b0' },
        ]);
        setDistribution([
          { grade: '优秀(>90)', count: 8, color: '#4caf50' },
          { grade: '良好(80-90)', count: 18, color: '#1976d2' },
          { grade: '中等(70-80)', count: 12, color: '#ff9800' },
          { grade: '待提升(<70)', count: 7, color: '#f44336' },
        ]);
        setRadarData([
          { dimension: '内容', student: 8, classAverage: 7.5 },
          { dimension: '语言', student: 7, classAverage: 7.2 },
          { dimension: '结构', student: 9, classAverage: 7.8 },
          { dimension: '创意', student: 6, classAverage: 6.9 },
        ]);
      }
    };
    loadStats();
  }, [selectedClass, dateRange]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const overview = useMemo(() => {
    const total = distribution.reduce((sum, d) => sum + d.count, 0);
    const avgDim = dimensionStats.reduce((sum, d) => sum + d.average, 0);
    const avg = dimensionStats.length > 0 ? (avgDim / dimensionStats.length) * 10 : 0;
    return { total, avg: avg.toFixed(1) };
  }, [distribution, dimensionStats]);

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="bg-bg-panel shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-text-secondary hover:text-brand transition-colors text-sm"
            >
              <ArrowLeft size={18} />
              返回班级
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                <BarChart3 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">统计仪表盘</h1>
                <p className="text-xs text-text-secondary">多维度评分数据可视化</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">班级：</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="dropdown px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-bg-panel text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">日期范围：</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-bg-panel text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <span className="text-text-secondary">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-bg-panel text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-panel rounded-xl shadow-card p-6">
            <p className="text-sm text-text-secondary mb-1">已批改作文</p>
            <p className="text-3xl font-bold text-brand">{overview.total}</p>
            <p className="text-xs text-text-secondary mt-2">份</p>
          </div>
          <div className="bg-bg-panel rounded-xl shadow-card p-6">
            <p className="text-sm text-text-secondary mb-1">班级平均分</p>
            <p className="text-3xl font-bold text-positive">{overview.avg}</p>
            <p className="text-xs text-text-secondary mt-2">满分100分</p>
          </div>
          <div className="bg-bg-panel rounded-xl shadow-card p-6">
            <p className="text-sm text-text-secondary mb-1">当前班级学生</p>
            <p className="text-3xl font-bold text-improvement">
              {classes.find((c) => c.id === selectedClass)?.studentCount || 0}
            </p>
            <p className="text-xs text-text-secondary mt-2">人</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-panel rounded-xl shadow-card p-6 animate-fade-in-up">
            <BarChart data={dimensionStats} />
          </div>
          <div className="bg-bg-panel rounded-xl shadow-card p-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <PieChart data={distribution} />
          </div>
          <div className="bg-bg-panel rounded-xl shadow-card p-6 md:col-span-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <RadarChart data={radarData} />
          </div>
        </div>
      </main>
    </div>
  );
};
