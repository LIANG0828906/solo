import React from "react";
import type { LightDataPoint } from "../types";
import { LEVEL_INFO } from "../types";
import { MapPin, Sun } from "lucide-react";

interface TooltipProps {
  point: LightDataPoint | null;
  position: { x: number; y: number } | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ point, position }) => {
  if (!point || !position) return null;
  const levelInfo = LEVEL_INFO[point.level];

  return (
    <div
      className="pointer-events-none fixed z-50 animate-fade-in"
      style={{
        left: position.x,
        top: position.y - 8,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div
        className="relative rounded-card border border-[#233554] px-3 py-2 text-xs shadow-glow-lg"
        style={{
          background: "rgba(21, 34, 56, 0.85)",
          backdropFilter: "blur(12px) saturate(160%)",
          WebkitBackdropFilter: "blur(12px) saturate(160%)",
          minWidth: 180,
        }}
      >
        <div className="mb-1.5 flex items-center justify-between border-b border-[#233554]/80 pb-1.5">
          <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <MapPin size={10} />
            数据点
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: `${levelInfo.color}22`,
              color: levelInfo.color,
              boxShadow: `0 0 8px ${levelInfo.color}44`,
            }}
          >
            {levelInfo.label}
          </span>
        </div>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">纬度</span>
            <span className="text-slate-200">{point.latitude}°N</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">经度</span>
            <span className="text-slate-200">{point.longitude}°E</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between rounded-md bg-bg-primary/60 px-2 py-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Sun size={10} />
              强度
            </div>
            <span className="font-semibold text-light-yellow">{point.intensity}</span>
          </div>
        </div>
        <div
          className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#233554]"
          style={{ background: "rgba(21, 34, 56, 0.85)" }}
        />
      </div>
    </div>
  );
};
