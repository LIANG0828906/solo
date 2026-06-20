import React, { useMemo } from "react";
import type { ExtendedPointInfo, LightDataPoint } from "../types";
import { LEVEL_INFO } from "../types";
import {
  X,
  MapPin,
  Users,
  Zap,
  Eye,
  Building2,
  AlertTriangle,
  Lightbulb,
  Activity,
} from "lucide-react";

interface DetailCardProps {
  point: LightDataPoint | null;
  onClose: () => void;
}

function getExtendedInfo(point: LightDataPoint): ExtendedPointInfo {
  const seed = (point.latitude * 1000 + point.longitude * 7 + point.intensity * 13) % 1000;
  const hash = Math.abs(Math.sin(seed)) * 10000;
  const r = (n: number) => Math.floor((Math.abs(Math.sin(seed + n)) * 10000) % 100);

  const densityLevels = ["低密度", "中低密度", "中等密度", "中高密度", "高密度", "极高密度"];
  const buildingTypes = ["住宅区", "商业区", "工业区", "交通枢纽", "公共设施", "混合用途"];
  const risks = ["较低", "一般", "中等", "较高", "高风险", "严重"];
  const recommendations = [
    "建议优化路灯照射角度，减少向上散射光",
    "可采用智能照明系统，根据人流动态调节亮度",
    "建议建筑外立面增加遮光罩，使用暖色调低色温光源",
    "应制定区域照明标准，限制商业广告牌夜间亮度",
    "建议推广使用低眩光灯具，减少对居民健康影响",
    "亟需综合治理，建议分阶段降低区域整体亮度阈值",
  ];

  const idx = point.level === "low" ? 0 : point.level === "medium" ? 2 : point.level === "high" ? 4 : 5;

  return {
    populationDensity: `${(r(1) + 20) * 80} 人/km² · ${densityLevels[Math.min(5, idx + (r(2) % 2))]}`,
    energyConsumption: `${(r(3) + 30).toFixed(0)} MWh/月 · 等效 ${((r(3) + 30) * 0.12).toFixed(1)} 吨CO₂`,
    skyGlowIndex: `${(r(4) / 10 + point.normalizedIntensity * 6).toFixed(1)} / 10 ${point.normalizedIntensity > 0.6 ? "(偏高)" : ""}`,
    recommendation: recommendations[idx],
    buildingType: buildingTypes[r(5) % 6],
    riskLevel: risks[Math.min(5, idx)],
  };
}

export const DetailCard: React.FC<DetailCardProps> = ({ point, onClose }) => {
  const info = useMemo(() => (point ? getExtendedInfo(point) : null), [point]);
  if (!point || !info) return null;
  const levelInfo = LEVEL_INFO[point.level];

  const items = [
    { icon: Users, label: "人口密度", value: info.populationDensity, color: "text-sky-400" },
    { icon: Zap, label: "能源消耗", value: info.energyConsumption, color: "text-amber-400" },
    { icon: Eye, label: "天空辉光指数", value: info.skyGlowIndex, color: "text-violet-400" },
    { icon: Building2, label: "区域类型", value: info.buildingType, color: "text-teal-400" },
    { icon: AlertTriangle, label: "生态风险", value: info.riskLevel, color: levelInfo.color.startsWith("#ff") ? "text-red-400" : "text-emerald-400" },
  ];

  return (
    <div className="pointer-events-auto fixed bottom-6 left-1/2 z-40 w-[min(560px,92vw)] -translate-x-1/2 animate-slide-up">
      <div
        className="relative overflow-hidden rounded-card border border-[#233554] shadow-glow-lg"
        style={{
          background: "linear-gradient(180deg, rgba(17,34,64,0.92) 0%, rgba(10,25,47,0.92) 100%)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${levelInfo.color}, transparent)`,
          }}
        />

        <div className="flex items-start justify-between gap-4 border-b border-[#233554] p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{
                  background: `${levelInfo.color}22`,
                  boxShadow: `0 0 14px ${levelInfo.color}44`,
                }}
              >
                <MapPin size={16} style={{ color: levelInfo.color }} />
              </div>
              <div>
                <div className="font-display text-base font-semibold text-slate-100">
                  监测点 #{point.id.replace("pt_", "")}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {point.latitude}°N, {point.longitude}°E
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: `${levelInfo.color}15`,
                color: levelInfo.color,
                border: `1px solid ${levelInfo.color}44`,
              }}
            >
              <Activity size={12} />
              污染等级 · {levelInfo.label}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#233554] hover:text-slate-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[#1e3355] bg-bg-primary/40 p-2.5">
              <div className="text-[10px] uppercase text-slate-500">光照强度</div>
              <div className="mt-0.5 font-display text-lg font-bold text-light-yellow">
                {point.intensity}
              </div>
            </div>
            <div className="rounded-lg border border-[#1e3355] bg-bg-primary/40 p-2.5">
              <div className="text-[10px] uppercase text-slate-500">归一化</div>
              <div className="mt-0.5 font-display text-lg font-bold text-accent-teal">
                {(point.normalizedIntensity * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-[#1e3355] bg-bg-primary/40 p-2.5">
              <div className="text-[10px] uppercase text-slate-500">强度条</div>
              <div className="mt-2 flex h-2 items-center overflow-hidden rounded-full bg-bg-primary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${point.normalizedIntensity * 100}%`,
                    background: `linear-gradient(90deg, #4a148c, #00bcd4, #ffee58)`,
                    boxShadow: "0 0 8px #00bcd466",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {items.map((it) => (
              <div
                key={it.label}
                className="flex items-start gap-2 rounded-md bg-bg-primary/30 p-2"
              >
                <div className={`mt-0.5 ${it.color}`}>
                  <it.icon size={13} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {it.label}
                  </div>
                  <div className="font-mono text-xs text-slate-300">{it.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-teal">
              <Lightbulb size={12} />
              治理建议
            </div>
            <div className="text-xs leading-relaxed text-slate-300">
              {info.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
