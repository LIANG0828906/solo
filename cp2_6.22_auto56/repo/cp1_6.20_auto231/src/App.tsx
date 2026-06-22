import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ColorMap, DataSummary, LightDataPoint, RenderMode } from "./types";
import { SceneManager } from "./SceneManager";
import { ControlPanel } from "./components/ControlPanel";
import { Tooltip } from "./components/Tooltip";
import { DetailCard } from "./components/DetailCard";
import { parseCSVFile } from "./dataParser";
import { mapIntensityToColor } from "./utils/colorMapper";
import { generateMockData } from "./utils/mockData";
import { Layers3, Lightbulb } from "lucide-react";

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return width;
}

const App: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const dataRef = useRef<LightDataPoint[]>([]);

  const [renderMode, setRenderMode] = useState<RenderMode>("bar");
  const [colorMap, setColorMap] = useState<ColorMap>("default");
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DataSummary | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<LightDataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<LightDataPoint | null>(null);

  const initScene = useCallback(() => {
    if (!sceneContainerRef.current || sceneManagerRef.current) return;
    const mgr = new SceneManager(sceneContainerRef.current, {
      onHover: (p, pos) => {
        setHoveredPoint(p);
        setHoverPos(pos);
      },
      onClick: async (p) => {
        setSelectedPoint(p);
        await sceneManagerRef.current?.flyTo(p);
      },
    });
    sceneManagerRef.current = mgr;
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      sceneManagerRef.current?.dispose();
      sceneManagerRef.current = null;
    };
  }, [initScene]);

  const applyData = useCallback((data: LightDataPoint[], sum: DataSummary) => {
    dataRef.current = data;
    setSummary(sum);
    sceneManagerRef.current?.loadData(data);
    sceneManagerRef.current?.setScale(scale);
    sceneManagerRef.current?.setOpacity(opacity);
  }, [scale, opacity]);

  const loadDemo = useCallback(async () => {
    if (!sceneManagerRef.current) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    let cancelled = false;
    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 60));
      if (cancelled) return;
      setUploadProgress(i * 0.1);
    }
    const data = generateMockData(520);
    const lats = data.map((p) => p.latitude);
    const lngs = data.map((p) => p.longitude);
    const ints = data.map((p) => p.intensity);
    const sum: DataSummary = {
      totalPoints: data.length,
      latRange: { min: Math.min(...lats), max: Math.max(...lats) },
      lngRange: { min: Math.min(...lngs), max: Math.max(...lngs) },
      intensityRange: { min: Math.min(...ints), max: Math.max(...ints) },
    };
    if (cancelled) return;
    applyData(data, sum);
    setIsUploading(false);
  }, [applyData]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!summary && sceneManagerRef.current) {
        loadDemo();
      }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneManagerRef.current]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      setSelectedPoint(null);

      let progCancel = false;
      const progTimer = setInterval(() => {
        if (progCancel) return;
        setUploadProgress((p) => (p >= 0.9 ? p : p + 0.06));
      }, 120);

      try {
        const result = await parseCSVFile(file);
        progCancel = true;
        clearInterval(progTimer);
        if (!result.success || !result.data || !result.summary) {
          setUploadProgress(1);
          setTimeout(() => {
            setError(result.error || "解析失败");
            setIsUploading(false);
          }, 300);
          return;
        }
        setUploadProgress(1);
        setTimeout(() => {
          applyData(result.data!, result.summary!);
          setIsUploading(false);
          setRenderMode("bar");
          setColorMap("default");
        }, 350);
      } catch (e) {
        progCancel = true;
        clearInterval(progTimer);
        setError(e instanceof Error ? e.message : "未知错误");
        setIsUploading(false);
      }
    },
    [applyData]
  );

  useEffect(() => {
    sceneManagerRef.current?.setScale(scale);
  }, [scale]);

  useEffect(() => {
    sceneManagerRef.current?.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    sceneManagerRef.current?.setRenderMode(renderMode);
  }, [renderMode]);

  useEffect(() => {
    const colors = dataRef.current.map((p) =>
      mapIntensityToColor(p.normalizedIntensity, colorMap)
    );
    sceneManagerRef.current?.setColorMap(colorMap, colors);
  }, [colorMap]);

  const handleResetCamera = useCallback(() => {
    sceneManagerRef.current?.resetCamera();
  }, []);

  const handleCaptureScreenshot = useCallback(async () => {
    if (!sceneManagerRef.current || !sceneContainerRef.current) return;
    try {
      const url = sceneManagerRef.current.captureScreenshot();
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `light-pollution-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("截图失败", e);
      setError("截图导出失败，请重试");
      setTimeout(() => setError(null), 2500);
    }
  }, []);

  const hasData = !!summary;

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-bg-primary text-slate-200 font-display">
      <ControlPanel
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((v) => !v)}
        renderMode={renderMode}
        onRenderModeChange={setRenderMode}
        colorMap={colorMap}
        onColorMapChange={setColorMap}
        scale={scale}
        onScaleChange={setScale}
        opacity={opacity}
        onOpacityChange={setOpacity}
        onResetCamera={handleResetCamera}
        onCaptureScreenshot={handleCaptureScreenshot}
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        error={error}
        summary={summary}
        hasData={hasData}
      />

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={sceneContainerRef}
          className="absolute inset-0"
          style={{ touchAction: "none" }}
        />

        {!hasData && sceneContainerRef.current && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-accent-cyan/40" />
              <div
                className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-accent-teal/30"
                style={{ animationDelay: "0.6s" }}
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#1e3355] bg-bg-primary/60 backdrop-blur-sm">
                <Layers3 size={36} className="text-accent-cyan" strokeWidth={1.2} />
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-semibold text-slate-300">
                城市光污染三维可视化分析器
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-500">
                <Lightbulb size={14} />
                正在加载示例城市光照数据...
              </div>
            </div>
            <button
              onClick={loadDemo}
              className="pointer-events-auto mt-2 rounded-md border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-2 text-xs text-accent-cyan transition hover:bg-accent-cyan/20 hover:shadow-glow"
            >
              立即加载示例数据
            </button>
          </div>
        )}

        {hasData && (
          <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-card border border-[#1e3355] bg-bg-secondary/70 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-teal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-teal" />
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              60 FPS · {summary?.totalPoints} 个监测点
            </span>
          </div>
        )}

        {error && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-xs text-red-400 backdrop-blur-md animate-fade-in">
            {error}
          </div>
        )}

        <Tooltip point={hoveredPoint} position={hoverPos} />
        <DetailCard point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      </div>
    </div>
  );
};

export default App;
