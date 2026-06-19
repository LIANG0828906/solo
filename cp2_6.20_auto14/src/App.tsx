import React, { useCallback, useRef, useState } from 'react';
import { BookOpen, GraduationCap, Sparkles, Zap, Menu, X } from 'lucide-react';
import PathGenerator from '@/path/PathGenerator';
import SelfEvalPanel from '@/assessment/SelfEvalPanel';
import RadarChart from '@/charts/RadarChart';
import SpeedChart from '@/charts/SpeedChart';
import { useLearningStore } from '@/store/useLearningStore';
import { SUBJECT_LABELS, LEVEL_LABELS } from '@/types';
import type { Subject, Level } from '@/types';

const App: React.FC = () => {
  const { subject, level, setSubject, setLevel, generatePath, isGenerating, error } =
    useLearningStore();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rippleIdRef = useRef(0);

  const handleGenerateClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      generatePath();
    },
    [generatePath]
  );

  const subjects = Object.entries(SUBJECT_LABELS) as [Subject, string][];
  const levels = Object.entries(LEVEL_LABELS) as [Level, string][];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefcbf' }}>
      <header
        className="text-white py-6 px-4 md:px-8 shadow-lg"
        style={{ backgroundColor: '#1a365d' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#ed8936' }}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">自适应学习路径生成器</h1>
              <p className="text-sm text-blue-200 hidden md:block">
                智能规划个性化学习路径，提升学习效率
              </p>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <section
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          style={{ animation: 'fadeIn 0.5s ease' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5" style={{ color: '#ed8936' }} />
            <h2 className="text-xl font-bold" style={{ color: '#1a365d' }}>
              设置学习参数
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                选择学科
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors text-gray-700 font-medium bg-white"
              >
                {subjects.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                初始水平
              </label>
              <div className="flex gap-2">
                {levels.map(([value, label], index) => (
                  <button
                    key={value}
                    onClick={() => setLevel(value)}
                    className={`
                      flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-300
                      ${level === value
                        ? 'text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                    style={{
                      backgroundColor: level === value ? '#1a365d' : undefined,
                      animation: level === value ? `fadeIn 0.3s ease` : undefined,
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="btn-ripple w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ed8936' }}
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    生成学习路径
                  </>
                )}
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="ripple-effect"
                    style={{
                      left: ripple.x - 15,
                      top: ripple.y - 15,
                      width: 30,
                      height: 30,
                    }}
                  />
                ))}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </section>

        <section
          className="bg-white/50 rounded-2xl shadow-lg mb-8 overflow-hidden"
          style={{ animation: 'fadeIn 0.6s ease 0.1s both' }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'rgba(26, 54, 93, 0.1)' }}
          >
            <h2 className="text-xl font-bold" style={{ color: '#1a365d' }}>
              📚 学习路径时间线
            </h2>
          </div>
          <div className="p-4 md:p-6">
            <PathGenerator />
          </div>
        </section>

        <div className="radar-chart-scroll grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RadarChart />
          </div>

          <div className="lg:col-span-1">
            <SelfEvalPanel />
          </div>

          <div className="lg:col-span-1">
            <SpeedChart />
          </div>
        </div>
      </main>

      <footer
        className="py-6 px-4 mt-12 text-center text-sm"
        style={{ color: 'rgba(26, 54, 93, 0.5)' }}
      >
        <p>自适应学习路径生成器 © 2026 | 智能教育，因材施教</p>
      </footer>
    </div>
  );
};

export default App;
