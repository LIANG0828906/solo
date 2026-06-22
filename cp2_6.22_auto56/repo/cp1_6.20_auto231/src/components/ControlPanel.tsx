import React from "react";
import type { ColorMap, DataSummary, RenderMode } from "../types";
import { FileUploader } from "./FileUploader";
import {
  BarChart3,
  Flame,
  Sparkles,
  RotateCcw,
  Camera,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Layers,
  Palette,
} from "lucide-react";

interface ControlPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;

  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;

  colorMap: ColorMap;
  onColorMapChange: (map: ColorMap) => void;

  scale: number;
  onScaleChange: (s: number) => void;

  opacity: number;
  onOpacityChange: (o: number) => void;

  onResetCamera: () => void;
  onCaptureScreenshot: () => void;

  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  summary: DataSummary | null;
  hasData: boolean;
}

const RENDER_MODES: { key: RenderMode; label: string; icon: React.ComponentType<any>; desc: string }[] = [
  { key: "bar", label: "柱状图", icon: BarChart3, desc: "3D柱体高度映射" },
  { key: "heatmap", label: "热力图", icon: Flame, desc: "半透明叠加色块" },
  { key: "particles", label: "粒子系统", icon: Sparkles, desc: "飘散光点粒子" },
];

const COLOR_MAPS: { key: ColorMap; label: string; stops: string[] }[] = [
  { key: "default", label: "赛博", stops: ["#4a148c", "#00bcd4", "#ffee58"] },
  { key: "cool", label: "冰蓝", stops: ["#0d47a1", "#26c6da", "#e0f7fa"] },
  { key: "warm", label: "烈焰", stops: ["#311b92", "#ef6c00", "#fff59d"] },
  { key: "mono", label: "靛蓝", stops: ["#1a237e", "#5c6bc0", "#c5cae9"] },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  collapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onMobileToggle,
  renderMode,
  onRenderModeChange,
  colorMap,
  onColorMapChange,
  scale,
  onScaleChange,
  opacity,
  onOpacityChange,
  onResetCamera,
  onCaptureScreenshot,
  onFileSelect,
  isUploading,
  uploadProgress,
  error,
  summary,
  hasData,
}) => {
  const panelWidth = 320;

  const sliderThumb =
    "appearance-none h-4 w-4 rounded-full bg-accent-cyan border-2 border-white shadow-lg cursor-pointer transition hover:scale-110 hover:bg-accent-teal";
  const sliderTrack =
    "appearance-none h-1.5 rounded-full bg-[#1e3355] outline-none cursor-pointer";

  const Section: React.FC<{ title: string; icon: React.ComponentType<any>; children: React.ReactNode }> = ({
    title,
    icon: Icon,
    children,
  }) => (
    <div className="space-y-2.5 rounded-card border border-[#1e3355] bg-bg-secondary/40 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-accent-cyan" />
        <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </span>
      </div>
      {children}
    </div>
  );

  const panelContent = (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 pr-3 scrollbar-thin">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-indigo/20 shadow-glow">
            <Layers size={18} className="text-accent-cyan" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-teal shadow-[0_0_8px_#64ffda]" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-slate-100 leading-tight">
              光污染分析器
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              Urban Light · v1.0
            </div>
          </div>
        </div>
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-[#1e3355] hover:text-accent-cyan"
            title="收起面板"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {isMobile && mobileOpen && (
        <button
          onClick={onMobileToggle}
          className="flex items-center justify-center gap-1 rounded-md border border-[#1e3355] bg-bg-secondary/60 py-1.5 text-xs text-slate-400 transition hover:text-slate-200"
        >
          关闭面板
          <PanelLeftClose size={12} />
        </button>
      )}

      <FileUploader
        onFileSelect={onFileSelect}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        error={error}
        summary={summary}
        compact={!!summary}
      />

      <Section title="渲染模式" icon={Layers}>
        <div className="grid grid-cols-3 gap-1.5">
          {RENDER_MODES.map((m) => {
            const active = renderMode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => onRenderModeChange(m.key)}
                disabled={!hasData}
                title={m.desc}
                className={[
                  "group relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-all duration-200",
                  active
                    ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan shadow-glow"
                    : "border-[#1e3355] bg-bg-primary/40 text-slate-500 hover:border-accent-teal/40 hover:text-slate-300",
                  !hasData && "cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                <m.icon size={18} />
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="颜色映射" icon={Palette}>
        <div className="grid grid-cols-2 gap-1.5">
          {COLOR_MAPS.map((cm) => {
            const active = colorMap === cm.key;
            return (
              <button
                key={cm.key}
                onClick={() => onColorMapChange(cm.key)}
                disabled={!hasData}
                className={[
                  "flex items-center gap-2 rounded-md border p-1.5 text-left transition-all",
                  active
                    ? "border-accent-cyan/60 bg-accent-cyan/5"
                    : "border-[#1e3355] bg-bg-primary/40 hover:border-accent-teal/30",
                  !hasData && "cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                <div
                  className="h-5 flex-1 rounded-sm"
                  style={{
                    background: `linear-gradient(90deg, ${cm.stops.join(",")})`,
                    boxShadow: active ? "0 0 8px rgba(0,188,212,0.3)" : undefined,
                  }}
                />
                <span
                  className={[
                    "text-[10px] font-medium w-7 text-right",
                    active ? "text-accent-cyan" : "text-slate-400",
                  ].join(" ")}
                >
                  {cm.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="显示参数" icon={Maximize2}>
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">缩放系数</span>
              <span className="rounded bg-bg-primary px-1.5 py-0.5 font-mono text-[10px] text-accent-cyan">
                {scale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              disabled={!hasData}
              className={`w-full ${sliderTrack} disabled:opacity-40`}
              style={{
                background: `linear-gradient(to right, #00bcd4 0%, #00bcd4 ${((scale - 0.5) / 1.5) * 100}%, #1e3355 ${((scale - 0.5) / 1.5) * 100}%, #1e3355 100%)`,
              }}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">柱体透明度</span>
              <span className="rounded bg-bg-primary px-1.5 py-0.5 font-mono text-[10px] text-accent-teal">
                {(opacity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.02}
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              disabled={!hasData}
              className={`w-full ${sliderTrack} disabled:opacity-40`}
              style={{
                background: `linear-gradient(to right, #64ffda 0%, #64ffda ${((opacity - 0.2) / 0.8) * 100}%, #1e3355 ${((opacity - 0.2) / 0.8) * 100}%, #1e3355 100%)`,
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="视角与导出" icon={Camera}>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onResetCamera}
            disabled={!hasData}
            className="flex items-center justify-center gap-1.5 rounded-md border border-[#1e3355] bg-bg-primary/40 py-2 text-xs text-slate-300 transition hover:border-accent-teal/40 hover:text-accent-teal disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} />
            重置视角
          </button>
          <button
            onClick={onCaptureScreenshot}
            disabled={!hasData}
            className="flex items-center justify-center gap-1.5 rounded-md border border-accent-cyan/50 bg-accent-cyan/10 py-2 text-xs text-accent-cyan transition hover:bg-accent-cyan/20 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Camera size={13} />
            导出截图
          </button>
        </div>
        <div className="rounded-md bg-bg-primary/30 p-2 text-[10px] leading-relaxed text-slate-500">
          💡 鼠标左键：旋转 · 右键：平移 · 滚轮：缩放 · 点击柱体：查看详情
        </div>
      </Section>

      <div className="mt-auto pt-2 text-center font-mono text-[9px] uppercase tracking-widest text-slate-600">
        Designed for Urban Planners
      </div>
    </div>
  );

  const sliderStyles = `
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 14px; width: 14px; border-radius: 9999px; background: #00bcd4; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,188,212,0.4); cursor: pointer; transition: all 0.15s; }
    input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); background: #64ffda; }
    input[type="range"]::-moz-range-thumb { height: 14px; width: 14px; border-radius: 9999px; background: #00bcd4; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,188,212,0.4); cursor: pointer; }
    .scrollbar-thin::-webkit-scrollbar { width: 5px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e3355; border-radius: 4px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #2a4570; }
  `;

  if (isMobile) {
    return (
      <>
        <style>{sliderStyles}</style>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onMobileToggle}
          />
        )}
        <div
          className={[
            "fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ease-out",
            mobileOpen ? "translate-y-0" : "-translate-y-full",
          ].join(" ")}
          style={{
            maxHeight: "80vh",
            background: "linear-gradient(180deg, #0a192f 0%, #112240 100%)",
            borderBottom: "1px solid #1e3355",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {panelContent}
        </div>
        {!mobileOpen && (
          <button
            onClick={onMobileToggle}
            className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e3355] bg-bg-secondary/80 text-accent-cyan backdrop-blur-md shadow-glow"
          >
            <Layers size={20} />
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <style>{sliderStyles}</style>
      <div
        className={[
          "relative flex-shrink-0 border-r border-[#1e3355] transition-all duration-300 ease-out",
        ].join(" ")}
        style={{
          width: collapsed ? 0 : panelWidth,
          background: "linear-gradient(180deg, #0a192f 0%, #112240 60%, #0a192f 100%)",
          overflow: collapsed ? "hidden" : "visible",
        }}
      >
        <div
          style={{
            width: panelWidth,
            height: "100%",
            transform: collapsed ? "translateX(-100%)" : "translateX(0)",
            transition: "transform 0.3s ease-out",
          }}
        >
          {panelContent}
        </div>
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="absolute right-[-28px] top-1/2 z-20 flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-r-lg border-y border-r border-[#1e3355] bg-bg-secondary/90 text-slate-500 backdrop-blur-md transition-all hover:w-9 hover:text-accent-cyan"
            title="展开面板"
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
      </div>
    </>
  );
};
