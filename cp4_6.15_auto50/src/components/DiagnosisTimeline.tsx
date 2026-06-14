import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ClipboardList, CheckCircle } from 'lucide-react';
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

function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'mild':
      return 'bg-green-400';
    case 'moderate':
      return 'bg-orange-400';
    case 'severe':
      return 'bg-red-500';
  }
}

function getSeverityDotColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'mild':
      return 'bg-green-400';
    case 'moderate':
      return 'bg-orange-400';
    case 'severe':
      return 'bg-red-500';
  }
}

export default function DiagnosisTimeline({
  diagnoses,
  onSelectDiagnosis,
  hasMore,
  onLoadMore,
}: DiagnosisTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (diagnoses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-olive-300">
        <ClipboardList size={48} />
        <span className="mt-3 text-sm">暂无诊断记录</span>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-olive-200" />

      {diagnoses.map((diagnosis, index) => {
        const worstSeverity = getWorstSeverity(diagnosis.causes);
        const isExpanded = expandedId === diagnosis.id;
        const isEven = index % 2 === 0;

        return (
          <div
            key={diagnosis.id}
            className={`relative flex items-start gap-4 mb-8 ${
              isEven ? 'md:flex-row-reverse' : 'md:flex-row'
            }`}
          >
            <div
              className={`absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 ${getSeverityColor(worstSeverity)}`}
              style={{ top: '0.5rem' }}
            />

            <div className={`ml-14 md:ml-0 md:w-1/2 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
              <div className="text-xs text-olive-400 font-display mb-1">
                {formatDistanceToNow(parseISO(diagnosis.createdAt), { addSuffix: true, locale: zhCN })}
              </div>

              <div
                className="bg-white rounded-xl p-4 shadow-sm border border-olive-100 max-w-xs cursor-pointer"
                onClick={() => {
                  setExpandedId(isExpanded ? null : diagnosis.id);
                  onSelectDiagnosis?.(diagnosis);
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {diagnosis.causes.slice(0, 3).map((cause, i) => (
                    <span key={i} className="flex items-center gap-1 text-sm font-body">
                      <span className={`w-2 h-2 rounded-full ${getSeverityDotColor(cause.severity)}`} />
                      {cause.name}
                    </span>
                  ))}
                </div>

                {diagnosis.confirmed && (
                  <div className="flex items-center gap-1 mt-2 text-olive-500 text-xs">
                    <CheckCircle size={14} />
                    已确认
                  </div>
                )}

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  style={{
                    transform: isExpanded ? 'scaleX(1)' : 'scaleX(0.95)',
                    transformOrigin: isEven ? 'right' : 'left',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                  }}
                >
                  <div className="pt-3 mt-3 border-t border-olive-100">
                    {diagnosis.causes.map((cause, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-body font-medium">{cause.name}</span>
                          <span className="text-xs text-olive-500 font-display font-bold">
                            {Math.round(cause.probability * 100)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-olive-100 overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${cause.probability * 100}%`,
                              background: `linear-gradient(to right, #F59E0B, #F97316, #EF4444)`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-olive-600 mb-1">{cause.description}</p>
                        <ul className="space-y-0.5">
                          {cause.careMeasures.map((measure, j) => (
                            <li key={j} className="text-xs text-olive-500 flex items-start gap-1">
                              <CheckCircle size={10} className="mt-0.5 shrink-0 text-olive-400" />
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-olive-500 hover:text-olive-600 transition"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
