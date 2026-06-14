import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import ReviewPanel from './ReviewPanel';
import {
  ChevronDown,
  List,
  BookOpen,
  Clock,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import type { Assignment } from './store';

function QuestionCard({
  item,
  isSelected,
  onClick,
  switchKey,
}: {
  item: Assignment;
  isSelected: boolean;
  onClick: () => void;
  switchKey: number;
}) {
  const isReviewed = item.status === 'reviewed';
  const scorePct =
    item.score.maxTotalScore > 0
      ? (item.score.totalScore / item.score.maxTotalScore) * 100
      : 0;

  const cardBg = isReviewed
    ? isSelected
      ? '#dcfce7'
      : '#f0fdf4'
    : isSelected
      ? '#eff6ff'
      : 'white';

  const borderColor = isReviewed ? '#22c55e' : isSelected ? '#3b82f6' : '#cbd5e1';
  const borderStyle: React.CSSProperties = {
    borderLeftWidth: isReviewed ? '4px' : isSelected ? '4px' : '1px',
    borderTopWidth: isReviewed || isSelected ? '1px' : '1px',
    borderRightWidth: isReviewed || isSelected ? '1px' : '1px',
    borderBottomWidth: isReviewed || isSelected ? '1px' : '1px',
    borderLeftColor: borderColor,
    borderTopColor: isReviewed || isSelected ? borderColor : '#94a3b8',
    borderRightColor: isReviewed || isSelected ? borderColor : '#94a3b8',
    borderBottomColor: isReviewed || isSelected ? borderColor : '#94a3b8',
  };

  return (
    <button
      type="button"
      key={`${item.id}-${switchKey}`}
      onClick={onClick}
      className="w-full text-left rounded-lg card-fade-in"
      style={{
        padding: '16px',
        backgroundColor: cardBg,
        cursor: 'pointer',
        transition:
          'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        ...borderStyle,
        boxShadow: isSelected
          ? '0 4px 12px rgba(59,130,246,0.12), 0 1px 3px rgba(15,23,42,0.04)'
          : '0 1px 2px rgba(15,23,42,0.04)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow =
            '0 4px 10px rgba(15,23,42,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isSelected
          ? '0 4px 12px rgba(59,130,246,0.12), 0 1px 3px rgba(15,23,42,0.04)'
          : '0 1px 2px rgba(15,23,42,0.04)';
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center text-xs font-bold rounded text-white"
            style={{
              width: '24px',
              height: '22px',
              backgroundColor: isReviewed ? '#22c55e' : '#64748b',
            }}
          >
            {item.index}
          </span>
          {isReviewed ? (
            <span className="text-[10px] font-bold flex items-center gap-1 text-green-700">
              <CheckCircle2 size={12} />
              已批阅
            </span>
          ) : (
            <span className="text-[10px] font-bold flex items-center gap-1 text-amber-600">
              <Clock size={12} />
              待批阅
            </span>
          )}
        </div>
        {isReviewed && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor:
                scorePct >= 60 ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
              color: scorePct >= 60 ? '#16a34a' : '#dc2626',
            }}
          >
            {item.score.totalScore}分
          </span>
        )}
      </div>

      <p
        className="text-sm text-slate-600 mb-3"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
          minHeight: '3em',
        }}
      >
        {item.question.length > 20
          ? item.question.slice(0, 20) + '...'
          : item.question}
      </p>

      <p
        className="text-xs text-slate-400 border-t pt-2"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
          borderTopStyle: 'dashed',
          borderTopColor: isReviewed ? '#86efac' : '#e2e8f0',
        }}
      >
        💬 {item.studentAnswer.slice(0, 20)}
        {item.studentAnswer.length > 20 ? '...' : ''}
      </p>
    </button>
  );
}

export default function App() {
  const { assignments, selectedId, setSelectedQuestion, switchKey } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const reviewedCount = assignments.filter((a) => a.status === 'reviewed').length;
  const totalScoreAvg = assignments.length
    ? Math.round(
        assignments.reduce((s, a) => s + a.score.totalScore, 0) /
          assignments.length
      )
    : 0;

  const selectedAssignment = assignments.find((a) => a.id === selectedId);

  useEffect(() => {
    const check = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  return (
    <div
      className="w-full h-screen flex flex-col bg-slate-50"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <style>{`
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
        }
        @media (min-width: 768px) {
          .mobile-top-bar-dropdown { display: none !important; }
          .mobile-only-sidebar-toggle { display: none !important; }
        }
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-fade-in {
          animation: cardFadeIn 0.3s ease;
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .slide-in-left {
          animation: slideInLeft 0.3s ease;
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-in-backdrop {
          animation: fadeInBackdrop 0.2s ease;
        }
      `}</style>

      <header
        className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 border-b"
        style={{
          backgroundColor: 'white',
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            className="mobile-only-sidebar-toggle p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
            onClick={() => setMobileSidebarOpen(true)}
            style={{ display: isMobileViewport ? 'block' : 'none' }}
          >
            <Menu size={20} />
          </button>
          <BookOpen size={20} md={22} style={{ color: '#3b82f6' }} />
          <h1 className="text-base md:text-lg font-bold text-slate-800 whitespace-nowrap">
            智能作业批阅看板
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-5 text-xs md:text-sm">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#f59e0b' }}
            />
            <span className="text-amber-700 font-semibold">
              待批阅 {pendingCount}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-50 border border-green-100">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span className="text-green-700 font-semibold">
              已批阅 {reviewedCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-blue-700 font-semibold whitespace-nowrap">
              平均分 {totalScoreAvg}
            </span>
          </div>
        </div>
      </header>

      <div
        className="mobile-top-bar-dropdown flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200"
        ref={dropdownRef}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            style={{
              backgroundColor: dropdownOpen ? '#f8fafc' : 'white',
              borderColor: dropdownOpen ? '#3b82f6' : '#e2e8f0',
            }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <List size={16} style={{ flexShrink: 0 }} />
              <span className="truncate text-left font-medium">
                {selectedAssignment
                  ? `第 ${selectedAssignment.index} 题：${selectedAssignment.question.slice(0, 18)}`
                  : '请选择题目'}
                {selectedAssignment?.question &&
                selectedAssignment.question.length > 18
                  ? '...'
                  : ''}
              </span>
            </span>
            <ChevronDown
              size={16}
              style={{
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>
          {dropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 fade-in-backdrop"
              style={{ boxShadow: '0 12px 30px rgba(15,23,42,0.12)' }}
            >
              {assignments.map((a, idx) => {
                const isSel = a.id === selectedId;
                const isRev = a.status === 'reviewed';
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(a.id);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm border-l-4 hover:bg-slate-50 transition-colors"
                    style={{
                      borderLeftColor: isRev ? '#22c55e' : '#cbd5e1',
                      backgroundColor: isSel ? '#eff6ff' : 'transparent',
                      borderBottomWidth:
                        idx < assignments.length - 1 ? '1px' : '0',
                      borderBottomStyle: 'solid',
                      borderBottomColor: '#f1f5f9',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center text-[10px] font-bold rounded text-white"
                          style={{
                            width: '20px',
                            height: '18px',
                            backgroundColor: isSel
                              ? '#3b82f6'
                              : isRev
                                ? '#22c55e'
                                : '#94a3b8',
                          }}
                        >
                          {a.index}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            color: isSel ? '#1e40af' : '#334155',
                          }}
                        >
                          {isRev ? '已批阅' : '待批阅'}
                        </span>
                      </div>
                      {isRev && (
                        <span className="text-xs font-bold text-green-600">
                          {a.score.totalScore}分
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {a.studentAnswer.slice(0, 25)}
                      {a.studentAnswer.length > 25 ? '...' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {mobileSidebarOpen && isMobileViewport && (
          <>
            <div
              className="fixed inset-0 z-40 fade-in-backdrop"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside
              className="fixed top-0 left-0 bottom-0 z-50 flex flex-col gap-3 p-4 overflow-y-auto slide-in-left shadow-2xl"
              style={{
                width: 'min(320px, 85vw)',
                backgroundColor: 'white',
              }}
            >
              <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <List size={18} style={{ color: '#3b82f6' }} />
                  <h2 className="text-sm font-bold text-slate-700">题目列表</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-2 px-1 text-xs">
                <div className="flex-1 px-2 py-1.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-center">
                  待批阅 {pendingCount}
                </div>
                <div className="flex-1 px-2 py-1.5 rounded-md bg-green-50 text-green-700 font-semibold text-center">
                  已批阅 {reviewedCount}
                </div>
              </div>
              <div className="flex flex-col" style={{ gap: '12px' }}>
                {assignments.map((a) => (
                  <QuestionCard
                    key={a.id}
                    item={a}
                    isSelected={a.id === selectedId}
                    onClick={() => {
                      setSelectedQuestion(a.id);
                      setMobileSidebarOpen(false);
                    }}
                    switchKey={switchKey}
                  />
                ))}
              </div>
            </aside>
          </>
        )}

        <aside
          className="sidebar-desktop flex-shrink-0 flex-col gap-3 p-4 overflow-y-auto border-r bg-white hidden"
          style={{
            width: '280px',
            borderColor: '#e2e8f0',
            display: 'flex',
          }}
        >
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <List size={16} style={{ color: '#3b82f6' }} />
              <h2 className="text-sm font-bold text-slate-700">题目列表</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              共 {assignments.length} 题
            </span>
          </div>

          <div className="flex gap-2 px-1 text-xs">
            <div className="flex-1 px-2 py-1.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-center">
              待 {pendingCount}
            </div>
            <div className="flex-1 px-2 py-1.5 rounded-md bg-green-50 text-green-700 font-semibold text-center">
              完 {reviewedCount}
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: '12px' }}>
            {assignments.map((a) => (
              <QuestionCard
                key={a.id}
                item={a}
                isSelected={a.id === selectedId}
                onClick={() => setSelectedQuestion(a.id)}
                switchKey={switchKey}
              />
            ))}
          </div>
        </aside>

        <main
          className="flex-1 min-w-0 bg-white overflow-hidden"
          style={{
            borderLeft: '0px solid #e2e8f0',
          }}
        >
          <ReviewPanel />
        </main>
      </div>
    </div>
  );
}
