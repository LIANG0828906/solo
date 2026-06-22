import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GenerationState,
  SpeciesType,
  Species,
  EnvironmentParams,
} from './types';
import { ecosystemEngine } from './EcosystemEngine';
import { environmentManager, ENVIRONMENT_LIMITS } from './EnvironmentManager';
import { eventBus } from './EventBus';

const CELL_SIZE = 28;
const GRID_COLS = 20;
const GRID_ROWS = 15;
const CANVAS_WIDTH = CELL_SIZE * GRID_COLS;
const CANVAS_HEIGHT = CELL_SIZE * GRID_ROWS;

const SPECIES_COLORS: Record<SpeciesType, string> = {
  [SpeciesType.PLANT]: '#4ADE80',
  [SpeciesType.HERBIVORE]: '#60A5FA',
  [SpeciesType.CARNIVORE]: '#F87171',
};

const EXTINCT_COLOR = '#9CA3AF';

type ToolType = SpeciesType | 'remove' | null;

interface HoverInfo {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

export const SimulationUI: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GenerationState>(() => ecosystemEngine.getState());
  const [env, setEnv] = useState<EnvironmentParams>(() => environmentManager.getParams());
  const [selectedTool, setSelectedTool] = useState<ToolType>(SpeciesType.PLANT);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 800);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsub1 = ecosystemEngine.onUpdate((newState) => {
      setState(newState);
    });
    const unsub2 = environmentManager.onEnvChange((params) => {
      setEnv(params);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#FFFFFF20';
    ctx.lineWidth = 1;

    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }
  }, []);

  const drawSpecies = useCallback((ctx: CanvasRenderingContext2D, speciesList: Species[]) => {
    for (const sp of speciesList) {
      const cx = sp.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = sp.y * CELL_SIZE + CELL_SIZE / 2;

      let scale = 1;
      let opacity = 1;
      let color = SPECIES_COLORS[sp.type];

      if (sp.isExtinct) {
        color = EXTINCT_COLOR;
        opacity = Math.max(0.3, sp.extinctionTimer / 500);
      } else if (sp.animationTimer > 0) {
        const t = 1 - sp.animationTimer / 300;
        scale = 1 + 0.1 * Math.sin(t * Math.PI * 3) * (1 - t);
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      const size = 16;

      if (sp.type === SpeciesType.PLANT) {
        ctx.fillStyle = color;
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.fillStyle = '#000000';
      const text = Math.round(sp.population).toString();
      ctx.strokeText(text, cx, cy + 22);
      ctx.fillText(text, cx, cy + 22);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawGrid(ctx);
      drawSpecies(ctx, stateRef.current.species);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawGrid, drawSpecies]);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 20, right: 10, bottom: 20, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    const history = state.populationHistory;
    if (history.length < 2) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待数据... (每10代刷新)', w / 2, h / 2);
      return;
    }

    const maxVal = Math.max(
      10,
      ...history.map((h) => Math.max(h.plants, h.herbivores, h.carnivores))
    );

    ctx.strokeStyle = '#FFFFFF20';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxVal - (maxVal / 4) * i);
      const y = padding.top + (chartH / 4) * i;
      ctx.fillText(val.toString(), padding.left - 4, y + 3);
    }

    const xScale = (i: number) =>
      padding.left + (chartW * i) / (history.length - 1);
    const yScale = (v: number) =>
      padding.top + chartH - (chartH * v) / maxVal;

    const drawLine = (
      key: 'plants' | 'herbivores' | 'carnivores',
      color: string
    ) => {
      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(0));
      for (let i = 0; i < history.length; i++) {
        ctx.lineTo(xScale(i), yScale(history[i][key]));
      }
      ctx.lineTo(xScale(history.length - 1), yScale(0));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const px = xScale(i);
        const py = yScale(history[i][key]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    drawLine('plants', SPECIES_COLORS[SpeciesType.PLANT]);
    drawLine('herbivores', SPECIES_COLORS[SpeciesType.HERBIVORE]);
    drawLine('carnivores', SPECIES_COLORS[SpeciesType.CARNIVORE]);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    const legendY = 6;
    const legends = [
      { label: '植物', color: SPECIES_COLORS[SpeciesType.PLANT] },
      { label: '草食', color: SPECIES_COLORS[SpeciesType.HERBIVORE] },
      { label: '肉食', color: SPECIES_COLORS[SpeciesType.CARNIVORE] },
    ];
    let lx = padding.left;
    for (const lg of legends) {
      ctx.fillStyle = lg.color;
      ctx.fillRect(lx, legendY, 10, 10);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(lg.label, lx + 14, legendY + 9);
      lx += 58;
    }
  }, [state.populationHistory]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

      if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;

      if (selectedTool === 'remove') {
        const target = state.species.find(
          (s) => s.x === x && s.y === y && !s.isExtinct
        );
        if (target) {
          eventBus.emit('species:remove', { id: target.id });
        }
      } else if (selectedTool !== null) {
        eventBus.emit('species:place', { type: selectedTool, x, y });
      }
    },
    [selectedTool, state.species]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const gx = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const gy = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

      if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) {
        setHoverInfo(null);
        return;
      }

      setHoverInfo({
        x: gx,
        y: gy,
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      });
    },
    []
  );

  const handleSliderChange = (
    key: keyof EnvironmentParams,
    value: number
  ) => {
    environmentManager.setParams({ [key]: value });
  };

  const toolButtons: { type: ToolType; label: string; color: string }[] = [
    { type: SpeciesType.PLANT, label: '植物', color: SPECIES_COLORS[SpeciesType.PLANT] },
    { type: SpeciesType.HERBIVORE, label: '草食', color: SPECIES_COLORS[SpeciesType.HERBIVORE] },
    { type: SpeciesType.CARNIVORE, label: '肉食', color: SPECIES_COLORS[SpeciesType.CARNIVORE] },
    { type: 'remove', label: '移除', color: '#9CA3AF' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#0F172A',
        color: '#E2E8F0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
          gap: 12,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#E2E8F0' }}>
            生物群落演化模拟器
          </h1>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 8,
              background: '#3B82F620',
              color: '#3B82F6',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            第 {state.generation} 代
          </span>
          {isMobile && (
            <button
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                borderRadius: 8,
                background: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #334155',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {panelCollapsed ? '展开面板' : '收起面板'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {toolButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => setSelectedTool(btn.type)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: selectedTool === btn.type ? btn.color : '#1E293B',
                color: selectedTool === btn.type ? '#0F172A' : '#E2E8F0',
                border: `1px solid ${selectedTool === btn.type ? btn.color : '#334155'}`,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHoverInfo(null)}
              style={{
                borderRadius: 8,
                cursor: selectedTool ? 'crosshair' : 'default',
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
            {hoverInfo && (
              <div
                style={{
                  position: 'absolute',
                  left: hoverInfo.screenX + 12,
                  top: hoverInfo.screenY + 12,
                  background: '#1E293B',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  border: '1px solid #334155',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                <div>格子: ({hoverInfo.x}, {hoverInfo.y})</div>
                <div style={{ color: '#EF4444' }}>温度: {env.temperature.toFixed(1)}°C</div>
                <div style={{ color: '#3B82F6' }}>湿度: {env.humidity.toFixed(1)}%</div>
                <div style={{ color: '#F59E0B' }}>光照: {env.light.toFixed(0)} lux</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          提示：选择物种后点击网格放置（每物种最多10个初始群落），选择"移除"点击物种删除。每50ms演化一代。
        </div>
      </div>

      {(!isMobile || !panelCollapsed) && (
        <div
          style={{
            width: isMobile ? '100%' : 300,
            background: '#1E293B',
            borderRadius: isMobile ? 0 : 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
            position: isMobile ? 'absolute' : 'relative',
            top: isMobile ? 0 : undefined,
            right: isMobile ? 0 : undefined,
            height: isMobile ? '100%' : undefined,
            zIndex: isMobile ? 100 : undefined,
            boxShadow: isMobile ? '-4px 0 20px rgba(0,0,0,0.5)' : undefined,
          }}
        >
          {isMobile && (
            <button
              onClick={() => setPanelCollapsed(true)}
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: 20,
                padding: 4,
              }}
            >
              ×
            </button>
          )}

          <div>
            <h2
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: 16,
                fontWeight: 600,
                color: '#E2E8F0',
              }}
            >
              环境参数
            </h2>

            <EnvSlider
              label="温度"
              unit="°C"
              value={env.temperature}
              min={ENVIRONMENT_LIMITS.temperature.min}
              max={ENVIRONMENT_LIMITS.temperature.max}
              color="#EF4444"
              onChange={(v) => handleSliderChange('temperature', v)}
            />

            <EnvSlider
              label="湿度"
              unit="%"
              value={env.humidity}
              min={ENVIRONMENT_LIMITS.humidity.min}
              max={ENVIRONMENT_LIMITS.humidity.max}
              color="#3B82F6"
              onChange={(v) => handleSliderChange('humidity', v)}
            />

            <EnvSlider
              label="光照"
              unit="lux"
              value={env.light}
              min={ENVIRONMENT_LIMITS.light.min}
              max={ENVIRONMENT_LIMITS.light.max}
              color="#F59E0B"
              onChange={(v) => handleSliderChange('light', v)}
            />
          </div>

          <div
            style={{
              width: 240,
              background: '#1E293B',
              borderRadius: 12,
              padding: 12,
              alignSelf: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>种群统计</span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                第 {state.generation} 代
              </span>
            </div>
            <canvas
              ref={chartCanvasRef}
              width={216}
              height={180}
              style={{
                borderRadius: 8,
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#0F172A',
              }}
            >
              <span style={{ color: SPECIES_COLORS[SpeciesType.PLANT] }}>● 植物总数</span>
              <span style={{ fontWeight: 600 }}>
                {Math.round(
                  state.species
                    .filter((s) => s.type === SpeciesType.PLANT && !s.isExtinct)
                    .reduce((sum, s) => sum + s.population, 0)
                )}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#0F172A',
              }}
            >
              <span style={{ color: SPECIES_COLORS[SpeciesType.HERBIVORE] }}>● 草食总数</span>
              <span style={{ fontWeight: 600 }}>
                {Math.round(
                  state.species
                    .filter((s) => s.type === SpeciesType.HERBIVORE && !s.isExtinct)
                    .reduce((sum, s) => sum + s.population, 0)
                )}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#0F172A',
              }}
            >
              <span style={{ color: SPECIES_COLORS[SpeciesType.CARNIVORE] }}>● 肉食总数</span>
              <span style={{ fontWeight: 600 }}>
                {Math.round(
                  state.species
                    .filter((s) => s.type === SpeciesType.CARNIVORE && !s.isExtinct)
                    .reduce((sum, s) => sum + s.population, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface EnvSliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (value: number) => void;
}

const EnvSlider: React.FC<EnvSliderProps> = ({
  label,
  unit,
  value,
  min,
  max,
  color,
  onChange,
}) => {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: '#E2E8F0' }}>{label}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color,
          }}
        >
          {value.toFixed(unit === 'lux' ? 0 : 1)} {unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: '#334155',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${percent}%`,
            height: 4,
            borderRadius: 2,
            background: color,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={unit === 'lux' ? 10 : 0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: 20,
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 8px)`,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 0 3px ${color}30`,
            pointerEvents: 'none',
            transition: 'left 0.1s',
          }}
        />
      </div>
    </div>
  );
};
