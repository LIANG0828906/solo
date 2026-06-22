import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Point, LightMode, LIGHT_MODES } from './types';

interface ShadowStageProps {
  vertices: Point[];
  rotation: number;
  lightMode: LightMode;
  onLightModeChange: (mode: LightMode) => void;
}

const ShadowStage: React.FC<ShadowStageProps> = ({
  vertices,
  rotation,
  lightMode,
  onLightModeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const thunderStateRef = useRef<{ active: boolean; colorIndex: number; nextChange: number }>({
    active: false,
    colorIndex: 0,
    nextChange: 0,
  });
  const neonOffsetRef = useRef<number>(0);
  const candleOffsetRef = useRef<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });
  const [hoveredButton, setHoveredButton] = useState<LightMode | null>(null);

  const getLightColor = useCallback((mode: LightMode, time: number): string => {
    switch (mode) {
      case 'bonfire': {
        const intensity = 1 + 0.5 * Math.sin(time * 4);
        const r = Math.floor(255 * intensity);
        const g = Math.floor(107 * intensity);
        const b = Math.floor(53 * intensity);
        return `rgb(${r}, ${g}, ${b})`;
      }
      case 'moonlight':
        return '#74b9ff';
      case 'thunder': {
        const state = thunderStateRef.current;
        if (state.active) {
          return state.colorIndex === 0 ? '#ffffff' : '#a29bfe';
        }
        return '#2d3436';
      }
      case 'candle':
        return '#fdcb6e';
      case 'neon':
        return '#fd79a8';
      default:
        return '#ffffff';
    }
  }, []);

  const getIntensity = useCallback((mode: LightMode, time: number): number => {
    switch (mode) {
      case 'bonfire':
        return 1 + 0.5 * (Math.sin(time * 4) * 0.5 + 0.5);
      case 'moonlight':
        return 0.8;
      case 'thunder':
        return thunderStateRef.current.active ? 1.5 : 0.3;
      case 'candle':
        return 1;
      case 'neon':
        return 1.2;
      default:
        return 1;
    }
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#dfe6e9');
    gradient.addColorStop(0.5, '#b2bec3');
    gradient.addColorStop(1, '#636e72');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawShadow = useCallback((
    ctx: CanvasRenderingContext2D,
    verts: Point[],
    rot: number,
    width: number,
    height: number,
    color: string,
    intensity: number,
  ) => {
    if (verts.length < 2) return;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rot * Math.PI) / 180);

    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();

    const shadowColor = adjustColorIntensity(color, intensity * 0.3);
    ctx.fillStyle = shadowColor;
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * intensity;
    ctx.fill();

    ctx.restore();
  }, []);

  const adjustColorIntensity = (hex: string, intensity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const newR = Math.floor(r * intensity);
    const newG = Math.floor(g * intensity);
    const newB = Math.floor(b * intensity);

    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const drawLightEffect = useCallback((
    ctx: CanvasRenderingContext2D,
    mode: LightMode,
    width: number,
    height: number,
    time: number,
  ) => {
    switch (mode) {
      case 'bonfire':
        drawBonfireLight(ctx, width, height, time);
        break;
      case 'moonlight':
        drawMoonlight(ctx, width, height, time);
        break;
      case 'thunder':
        drawThunder(ctx, width, height, time);
        break;
      case 'candle':
        drawCandleLight(ctx, width, height, time);
        break;
      case 'neon':
        drawNeonLight(ctx, width, height, time);
        break;
    }
  }, []);

  const drawBonfireLight = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const intensity = 1 + 0.5 * (Math.sin(time * 4) * 0.5 + 0.5);
    const gradient = ctx.createRadialGradient(
      width / 2, height * 0.8, 0,
      width / 2, height * 0.8, width * 0.6,
    );
    gradient.addColorStop(0, `rgba(255, 107, 53, ${0.3 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 107, 53, ${0.1 * intensity})`);
    gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawMoonlight = (ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const gradient = ctx.createRadialGradient(
      width * 0.2, height * 0.2, 0,
      width * 0.2, height * 0.2, width * 0.5,
    );
    gradient.addColorStop(0, 'rgba(116, 185, 255, 0.25)');
    gradient.addColorStop(0.6, 'rgba(116, 185, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(116, 185, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawThunder = (ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const state = thunderStateRef.current;
    if (state.active) {
      const color = state.colorIndex === 0 ? '255, 255, 255' : '162, 155, 254';
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `rgba(${color}, 0.4)`);
      gradient.addColorStop(0.5, `rgba(${color}, 0.2)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawCandleLight = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const candleOffset = candleOffsetRef.current;
    candleOffset.angle += 0.02;
    candleOffset.x = Math.sin(candleOffset.angle) * 10;
    candleOffset.y = Math.cos(candleOffset.angle * 0.7) * 5;

    const centerX = width / 2 + candleOffset.x;
    const centerY = height * 0.7 + candleOffset.y;
    const radius = 150;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(253, 203, 110, 0.6)');
    gradient.addColorStop(0.4, 'rgba(253, 203, 110, 0.3)');
    gradient.addColorStop(0.7, 'rgba(253, 203, 110, 0.1)');
    gradient.addColorStop(1, 'rgba(253, 203, 110, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawNeonLight = (ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    neonOffsetRef.current += 2;
    const offset = neonOffsetRef.current % (width + 400) - 200;

    const gradient = ctx.createLinearGradient(offset - 100, 0, offset + 100, 0);
    gradient.addColorStop(0, 'rgba(253, 121, 168, 0)');
    gradient.addColorStop(0.3, 'rgba(253, 121, 168, 0.4)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
    gradient.addColorStop(0.7, 'rgba(253, 121, 168, 0.4)');
    gradient.addColorStop(1, 'rgba(253, 121, 168, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const updateThunderState = useCallback((deltaTime: number) => {
    const state = thunderStateRef.current;
    state.nextChange -= deltaTime;

    if (state.nextChange <= 0) {
      state.active = !state.active;
      if (state.active) {
        state.colorIndex = Math.floor(Math.random() * 2);
        state.nextChange = 0.1;
      } else {
        state.nextChange = 0.3 + Math.random() * 0.5;
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += deltaTime;

      const width = canvas.width;
      const height = canvas.height;

      updateThunderState(deltaTime);

      ctx.clearRect(0, 0, width, height);
      drawBackground(ctx, width, height);
      drawLightEffect(ctx, lightMode, width, height, timeRef.current);

      const lightColor = getLightColor(lightMode, timeRef.current);
      const intensity = getIntensity(lightMode, timeRef.current);
      drawShadow(ctx, vertices, rotation, width, height, lightColor, intensity);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [vertices, rotation, lightMode, drawBackground, drawLightEffect, drawShadow, getLightColor, getIntensity, updateThunderState]);

  const getButtonStyle = (mode: LightMode, modeColor: string): React.CSSProperties => {
    const isSelected = lightMode === mode;
    const isHovered = hoveredButton === mode;
    const scale = isHovered ? 1.1 : 1;

    return {
      width: '60px',
      height: '30px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#fff',
      backgroundColor: modeColor,
      opacity: isSelected ? 1 : 0.6,
      transform: `scale(${scale})`,
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      boxShadow: isSelected ? `0 3px 0 ${modeColor}, 0 0 10px ${modeColor}` : 'none',
      position: 'relative',
    };
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          display: 'flex',
          gap: '12px',
        }}
      >
        {LIGHT_MODES.map(({ mode, name, color }) => (
          <button
            key={mode}
            onClick={() => onLightModeChange(mode)}
            onMouseEnter={() => setHoveredButton(mode)}
            onMouseLeave={() => setHoveredButton(null)}
            style={getButtonStyle(mode, color)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShadowStage;
