import { useMemo, useState, useEffect } from 'react';
import { useStore } from './store';
import { highlightKeywords, type ScoringPoint } from './ScoringRule';
import { Check, Sparkles } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
}

function ProgressBar({ label, value, max }: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const percentDisplay = percent.toFixed(0);
  const barColor =
    percent >= 80 ? '#22c55e' : percent >= 60 ? '#84cc16' : percent >= 40 ? '#eab308' : '#f87171';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-800 font-semibold">
            {value} / {max}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${barColor}22`,
              color: barColor,
            }}
          >
            {percentDisplay}%
          </span>
        </div>
      </div>
      <div
        className="w-full bg-slate-100 overflow-hidden relative"
        style={{ height: '12px', borderRadius: '6px' }}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
            borderRadius: '6px',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '6px',
          }}
        />
      </div>
    </div>
  );
}

interface ScoringTagProps {
  point: ScoringPoint;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ScoringTag({ point, checked, onChange }: ScoringTagProps) {
  const isAutoMatched = point.autoMatched;
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium select-none whitespace-nowrap group"
      style={{
        backgroundColor: checked ? '#dbeafe' : '#f1f5f9',
        color: checked ? '#1e40af' : '#475569',
        borderRadius: '8px',
        border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: checked ? '0 1px 3px rgba(59,130,246,0.15)' : 'none',
        position: 'relative',
      }}
    >
      {checked && (
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: '#1e40af',
            color: 'white',
          }}
        >
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      {isAutoMatched && !checked && (
        <Sparkles size={14} style={{ color: '#f59e0b' }} />
      )}
      <span>{point.description}</span>
    </button>
  );
}

export default function ReviewPanel() {
  const { selectedId, assignments, switchKey, updateScoringPoint, submitReview } = useStore();
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignment = useMemo(
    () => assignments.find((a) => a.id === selectedId),
    [assignments, selectedId]
  );

  useEffect(() => {
    setIsVisible(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [switchKey]);

  const highlightedSegments = useMemo(() => {
    if (!assignment) return [];
    const keywords: string[] = [];
    assignment.scoringPoints
      .filter((p) => p.checked || p.autoMatched)
      .forEach((p) => {
        keywords.push(p.keyword);
        keywords.push(...p.synonyms);
      });
    return highlightKeywords(assignment.studentAnswer, keywords);
  }, [assignment]);

  const wordCount = assignment?.studentAnswer.length ?? 0;

  const handleSubmit = () => {
    if (!assignment || assignment.status === 'reviewed') return;
    setIsSubmitting(true);
    setTimeout(() => {
      submitReview(assignment.id);
      setIsSubmitting(false);
    }, 200);
  };

  if (!assignment) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">📝</div>
          <div className="text-lg">请从左侧选择一道题目进行批阅</div>
        </div>
      </div>
    );
  }

  const totalPercent =
    assignment.score.maxTotalScore > 0
      ? (assignment.score.totalScore / assignment.score.maxTotalScore) * 100
      : 0;

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div
        className="flex-shrink-0 p-6 pb-4"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center justify-center font-bold text-xs rounded-md text-white"
                style={{
                  width: '28px',
                  height: '22px',
                  backgroundColor: '#3b82f6',
                }}
              >
                #{assignment.index}
              </span>
              <h2 className="text-base md:text-lg font-semibold text-slate-800 leading-snug">
                {assignment.question}
              </h2>
            </div>
          </div>
          <span
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            style={{
              backgroundColor: assignment.status === 'reviewed' ? '#dcfce7' : '#fef3c7',
              color: assignment.status === 'reviewed' ? '#166534' : '#92400e',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: assignment.status === 'reviewed' ? '#22c55e' : '#f59e0b',
              }}
            />
            {assignment.status === 'reviewed' ? '已批阅' : '未批阅'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 px-6 pb-6 min-h-0 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <span
                className="inline-block w-1 h-4 rounded-full"
                style={{ backgroundColor: '#3b82f6' }}
              />
              学生答案原文
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              共 {wordCount} 字
            </span>
          </div>
          <div
            className="rounded-lg p-5 overflow-y-auto shadow-inner"
            style={{
              backgroundColor: '#f8fafc',
              fontSize: '14px',
              lineHeight: '1.8',
              border: '1px solid #e2e8f0',
              maxHeight: '280px',
            }}
          >
            <div className="text-slate-700">
              {highlightedSegments.map((seg, i) =>
                seg.highlighted ? (
                  <mark
                    key={i}
                    style={{
                      backgroundColor: '#fef08a',
                      color: '#854d0e',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      fontWeight: 500,
                    }}
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <span
                className="inline-block w-1 h-4 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              评分点勾选（关键词匹配）
            </h3>
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Sparkles size={12} />
              带 ✨ 的为系统自动匹配建议
            </span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
            {assignment.scoringPoints.map((point) => (
              <ScoringTag
                key={point.id}
                point={point}
                checked={point.checked}
                onChange={(checked) => updateScoringPoint(assignment.id, point.id, checked)}
              />
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5 border"
          style={{
            background:
              'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderColor: '#e2e8f0',
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5">
            <div className="flex items-end gap-5">
              <div className="relative">
                <div className="text-xs text-slate-500 mb-2 font-medium">总分</div>
                <div
                  className="flex items-baseline gap-1 leading-none font-bold tracking-tight"
                  style={{
                    fontSize: '48px',
                    color: totalPercent >= 60 ? '#1e293b' : '#dc2626',
                    lineHeight: 1,
                  }}
                >
                  <span
                    style={{
                      background:
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {assignment.score.totalScore}
                  </span>
                  <span
                    className="font-normal"
                    style={{
                      fontSize: '18px',
                      color: '#94a3b8',
                    }}
                  >
                    /{assignment.score.maxTotalScore}
                  </span>
                </div>
              </div>
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  backgroundColor:
                    totalPercent >= 80
                      ? '#dcfce7'
                      : totalPercent >= 60
                        ? '#fef9c3'
                        : '#fee2e2',
                }}
              >
                <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                  评级
                </div>
                <div
                  className="font-bold"
                  style={{
                    fontSize: '18px',
                    color:
                      totalPercent >= 80
                        ? '#166534'
                        : totalPercent >= 60
                          ? '#854d0e'
                          : '#991b1b',
                  }}
                >
                  {totalPercent >= 90
                    ? '优秀'
                    : totalPercent >= 80
                      ? '良好'
                      : totalPercent >= 60
                        ? '及格'
                        : '待提高'}
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>综合完成度</span>
                <span>{totalPercent.toFixed(0)}%</span>
              </div>
              <div
                className="w-full bg-slate-200 overflow-hidden"
                style={{ height: '8px', borderRadius: '4px' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${totalPercent}%`,
                    background:
                      totalPercent >= 60
                        ? 'linear-gradient(90deg, #3b82f6, #22c55e)'
                        : 'linear-gradient(90deg, #f87171, #eab308)',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <ProgressBar
              label="📚 内容分"
              value={assignment.score.contentScore}
              max={assignment.score.maxContentScore}
            />
            <ProgressBar
              label="✍️ 表达分"
              value={assignment.score.expressionScore}
              max={assignment.score.maxExpressionScore}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={assignment.status === 'reviewed'}
            className="relative overflow-hidden font-semibold"
            style={{
              width: '140px',
              height: '44px',
              backgroundColor: assignment.status === 'reviewed' ? '#94a3b8' : '#3b82f6',
              color: 'white',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: assignment.status === 'reviewed' ? 'not-allowed' : 'pointer',
              transition:
                'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
              transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
              boxShadow:
                assignment.status === 'reviewed'
                  ? 'none'
                  : '0 4px 12px rgba(59,130,246,0.35)',
            }}
            onMouseEnter={(e) => {
              if (assignment.status !== 'reviewed') {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.45)';
              }
            }}
            onMouseLeave={(e) => {
              if (assignment.status !== 'reviewed') {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)';
              }
            }}
            onMouseDown={(e) => {
              if (assignment.status !== 'reviewed') {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (assignment.status !== 'reviewed') {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {assignment.status === 'reviewed' ? '✓ 已提交' : '提交批阅'}
          </button>
        </div>
      </div>
    </div>
  );
}
