import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { useOkrStore } from '@/store/useOkrStore';
import type { KeyResult } from '@/types';
import {
  buildRadarData,
  buildStackedBarData,
  buildPieData,
  FAILURE_REASON_OPTIONS,
} from '@/modules/report/utils/chartConfig';
import { getProgressInfo } from '@/modules/okr/utils/progressCalculator';

export default function ReportPage() {
  const { quarterId } = useParams();
  const quarters = useOkrStore((s) => s.quarters);
  const allObjectives = useOkrStore((s) => s.objectives);
  const allKeyResults = useOkrStore((s) => s.keyResults);
  const failureReasons = useOkrStore((s) => s.failureReasons);
  const setFailureReasons = useOkrStore((s) => s.setFailureReasons);

  const currentQuarter = quarters.find((q) => q.id === quarterId);
  const objectives = allObjectives.filter((o) => o.quarterId === quarterId);
  const keyResults = allKeyResults.filter((kr) =>
    objectives.some((o) => o.id === kr.objectiveId)
  );

  const radarData = useMemo(() => buildRadarData(objectives, keyResults), [objectives, keyResults]);
  const stackedData = useMemo(() => buildStackedBarData(objectives, keyResults), [objectives, keyResults]);
  const pieData = useMemo(() => buildPieData(failureReasons), [failureReasons]);

  const incompleteKRs = keyResults.filter((kr) => {
    const p = getProgressInfo(kr.type, kr.initialValue, kr.targetValue, kr.currentValue);
    return p.percentage < 100;
  });

  const overallProgress = useMemo(() => {
    if (keyResults.length === 0) return 0;
    let total = 0;
    keyResults.forEach((kr) => {
      total += getProgressInfo(kr.type, kr.initialValue, kr.targetValue, kr.currentValue).percentage;
    });
    return Math.round(total / keyResults.length);
  }, [keyResults]);

  const getKRProgress = (kr: KeyResult) =>
    getProgressInfo(kr.type, kr.initialValue, kr.targetValue, kr.currentValue);

  const getObjectiveTitle = (objId: string) => objectives.find((o) => o.id === objId)?.title || '';

  const handleToggleReason = (krId: string, reason: string) => {
    const existing = failureReasons.find((fr) => fr.keyResultId === krId)?.reasons || [];
    const updated = existing.includes(reason)
      ? existing.filter((r) => r !== reason)
      : [...existing, reason];
    setFailureReasons(krId, updated);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h2
                className="text-[22px] font-bold text-gray-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {currentQuarter?.name} 复盘报告
              </h2>
              <p className="text-[12px] text-gray-500 mt-1">
                共 {objectives.length} 个目标 · {keyResults.length} 个关键成果
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div
                className="text-[28px] font-bold tabular-nums"
                style={{
                  color: overallProgress <= 30 ? '#ef4444' : overallProgress <= 70 ? '#f59e0b' : '#22c55e',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'color 1000ms ease-in-out',
                }}
              >
                {overallProgress}%
              </div>
              <div className="text-[11px] text-gray-500">整体完成率</div>
            </div>
            <div className="text-center">
              <div
                className="text-[28px] font-bold tabular-nums text-teal-600"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {keyResults.filter((kr) => getKRProgress(kr).percentage === 100).length}
                <span className="text-[14px] text-gray-400 font-normal"> / {keyResults.length}</span>
              </div>
              <div className="text-[11px] text-gray-500">已完成关键成果</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6" style={{ backgroundColor: '#fafafa' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              目标完成率雷达图
            </h3>
            <div className="h-[320px]">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <defs>
                      <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0f2f1" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    <PolarGrid
                      stroke="#e5e7eb"
                      fill="url(#gridGradient)"
                      fillOpacity={0.5}
                    />
                    <PolarAngleAxis
                      dataKey="objective"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      tickCount={5}
                    />
                    <Radar
                      name="完成率"
                      dataKey="完成率"
                      stroke="#0d9488"
                      fill="url(#radarGradient)"
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '完成率']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-[13px]">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              关键成果进度堆叠图
            </h3>
            <div className="h-[320px]">
              {stackedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackedData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="已完成" stackId="a" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="未完成" stackId="a" fill="#e5e7eb" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-[13px]">
                  暂无数据
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            未完成原因分布
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} 个关键成果`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-[13px] gap-2">
                  <CheckSquare className="w-10 h-10 text-gray-200" />
                  <p>请先为下方未完成关键成果勾选原因</p>
                </div>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-3 pr-2">
              {incompleteKRs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-[13px]">
                  <p>🎉 所有关键成果均已完成！</p>
                </div>
              ) : (
                incompleteKRs.map((kr) => {
                  const progress = getKRProgress(kr);
                  const checkedReasons =
                    failureReasons.find((fr) => fr.keyResultId === kr.id)?.reasons || [];
                  return (
                    <div
                      key={kr.id}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-400 mb-0.5">
                            {getObjectiveTitle(kr.objectiveId)}
                          </p>
                          <p className="text-[13px] font-medium text-gray-800">{kr.title}</p>
                        </div>
                        <span
                          className="text-[12px] font-bold tabular-nums"
                          style={{ color: progress.color }}
                        >
                          {progress.percentage}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-200 overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-in-out"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: progress.color,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {FAILURE_REASON_OPTIONS.map((reason) => {
                          const isChecked = checkedReasons.includes(reason);
                          return (
                            <button
                              key={reason}
                              onClick={() => handleToggleReason(kr.id, reason)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                                isChecked
                                  ? 'text-white'
                                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                              style={
                                isChecked
                                  ? { backgroundColor: '#0d9488' }
                                  : undefined
                              }
                            >
                              {reason}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
