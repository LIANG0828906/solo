import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ThermometerSun,
  Flame,
  Wind,
  Droplets,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Maximize2,
  Gauge,
} from 'lucide-react';
import type { CoolingSolution, SimMetrics, SimParams } from './types';
import { COOLING_SOLUTIONS } from './types';
import { SimulationManager } from './SimulationManager';
import { SceneSetup } from './SceneSetup';

const SOLUTION_ICONS: Record<CoolingSolution, typeof ThermometerSun> = {
  copper_heat_sink: ThermometerSun,
  aluminum_heat_sink: Gauge,
  thermal_paste: Flame,
  microchannel: Droplets,
  tec: Zap,
};

const SOLUTION_DESC: Record<CoolingSolution, string> = {
  copper_heat_sink: '高导热率金属散热，性价比之选',
  aluminum_heat_sink: '轻质经济方案，适合中低功耗',
  thermal_paste: '优化界面接触热阻，强化传导',
  microchannel: '高效液冷方案，应对高功率密度',
  tec: '主动式热电制冷，精确控温',
};

function formatNum(v: number, digits = 2): string {
  if (!isFinite(v)) return '—';
  return v.toFixed(digits);
}

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<SimulationManager | null>(null);
  const sceneRef = useRef<SceneSetup | null>(null);
  const [params, setParamsState] = useState<SimParams>({
    solution: 'copper_heat_sink',
    power: 25,
    ambientTemp: 25,
  });
  const [metrics, setMetrics] = useState<SimMetrics>({
    maxTemp: 0, avgTemp: 0, thermalResistance: 0, coolingEfficiency: 0, noCoolingMaxTemp: 0,
  });
  const [panelOpen, setPanelOpen] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [useNarrowLayout, setUseNarrowLayout] = useState(false);

  useEffect(() => {
    const sim = new SimulationManager();
    simRef.current = sim;
    const unsubM = sim.subscribeMetrics((m) => {
      setMetrics(m);
    });
    if (canvasRef.current && !sceneRef.current) {
      const scene = new SceneSetup(canvasRef.current);
      sceneRef.current = scene;
      const unsubT = sim.subscribeTemps((result, stats) => {
        scene.updateTemperatureColors(sim.getThermalEngine(), result, stats);
        scene.setSolutionTransition(sim.getParams().solution);
      });
      const unsubP = sim.subscribeParticles((data) => {
        scene.updateParticles(data.positions, data.colors, data.count);
      });
      scene.registerAnimateCallback(() => {
        const m = sim.getMetrics();
        const thr = 55 + (sim.getParams().power - 5) * 0.8;
        scene.flashHottestRegion(m.maxTemp, thr);
      });
      scene.startLoop();
      (scene as { _u?: () => void })._u = () => { unsubT(); unsubP(); };
    }
    sim.start();

    const checkNarrow = () => {
      const narrow = window.innerWidth < 1024;
      setIsNarrow(narrow);
      setUseNarrowLayout(narrow);
      setPanelOpen(!narrow);
    };
    checkNarrow();
    window.addEventListener('resize', checkNarrow);

    return () => {
      window.removeEventListener('resize', checkNarrow);
      unsubM();
      sim.stop();
      const scene = sceneRef.current;
      if (scene) {
        const cu = (scene as { _u?: () => void })._u;
        if (cu) cu();
        scene.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  const setParams = useCallback((partial: Partial<SimParams>) => {
    const sim = simRef.current;
    if (!sim) return;
    setParamsState((prev) => {
      const next = { ...prev, ...partial };
      sim.setParams(partial);
      return next;
    });
  }, []);

  const handleExport = () => {
    simRef.current?.exportSnapshot();
  };

  const renderSlider = (
    key: 'power' | 'ambientTemp',
    label: string,
    unit: string,
    min: number,
    max: number,
    step: number,
    icon: typeof ThermometerSun,
  ) => {
    const Icon = icon;
    const value = params[key];
    return (
      <div className="slider-group">
        <div className="slider-head">
          <div className="slider-title">
            <Icon size={16} />
            <span>{label}</span>
          </div>
          <div className="slider-value">
            {value}
            <span className="unit">{unit}</span>
          </div>
        </div>
        <div className="slider-track-wrap">
          <div
            className="slider-fill"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => setParams({ [key]: Number(e.target.value) } as Partial<SimParams>)}
            className="slider-input"
          />
        </div>
        <div className="slider-ticks">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  };

  const topBarHeight = useNarrowLayout ? (panelOpen ? '300px' : '56px') : '0px';
  const leftPanelWidth = !useNarrowLayout ? (panelOpen ? (window.innerWidth >= 1440 ? 320 : 280) : 0) : 0;

  return (
    <div className="app-root">
      <style>{`
        .app-root { width: 100vw; height: 100vh; overflow: hidden; background: #0A0A0F; color: #E5E7EB;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0A0A0F; }
        ::-webkit-scrollbar-thumb { background: #2A2A4E; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3B82F6; }

        .topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 20;
          background: rgba(26, 26, 46, 0.98); backdrop-filter: blur(12px);
          border-bottom: 1px solid #2A2A4E; }
        .topbar-head { display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px; height: 56px; }
        .topbar-title { display: flex; align-items: center; gap: 10px; }
        .topbar-title h1 { font-size: 15px; font-weight: 600; letter-spacing: 0.5px;
          background: linear-gradient(135deg, #3B82F6, #1E90FF, #00FF88);
          -webkit-background-clip: text; background-clip: text; color: transparent; margin: 0; }
        .topbar-expand { all: unset; cursor: pointer; display: flex; align-items: center;
          gap: 6px; color: #8B93A7; font-size: 13px; padding: 6px 12px; border-radius: 8px;
          transition: all 0.15s; }
        .topbar-expand:hover { background: #252547; color: #E5E7EB; }

        .panel { position: fixed; top: 0; left: 0; bottom: 0; z-index: 15;
          background: linear-gradient(180deg, rgba(26,26,46,0.98), rgba(18,18,36,0.98));
          backdrop-filter: blur(16px); border-right: 1px solid #2A2A4E; display: flex;
          flex-direction: column; transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden; box-shadow: 2px 0 40px rgba(0,0,0,0.4); }
        .panel.wide { width: 320px; }
        .panel.mid { width: 280px; }
        .panel.collapsed { width: 0; border-right: 0; }

        .panel-inner { display: flex; flex-direction: column; height: 100%; min-width: 280px;
          max-width: 320px; padding: 22px 20px; gap: 22px; overflow-y: auto; }

        .panel-header { display: flex; align-items: flex-start; justify-content: space-between;
          gap: 10px; }
        .panel-logo { display: flex; flex-direction: column; gap: 6px; }
        .panel-logo h1 { font-size: 17px; font-weight: 700; letter-spacing: 0.3px;
          background: linear-gradient(135deg, #3B82F6 0%, #1E90FF 40%, #00FF88 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent; margin: 0; }
        .panel-subtitle { font-size: 11px; color: #6B7280; letter-spacing: 0.8px;
          text-transform: uppercase; }
        .panel-toggle { all: unset; cursor: pointer; width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; color: #6B7280;
          background: #20203a; transition: all 0.15s; flex-shrink: 0; }
        .panel-toggle:hover { background: #2B2B50; color: #3B82F6; }

        .section { display: flex; flex-direction: column; gap: 12px; }
        .section-title { display: flex; align-items: center; gap: 8px; font-size: 11px;
          color: #6B7280; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
          padding-bottom: 8px; border-bottom: 1px solid #232342; }
        .section-title::before { content: ''; width: 3px; height: 12px;
          background: linear-gradient(180deg, #3B82F6, #1E90FF); border-radius: 2px; }

        .solutions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .sol-btn { all: unset; cursor: pointer; position: relative; padding: 12px 10px;
          border-radius: 10px; background: #15152a; border: 1px solid #2A2A4E;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: all 0.15s cubic-bezier(0.4,0,0.2,1); color: #9CA3AF;
          overflow: hidden; }
        .sol-btn::before { content: ''; position: absolute; inset: 0; opacity: 0;
          background: radial-gradient(circle at 50% 0%, rgba(59,130,246,0.2), transparent 70%);
          transition: opacity 0.15s; }
        .sol-btn:hover { transform: scale(1.05); border-color: #3B82F6; color: #E5E7EB;
          box-shadow: inset 0 0 20px rgba(59,130,246,0.15); }
        .sol-btn:hover::before { opacity: 1; }
        .sol-btn.active { border-color: #3B82F6; background: linear-gradient(180deg, #1a2a5a, #15153a);
          color: #FFFFFF; box-shadow: inset 0 0 25px rgba(59,130,246,0.25),
          0 0 20px rgba(59,130,246,0.15); }
        .sol-btn.wide { grid-column: span 2; flex-direction: row; justify-content: center; }
        .sol-icon { position: relative; z-index: 1; color: inherit; }
        .sol-label { font-size: 11.5px; font-weight: 600; position: relative; z-index: 1; }
        .sol-desc { grid-column: span 2; font-size: 11px; color: #6B7280; line-height: 1.5;
          padding: 8px 10px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);
          border-radius: 8px; display: flex; align-items: center; gap: 6px; }

        .slider-group { display: flex; flex-direction: column; gap: 8px;
          padding: 12px; background: #12122a; border: 1px solid #222244; border-radius: 10px; }
        .slider-head { display: flex; align-items: center; justify-content: space-between; }
        .slider-title { display: flex; align-items: center; gap: 8px; font-size: 12.5px;
          color: #CBD5E1; font-weight: 500; }
        .slider-value { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 16px; font-weight: 700; color: #00FF00; letter-spacing: 0.5px; }
        .slider-value .unit { font-size: 11px; color: #6B7280; margin-left: 3px; font-weight: 500; }
        .slider-track-wrap { position: relative; height: 24px; display: flex; align-items: center; }
        .slider-track-wrap::before { content: ''; position: absolute; left: 0; right: 0;
          height: 6px; background: #1f1f3a; border-radius: 3px; }
        .slider-fill { position: absolute; left: 0; height: 6px; border-radius: 3px;
          background: linear-gradient(90deg, #1E90FF, #3B82F6);
          box-shadow: 0 0 12px rgba(59,130,246,0.4); pointer-events: none; }
        .slider-input { -webkit-appearance: none; appearance: none; width: 100%;
          background: transparent; position: relative; z-index: 2; height: 24px; margin: 0; padding: 0; cursor: pointer; }
        .slider-input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%; background: #FFFFFF;
          border: 2px solid #3B82F6; cursor: pointer;
          box-shadow: 0 0 10px rgba(59,130,246,0.6), 0 2px 6px rgba(0,0,0,0.4);
          transition: transform 0.12s; }
        .slider-input::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .slider-input::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%;
          background: #FFFFFF; border: 2px solid #3B82F6; cursor: pointer; }
        .slider-ticks { display: flex; justify-content: space-between; font-size: 10px;
          color: #4B5563; font-family: monospace; }

        .canvas-wrap { position: fixed; right: 0; bottom: 0; z-index: 5;
          transition: left 0.3s cubic-bezier(0.4,0,0.2,1), top 0.3s;
          background: #0A0A0F; }
        .canvas-wrap canvas { display: block; width: 100% !important; height: 100% !important; }

        .metrics-panel { position: fixed; right: 24px; bottom: 24px; z-index: 10; width: 290px;
          background: linear-gradient(180deg, rgba(18,18,40,0.92), rgba(10,10,25,0.92));
          backdrop-filter: blur(14px); border: 1px solid #2A2A4E; border-radius: 14px;
          padding: 18px; box-shadow: 0 10px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
          display: flex; flex-direction: column; gap: 14px; }
        .metrics-head { display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 12px; border-bottom: 1px solid #2A2A4E; }
        .metrics-title { display: flex; align-items: center; gap: 8px; }
        .metrics-title h3 { margin: 0; font-size: 13px; font-weight: 600; color: #E5E7EB;
          letter-spacing: 0.4px; }
        .export-btn { all: unset; cursor: pointer; display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 7px; background: linear-gradient(135deg, #1a3a5a, #2a4a7a);
          color: #9DD4FF; font-size: 11.5px; font-weight: 600;
          border: 1px solid rgba(59,130,246,0.25); transition: all 0.15s; }
        .export-btn:hover { transform: scale(1.05); box-shadow: inset 0 0 15px rgba(59,130,246,0.3);
          border-color: #3B82F6; color: #FFFFFF; }

        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .metric-card { background: #0e0e24; border: 1px solid #232344; border-radius: 10px;
          padding: 12px; display: flex; flex-direction: column; gap: 4px; position: relative;
          overflow: hidden; transition: all 0.15s; }
        .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, #3B82F6), transparent); opacity: 0.6; }
        .metric-card:hover { transform: translateY(-1px); border-color: #34345a; }
        .metric-label { font-size: 10.5px; color: #6B7280; letter-spacing: 0.4px;
          text-transform: uppercase; font-weight: 600; }
        .metric-value { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 18px; font-weight: 700; color: #00FF00; letter-spacing: 0.5px; line-height: 1.2; }
        .metric-unit { font-size: 11px; color: #4B5563; font-weight: 500; }
        .metric-sub { font-size: 10px; color: #4B5563; margin-top: 2px; }
        .eff-bar { margin-top: 6px; height: 5px; background: #1a1a34; border-radius: 3px; overflow: hidden; }
        .eff-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #FF4500, #FFD700, #00FF88);
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 8px rgba(0,255,136,0.3); }

        .info-tag { display: flex; align-items: center; gap: 6px; padding: 8px 10px;
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
          border-radius: 8px; font-size: 10.5px; color: #8BB8F8; line-height: 1.4; }

        .colorbar { height: 10px; border-radius: 5px; margin-top: 8px; position: relative;
          background: linear-gradient(90deg, #1E90FF, #00FFFF, #00FF00, #FFFF00, #FFA500, #FF4500);
          box-shadow: 0 0 12px rgba(0,0,0,0.3); }
        .colorbar-labels { display: flex; justify-content: space-between; font-size: 9.5px;
          color: #4B5563; font-family: monospace; margin-top: 4px; }
      `}</style>

      {useNarrowLayout && (
        <div className="topbar" style={{ height: topBarHeight, overflow: panelOpen ? 'auto' : 'hidden' }}>
          <div className="topbar-head">
            <div className="topbar-title">
              <Maximize2 size={18} style={{ color: '#3B82F6' }} />
              <h1>芯片封装热流模拟平台</h1>
            </div>
            <button className="topbar-expand" onClick={() => setPanelOpen((v) => !v)}>
              {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>控制面板</span>
            </button>
          </div>
          {panelOpen && (
            <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="section">
                <div className="section-title">散热方案</div>
                <div className="solutions-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  {(Object.keys(COOLING_SOLUTIONS) as CoolingSolution[]).map((key) => {
                    const Icon = SOLUTION_ICONS[key];
                    const active = params.solution === key;
                    return (
                      <button
                        key={key}
                        className={`sol-btn ${active ? 'active' : ''}`}
                        onClick={() => setParams({ solution: key })}
                      >
                        <Icon className="sol-icon" size={18} />
                        <span className="sol-label">{COOLING_SOLUTIONS[key].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {renderSlider('power', '芯片功耗', 'W', 5, 50, 1, Flame)}
                {renderSlider('ambientTemp', '环境温度', '°C', 20, 60, 1, ThermometerSun)}
              </div>
            </div>
          )}
        </div>
      )}

      {!useNarrowLayout && (
        <div
          className={`panel ${window.innerWidth >= 1440 ? 'wide' : 'mid'} ${panelOpen ? '' : 'collapsed'}`}
        >
          <div className="panel-inner">
            <div className="panel-header">
              <div className="panel-logo">
                <h1>ThermalSim 3D</h1>
                <span className="panel-subtitle">Chip Package Thermal Studio</span>
              </div>
              <button className="panel-toggle" onClick={() => setPanelOpen(false)} title="收起面板">
                <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
              </button>
            </div>

            <div className="section">
              <div className="section-title"><Wind size={12} />散热方案</div>
              <div className="solutions-grid">
                {(Object.keys(COOLING_SOLUTIONS) as CoolingSolution[]).slice(0, 4).map((key) => {
                  const Icon = SOLUTION_ICONS[key];
                  const active = params.solution === key;
                  return (
                    <button
                      key={key}
                      className={`sol-btn ${active ? 'active' : ''}`}
                      onClick={() => setParams({ solution: key })}
                    >
                      <Icon className="sol-icon" size={20} />
                      <span className="sol-label">{COOLING_SOLUTIONS[key].label}</span>
                    </button>
                  );
                })}
                {(() => {
                  const key = 'tec' as CoolingSolution;
                  const Icon = SOLUTION_ICONS[key];
                  const active = params.solution === key;
                  return (
                    <button
                      key={key}
                      className={`sol-btn wide ${active ? 'active' : ''}`}
                      onClick={() => setParams({ solution: key })}
                    >
                      <Icon className="sol-icon" size={20} />
                      <span className="sol-label">{COOLING_SOLUTIONS[key].label}</span>
                    </button>
                  );
                })()}
                <div className="sol-desc">
                  <Info size={12} />
                  <span>{SOLUTION_DESC[params.solution]}</span>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title"><Flame size={12} />运行参数</div>
              {renderSlider('power', '芯片功耗', 'W', 5, 50, 1, Flame)}
              {renderSlider('ambientTemp', '环境温度', '°C', 20, 60, 1, ThermometerSun)}
            </div>

            <div className="section">
              <div className="section-title"><Info size={12} />温度刻度</div>
              <div className="colorbar" />
              <div className="colorbar-labels">
                <span>{formatNum(sceneRef.current?.getCurrentStats().tMin ?? 25, 1)}°C</span>
                <span>{formatNum(sceneRef.current?.getCurrentStats().tMax ?? 80, 1)}°C</span>
              </div>
            </div>

            <div className="info-tag">
              <Maximize2 size={12} />
              <span>拖拽旋转视角 · 滚轮缩放 · 右键平移</span>
            </div>
          </div>
        </div>
      )}

      <div
        className="canvas-wrap"
        ref={canvasRef}
        style={{
          left: useNarrowLayout ? 0 : leftPanelWidth,
          top: useNarrowLayout ? (panelOpen ? 300 : 56) : 0,
          width: `calc(100vw - ${useNarrowLayout ? 0 : leftPanelWidth}px)`,
          height: `calc(100vh - ${useNarrowLayout ? (panelOpen ? 300 : 56) : 0}px)`,
        }}
      />

      {!useNarrowLayout && !panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            position: 'fixed', top: 20, left: 20, zIndex: 12,
            all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: 10,
            background: 'rgba(26,26,46,0.95)', border: '1px solid #2A2A4E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3B82F6', transition: 'all 0.15s', backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = '#3B82F6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#2A2A4E'; }}
          title="展开面板"
        >
          <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      )}

      <div className="metrics-panel">
        <div className="metrics-head">
          <div className="metrics-title">
            <Gauge size={16} style={{ color: '#3B82F6' }} />
            <h3>热性能监测</h3>
          </div>
          <button className="export-btn" onClick={handleExport}>
            <Download size={13} />导出JSON
          </button>
        </div>

        <div className="metric-grid">
          <div className="metric-card" style={{ ['--accent' as any]: '#FF4500' }}>
            <span className="metric-label">最高温度</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="metric-value">{formatNum(metrics.maxTemp, 1)}</span>
              <span className="metric-unit">°C</span>
            </div>
            <span className="metric-sub">芯片结温 Tj</span>
          </div>
          <div className="metric-card" style={{ ['--accent' as any]: '#FFA500' }}>
            <span className="metric-label">平均温度</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="metric-value">{formatNum(metrics.avgTemp, 1)}</span>
              <span className="metric-unit">°C</span>
            </div>
            <span className="metric-sub">全封装区域</span>
          </div>
          <div className="metric-card" style={{ ['--accent' as any]: '#1E90FF' }}>
            <span className="metric-label">热阻值</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="metric-value">{formatNum(metrics.thermalResistance, 2)}</span>
              <span className="metric-unit">°C/W</span>
            </div>
            <span className="metric-sub">Rθ JA 等效</span>
          </div>
          <div className="metric-card" style={{ ['--accent' as any]: '#00FF88' }}>
            <span className="metric-label">散热效率</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="metric-value">{formatNum(metrics.coolingEfficiency, 0)}</span>
              <span className="metric-unit">%</span>
            </div>
            <div className="eff-bar">
              <div className="eff-fill" style={{ width: `${Math.max(0, Math.min(100, metrics.coolingEfficiency))}%` }} />
            </div>
          </div>
        </div>

        <div className="info-tag" style={{ gap: 8 }}>
          <Info size={12} />
          <span>
            基准无散热 <b style={{ color: '#FF8844' }}>{formatNum(metrics.noCoolingMaxTemp, 1)}°C</b>
            {' · '}方案 <b style={{ color: '#3B82F6' }}>{COOLING_SOLUTIONS[params.solution].shortLabel}</b>
          </span>
        </div>
      </div>

      {isNarrow && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 11,
          padding: '8px 16px', background: 'rgba(26,26,46,0.85)', borderRadius: 20,
          fontSize: 11, color: '#8B93A7', border: '1px solid #2A2A4E', backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}>
          {COOLING_SOLUTIONS[params.solution].label} · {params.power}W · {params.ambientTemp}°C · Max {formatNum(metrics.maxTemp, 1)}°C
        </div>
      )}
    </div>
  );
}
