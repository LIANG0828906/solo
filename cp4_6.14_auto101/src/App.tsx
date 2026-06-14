import { useState } from 'react';
import { useStore } from './store';
import ReviewPanel from './ReviewPanel';
import { ChevronDown, List, BookOpen } from 'lucide-react';

export default function App() {
  const { assignments, selectedId, setSelectedQuestion } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const reviewedCount = assignments.filter((a) => a.status === 'reviewed').length;

  const selectedAssignment = assignments.find((a) => a.id === selectedId);

  const summary = (text: string, len = 20): string => {
    if (text.length <= len) return text;
    return text.slice(0, len) + '...';
  };

  return (
    <div
      className="w-full h-screen flex flex-col bg-slate-50"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 h-14 border-b"
        style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: '#3b82f6' }} />
          <h1 className="text-lg font-semibold text-slate-800">智能作业批阅看板</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">
            待批阅：<span className="font-semibold text-amber-600">{pendingCount}</span>
          </span>
          <span className="text-slate-500">
            已批阅：<span className="font-semibold text-green-600">{reviewedCount}</span>
          </span>
        </div>
      </header>

      <div className="md:hidden flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-200"
          >
            <span className="flex items-center gap-2">
              <List size={16} />
              第 {selectedAssignment?.index} 题：{selectedAssignment?.question.slice(0, 15)}...
            </span>
            <ChevronDown size={16} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
              {assignments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuestion(a.id);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm border-l-4 hover:bg-slate-50"
                  style={{
                    borderLeftColor:
                      a.status === 'reviewed' ? '#22c55e' : '#94a3b8',
                    backgroundColor: a.id === selectedId ? '#eff6ff' : 'transparent',
                    color: a.id === selectedId ? '#1e40af' : '#334155',
                  }}
                >
                  <div className="font-medium">第 {a.index} 题</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {summary(a.studentAnswer)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside
          className="hidden md:flex flex-shrink-0 flex-col gap-3 p-4 overflow-y-auto border-r bg-white"
          style={{ width: '280px', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-700">题目列表</h2>
            <span className="text-xs text-slate-400">共 {assignments.length} 题</span>
          </div>

          <div className="flex flex-col" style={{ gap: '12px' }}>
            {assignments.map((a) => {
              const isSelected = a.id === selectedId;
              const isReviewed = a.status === 'reviewed';

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedQuestion(a.id)}
                  className="text-left rounded-lg border transition-all duration-200"
                  style={{
                    padding: '16px',
                    borderWidth: isReviewed ? '0 0 0 4px' : '1px',
                    borderStyle: 'solid',
                    borderColor: isReviewed ? '#22c55e' : '#94a3b8',
                    backgroundColor: isSelected ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? '#1e40af' : '#1e293b' }}
                    >
                      第 {a.index} 题
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isReviewed ? '#dcfce7' : '#f1f5f9',
                        color: isReviewed ? '#166534' : '#64748b',
                      }}
                    >
                      {isReviewed ? '已批阅' : '未批阅'}
                    </span>
                  </div>
                  <p
                    className="text-sm text-slate-500 truncate"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.5,
                    }}
                  >
                    {summary(a.studentAnswer, 40)}
                  </p>
                  {isReviewed && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      得分：{a.score.totalScore} / {a.score.maxTotalScore}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-white">
          <ReviewPanel />
        </main>
      </div>
    </div>
  );
}
