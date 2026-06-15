import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIdeaStore } from '@/store';
import { Milestone, PRIORITY_COLORS, PRIORITY_LABELS } from '@/types';
import { scaleTime, scaleLinear } from 'd3-scale';
import {
  format,
  min,
  max,
  eachDayOfInterval,
  eachMonthOfInterval,
  isFirstDayOfMonth,
  differenceInDays,
  addDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TooltipData {
  milestone: Milestone;
  x: number;
  y: number;
}

const GanttChart: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });

  const { ideas, selectedIdeaId, isGanttOpen, setGanttOpen } = useIdeaStore();
  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);
  const milestones = selectedIdea?.milestones || [];

  useEffect(() => {
    if (!containerRef.current || !isGanttOpen) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(rect.width - 48, 400),
          height: Math.max(rect.height - 140, 300),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isGanttOpen]);

  const chartData = useMemo(() => {
    if (milestones.length === 0) return null;

    const startDates = milestones.map((m) => new Date(m.startDate));
    const endDates = milestones.map((m) => new Date(m.endDate));

    let minDate = min(startDates) || new Date();
    let maxDate = max(endDates) || new Date();

    const paddingDays = Math.max(2, Math.ceil(differenceInDays(maxDate, minDate) * 0.05));
    minDate = addDays(minDate, -paddingDays);
    maxDate = addDays(maxDate, paddingDays);

    const rowHeight = 56;
    const labelWidth = 160;
    const topPadding = 72;
    const leftPadding = 24;
    const rowGap = 12;

    const totalHeight = topPadding + milestones.length * (rowHeight + rowGap) + 24;
    const chartWidth = containerSize.width - labelWidth - leftPadding - 24;

    const xScale = scaleTime()
      .domain([minDate, maxDate])
      .range([0, chartWidth]);

    const yScale = scaleLinear()
      .domain([0, milestones.length])
      .range([topPadding, totalHeight - 24]);

    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });

    const barHeight = rowHeight;

    return {
      minDate,
      maxDate,
      xScale,
      yScale,
      days,
      months,
      rowHeight,
      labelWidth,
      topPadding,
      leftPadding,
      rowGap,
      totalHeight: Math.max(totalHeight, containerSize.height - 40),
      chartWidth,
      barHeight,
    };
  }, [milestones, containerSize]);

  if (!isGanttOpen || !selectedIdea) return null;

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.completed).length;

  return (
    <div
      className="fixed inset-0 z-50 animate-modal-fade"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
      onClick={() => setGanttOpen(false)}
    >
      <div
        className="absolute inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-4xl glass animate-scale-in flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h2 className="text-lg font-bold">项目进度甘特图</h2>
            </div>
            <p className="text-sm text-slate-400">
              {selectedIdea.title} · {completedMilestones}/{totalMilestones} 里程碑完成
            </p>
          </div>
          <button
            onClick={() => setGanttOpen(false)}
            className="glass glass-hover p-2 rounded-xl text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5 text-xs">
          {(['high', 'medium', 'low'] as const).map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: PRIORITY_COLORS[p] }}
              />
              <span className="text-slate-400">{PRIORITY_LABELS[p]}优先级</span>
            </div>
          ))}
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto p-6">
          {milestones.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              请先添加里程碑以查看甘特图
            </div>
          ) : chartData ? (
            <svg
              ref={svgRef}
              width={containerSize.width}
              height={chartData.totalHeight}
              className="block"
            >
              <defs>
                <linearGradient id="ganttGridGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="barProgressGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
              </defs>

              {chartData.days.map((day, i) => {
                const x = chartData.labelWidth + chartData.leftPadding + chartData.xScale(day);
                const isMonthStart = isFirstDayOfMonth(day);
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={chartData.topPadding - 4}
                    x2={x}
                    y2={chartData.totalHeight}
                    stroke={isMonthStart ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
                    strokeWidth={isMonthStart ? 1 : 1}
                  />
                );
              })}

              {chartData.months.map((month, i) => {
                const nextMonth = chartData.months[i + 1] || chartData.maxDate;
                const startX = chartData.labelWidth + chartData.leftPadding + chartData.xScale(month);
                const endX = chartData.labelWidth + chartData.leftPadding + chartData.xScale(nextMonth);
                return (
                  <g key={i}>
                    <rect
                      x={startX}
                      y={0}
                      width={endX - startX}
                      height={28}
                      fill="rgba(139, 92, 246, 0.08)"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={18}
                      fill="rgba(196, 181, 253, 0.9)"
                      fontSize={11}
                      fontWeight={600}
                      textAnchor="middle"
                    >
                      {format(month, 'yyyy年MM月', { locale: zhCN })}
                    </text>
                  </g>
                );
              })}

              {chartData.days
                .filter((_, i) => i % Math.max(1, Math.floor(chartData.days.length / 12)) === 0)
                .map((day, i) => {
                  const x = chartData.labelWidth + chartData.leftPadding + chartData.xScale(day);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartData.topPadding - 12}
                      fill="rgba(148, 163, 184, 0.8)"
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {format(day, 'MM/dd')}
                    </text>
                  );
                })}

              {milestones.map((milestone, index) => {
                const y = chartData.yScale(index);
                const rowY = y;
                const startX =
                  chartData.labelWidth +
                  chartData.leftPadding +
                  chartData.xScale(new Date(milestone.startDate));
                const endX =
                  chartData.labelWidth +
                  chartData.leftPadding +
                  chartData.xScale(new Date(milestone.endDate));
                const barWidth = Math.max(endX - startX, 4);
                const priorityColor = PRIORITY_COLORS[milestone.priority];

                return (
                  <g key={milestone.id}>
                    <line
                      x1={chartData.labelWidth + chartData.leftPadding - 8}
                      y1={rowY + chartData.barHeight / 2}
                      x2={chartData.labelWidth + chartData.leftPadding - 2}
                      y2={rowY + chartData.barHeight / 2}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={2}
                    />

                    <foreignObject
                      x={0}
                      y={rowY}
                      width={chartData.labelWidth + chartData.leftPadding - 12}
                      height={chartData.barHeight}
                    >
                      <div className="h-full flex items-center justify-end pr-3">
                        <div className="text-right min-w-0">
                          <div
                            className={`text-xs font-medium truncate ${
                              milestone.completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                            style={{ maxWidth: chartData.labelWidth + chartData.leftPadding - 24 }}
                            title={milestone.name}
                          >
                            {milestone.name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {format(new Date(milestone.startDate), 'MM/dd')} -{' '}
                            {format(new Date(milestone.endDate), 'MM/dd')}
                          </div>
                        </div>
                      </div>
                    </foreignObject>

                    <rect
                      x={startX}
                      y={rowY + 12}
                      width={barWidth}
                      height={chartData.barHeight - 24}
                      rx={6}
                      fill={priorityColor}
                      fillOpacity={milestone.completed ? 0.4 : 0.85}
                      stroke={priorityColor}
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                      className="cursor-pointer transition-all hover:fill-opacity-100"
                      onMouseEnter={(e) => {
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            milestone,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }
                      }}
                      onMouseMove={(e) => {
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            milestone,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />

                    {milestone.progress > 0 && milestone.progress < 100 && (
                      <rect
                        x={startX}
                        y={rowY + 12}
                        width={barWidth * (milestone.progress / 100)}
                        height={chartData.barHeight - 24}
                        rx={6}
                        fill="url(#barProgressGradient)"
                        className="pointer-events-none"
                      />
                    )}

                    {milestone.completed && (
                      <g>
                        <circle
                          cx={endX - 10}
                          cy={rowY + chartData.barHeight / 2}
                          r={10}
                          fill="#22c55e"
                        />
                        <path
                          d={`M ${endX - 14} ${rowY + chartData.barHeight / 2} L ${endX - 11} ${
                            rowY + chartData.barHeight / 2 + 3
                          } L ${endX - 6} ${rowY + chartData.barHeight / 2 - 2}`}
                          fill="none"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              <line
                x1={chartData.labelWidth + chartData.leftPadding}
                y1={chartData.topPadding - 4}
                x2={chartData.labelWidth + chartData.leftPadding + chartData.chartWidth}
                y2={chartData.topPadding - 4}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </svg>
          ) : null}

          {tooltip && (
            <div
              className="absolute glass pointer-events-none z-10 p-3 animate-scale-in"
              style={{
                left: Math.min(tooltip.x + 16, containerSize.width - 220),
                top: Math.max(tooltip.y - 100, 80),
                minWidth: 200,
                borderRadius: 16,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: PRIORITY_COLORS[tooltip.milestone.priority] }}
                />
                <div className="font-semibold text-sm text-white truncate">
                  {tooltip.milestone.name}
                </div>
              </div>
              {tooltip.milestone.description && (
                <div className="text-xs text-slate-400 mb-2 line-clamp-2">
                  {tooltip.milestone.description}
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">优先级</span>
                  <span style={{ color: PRIORITY_COLORS[tooltip.milestone.priority] }}>
                    {PRIORITY_LABELS[tooltip.milestone.priority]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">时间</span>
                  <span className="text-slate-300">
                    {format(new Date(tooltip.milestone.startDate), 'MM/dd')} -{' '}
                    {format(new Date(tooltip.milestone.endDate), 'MM/dd')}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 mt-2">
                  <span className="text-slate-500">进度</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${tooltip.milestone.progress}%`,
                          background: tooltip.milestone.completed
                            ? '#22c55e'
                            : PRIORITY_COLORS[tooltip.milestone.priority],
                        }}
                      />
                    </div>
                    <span className="text-slate-300 font-medium w-10 text-right">
                      {tooltip.milestone.progress}%
                    </span>
                  </div>
                </div>
                {tooltip.milestone.completed && (
                  <div className="flex items-center gap-1.5 pt-1 mt-1 border-t border-white/5 text-emerald-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[11px] font-medium">已完成</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs text-slate-500">
            💡 悬停在甘特条上查看详细信息
          </div>
          <button
            onClick={() => setGanttOpen(false)}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
