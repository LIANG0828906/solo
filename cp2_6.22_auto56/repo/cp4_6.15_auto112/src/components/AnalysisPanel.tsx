import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Sun,
  Cloud,
  BarChart3,
  Target,
  Layers,
  Gauge,
  Clock,
  ArrowRight,
} from 'lucide-react';

import { cn } from '../lib/utils';

interface AnalysisPanelProps {
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, unit, delay }) => (
  <div
    className={cn(
      'relative p-4 rounded-xl',
      'bg-slate-800/50 border border-cyan-500/20',
      'transition-all duration-300 ease-out',
      'hover:scale-105 hover:border-cyan-400/50',
      'hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]',
      'opacity-0 animate-fade-in-up'
    )}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-gray-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white font-mono tabular-nums">
            {value}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
        {icon}
      </div>
    </div>
  </div>
);

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ className }) => {
  const { analysisResult, buildings } = useAppStore();

  const isEmpty = !analysisResult;
  const isComputing = analysisResult?.isComputing;
  const hasResult = analysisResult && !analysisResult.isComputing && analysisResult.totalSamplePoints > 0;
  const isMultiModel = buildings.length > 1;

  const legendGradient = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';

  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'h-full min-h-[400px] p-8',
          'bg-slate-900/70 backdrop-blur-xl',
          'border border-cyan-400/30 rounded-2xl',
          className
        )}
      >
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Gauge className="w-16 h-16 text-cyan-500/30" />
              <Sun className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            暂无分析结果
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            点击左侧「开始分析」按钮生成热力图
          </p>
          <div className="flex items-center justify-center gap-2 text-cyan-400/70">
            <span className="text-sm">开始分析</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-6 p-6',
        'bg-slate-900/70 backdrop-blur-xl',
        'border border-cyan-400/30 rounded-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          分析结果
        </h2>
        {hasResult && (
          <span className="text-xs text-cyan-400/70 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            分析完成
          </span>
        )}
      </div>

      {isComputing && (
        <div className="space-y-3 animate-pulse-slow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">正在计算日照分布...</span>
            <span className="text-sm font-mono text-cyan-400 tabular-nums">
              {Math.round(analysisResult.progress * 100)}%
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${analysisResult.progress * 100}%`,
                background: 'linear-gradient(to right, #0066ff, #00d4ff, #00ff88)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              }}
            />
          </div>
        </div>
      )}

      {hasResult && (
        <>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">日照时长图例</h3>
            <div className="relative">
              <div
                className="h-5 rounded-full w-full"
                style={{
                  background: legendGradient,
                  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
                <span>{analysisResult.minSunlightHours.toFixed(1)}h</span>
                <span className="text-cyan-400">
                  avg {analysisResult.avgSunlightHours.toFixed(1)}h
                </span>
                <span>{analysisResult.maxSunlightHours.toFixed(1)}h</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              icon={<Sun className="w-4 h-4" />}
              title="平均日照时长"
              value={analysisResult.avgSunlightHours.toFixed(1)}
              unit="小时"
              delay={100}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              title="最大日照时长"
              value={analysisResult.maxSunlightHours.toFixed(1)}
              unit="小时"
              delay={200}
            />
            <StatCard
              icon={<Cloud className="w-4 h-4" />}
              title="最小日照时长"
              value={analysisResult.minSunlightHours.toFixed(1)}
              unit="小时"
              delay={300}
            />
            <StatCard
              icon={<Target className="w-4 h-4" />}
              title="总采样点数"
              value={analysisResult.totalSamplePoints.toLocaleString()}
              unit="点"
              delay={400}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                阴影覆盖百分比
              </h3>
              <span className="text-lg font-bold text-white font-mono tabular-nums">
                {analysisResult.shadowCoveragePercent.toFixed(1)}
                <span className="text-sm text-gray-500 ml-1">%</span>
              </span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${analysisResult.shadowCoveragePercent}%`,
                  background: 'linear-gradient(to right, #0066ff, #00d4ff, #00ff88, #ffff00, #ff6600, #ff0000)',
                  boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)',
                }}
              />
            </div>
          </div>

          {isMultiModel && analysisResult.overlapPercent !== undefined && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  多模型叠加区域占比
                </h3>
                <span className="text-lg font-bold text-white font-mono tabular-nums">
                  {analysisResult.overlapPercent.toFixed(1)}
                  <span className="text-sm text-gray-500 ml-1">%</span>
                </span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${analysisResult.overlapPercent}%`,
                    background: 'linear-gradient(to right, #8b5cf6, #ec4899, #f43f5e)',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
                  }}
                />
              </div>
              <div className="flex gap-4">
                {buildings.map((building) => (
                  <div key={building.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: building.shadowColor }}
                    />
                    <span className="text-xs text-gray-400">{building.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnalysisPanel;
