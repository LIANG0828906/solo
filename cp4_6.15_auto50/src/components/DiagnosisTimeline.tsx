import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ClipboardList, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { DiagnosisResult, SeverityLevel } from '@/utils/db';

interface DiagnosisTimelineProps {
  diagnoses: DiagnosisResult[];
  onSelectDiagnosis?: (diagnosis: DiagnosisResult) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

function getWorstSeverity(causes: DiagnosisResult['causes']): SeverityLevel {
  const order: SeverityLevel[] = ['severe', 'moderate', 'mild'];
  for (const level of order) {
    if (causes.some((c) => c.severity === level)) return level;
  }
  return 'mild';
}

function getSeverityLabel(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return '轻微';
    case 'moderate':
      return '中等';
    case 'severe':
      return '严重';
  }
}

function getTimelineDotColor(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return '#22C55E';
    case 'moderate':
      return '#F59E0B';
    case 'severe':
      return '#EF4444';
  }
}

function getTimelineDotRing(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return 'rgb(34 197 94 / 0.35)';
    case 'moderate':
      return 'rgb(245 158 11 / 0.35)';
    case 'severe':
      return 'rgb(239 68 68 / 0.35)';
  }
}

function getSeverityGradient(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return 'linear-gradient(to right, #FEF3C7 0%, #FDE68A 30%, #F59E0B 100%)';
    case 'moderate':
      return 'linear-gradient(to right, #FEF3C7 0%, #FCD34D 30%, #F97316 100%)';
    case 'severe':
      return 'linear-gradient(to right, #FED7AA 0%, #FB923C 30%, #EF4444 100%)';
  }
}

export default function DiagnosisTimeline({
  diagnoses,
  onSelectDiagnosis,
  hasMore,
  onLoadMore,
}: DiagnosisTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (diagnoses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-olive-300 bg-white/50 rounded-2xl border border-dashed border-olive-200">
        <ClipboardList size={48} strokeWidth={1.5} />
        <span className="mt-3 text-sm font-body text-olive-400">暂无诊断记录</span>
        <span className="mt-1 text-xs font-body text-olive-300">记录症状后可在这里查看历史诊断</span>
      </div>
    );
  }

  return (
    <div className="relative py-4 pr-1 md:px-0">
      <div className="absolute left-[17px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-olive-200 via-olive-200 to-transparent" />

      {diagnoses.map((diagnosis, index) => {
        const worstSeverity = getWorstSeverity(diagnosis.causes);
        const isExpanded = expandedId === diagnosis.id;
        const isEven = index % 2 === 0;

        return (
          <div
            key={diagnosis.id}
            className={`relative flex items-start gap-4 mb-10 last:mb-4 ${
              isEven ? 'md:flex-row-reverse' : 'md:flex-row'
            }`}
          >
            <div className="absolute left-[17px] md:left-1/2 -translate-x-1/2 z-10" style={{ top: '0.6rem' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: getTimelineDotRing(worstSeverity) }}
              >
                <div
                  className="w-4 h-4 rounded-full shadow-[0_0_0_2px_#fff,0_2px_8px_rgba(0,0,0,0.15)]"
                  style={{ background: getTimelineDotColor(worstSeverity) }}
                />
              </div>
            </div>

            <div className={`ml-14 md:ml-0 md:w-1/2 ${isEven ? 'md:pr-10' : 'md:pl-10'}`}>
              <div
                className="text-[11px] font-display text-olive-400 mb-1.5 flex items-center gap-1.5"
                title={diagnosis.createdAt}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: getTimelineDotColor(worstSeverity) }}
                />
                {formatDistanceToNow(parseISO(diagnosis.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </div>

              <div
                className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(71,97,23,0.06)] border border-olive-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(71,97,23,0.1)]"
                style={{
                  borderTop: `3px solid ${getTimelineDotColor(worstSeverity)}`,
                }}
                onClick={() => {
                  setExpandedId(isExpanded ? null : diagnosis.id);
                  onSelectDiagnosis?.(diagnosis);
                }}
              >
                <div className="p-4 cursor-pointer">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {diagnosis.causes.slice(0, 3).map((cause, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-body bg-olive-50 text-olive-700 px-2.5 py-1 rounded-full"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: getTimelineDotColor(cause.severity) }}
                          />
                          {cause.name}
                        </span>
                      ))}
                    </div>
                    <span className="shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown size={16} className="text-olive-400" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-olive-400">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                      style={{ background: getTimelineDotColor(worstSeverity) }}
                    >
                      {getSeverityLabel(worstSeverity)}问题
                    </span>
                    {diagnosis.confirmed && (
                      <span className="inline-flex items-center gap-1 text-olive-500 font-medium">
                        <CheckCircle size={12} className="text-olive-400" />
                        已确认
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: isExpanded ? '1200px' : '0px',
                    transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div
                    className="px-4 pb-4 transition-all duration-500"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded
                        ? 'translateX(0) scaleX(1)'
                        : isEven
                        ? 'translateX(16px) scaleX(0.92)'
                        : 'translateX(-16px) scaleX(0.92)',
                      transformOrigin: isEven ? 'right center' : 'left center',
                    }}
                  >
                    <div className="pt-3 border-t border-olive-100 space-y-3">
                      {diagnosis.causes.map((cause, i) => {
                        const probPercent = Math.round(cause.probability * 100);
                        return (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-cream-50 border border-olive-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ background: getTimelineDotColor(cause.severity) }}
                                />
                                <span className="text-sm font-body font-medium text-bark-500">
                                  {cause.name}
                                </span>
                              </div>
                              <span
                                className="font-display font-bold text-sm"
                                style={{ color: getTimelineDotColor(cause.severity) }}
                              >
                                {probPercent}%
                              </span>
                            </div>

                            <div className="mb-2">
                              <div className="h-2.5 rounded-full overflow-hidden bg-olive-100">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: isExpanded ? `${probPercent}%` : '0%',
                                    background: getSeverityGradient(cause.severity),
                                  }}
                                />
                              </div>
                              <div className="flex justify-between mt-1 text-[10px] font-display text-olive-400">
                                <span>警告</span>
                                <span>危险</span>
                              </div>
                            </div>

                            <p className="text-xs text-olive-600 mb-2 leading-relaxed">
                              {cause.description}
                            </p>

                            <div>
                              <p className="text-[10px] font-display font-bold text-olive-400 uppercase tracking-wide mb-1.5">
                                护理建议
                              </p>
                              <ul className="space-y-1.5">
                                {cause.careMeasures.map((measure, j) => (
                                  <li
                                    key={j}
                                    className="flex items-start gap-1.5 text-xs text-olive-500 leading-relaxed"
                                  >
                                    <CheckCircle
                                      size={11}
                                      className="mt-0.5 shrink-0 text-olive-400"
                                    />
                                    <span>{measure}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4 pl-14 md:pl-0">
          <button
            type="button"
            onClick={onLoadMore}
            className="text-sm font-body text-olive-500 hover:text-olive-600 transition inline-flex items-center gap-1.5 bg-white/60 backdrop-blur px-4 py-2 rounded-full border border-olive-200"
          >
            <ChevronUp size={14} />
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
