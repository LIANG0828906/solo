import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EcosystemEngine } from './ecosystem';
import {
  CreatureType,
  Creature,
  Particle,
  EcosystemSnapshot,
  EcosystemParams,
  DEFAULT_PARAMS,
  CREATURE_CONFIGS,
} from './creatures';
import ControlPanel from './ControlPanel';
import Statistics from './Statistics';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EcosystemEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [snapshot, setSnapshot] = useState<EcosystemSnapshot | null>(null);
  const [params, setParams] = useState<EcosystemParams>({ ...DEFAULT_PARAMS });
  const [isFading, setIsFading] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(1);

  useEffect(() => {
    engineRef.current = new EcosystemEngine();
    setSnapshot(engineRef.current.getSnapshot());
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParams(params);
    }
  }, [params]);

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a1929');
      gradient.addColorStop(1, '#0d2137');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const time = Date.now() * 0.001;
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.05)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const y = height * (0.3 + i * 0.2) + Math.sin(time + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= width; x += 20) {
          const waveY = y + Math.sin(x * 0.02 + time + i) * 5;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    },
    []
  );

  const drawTrail = useCallback(
    (ctx: CanvasRenderingContext2D, creature: Creature) => {
      if (creature.trail.length < 2) return;

      const config = CREATURE_CONFIGS[creature.type];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < creature.trail.length; i++) {
        const prev = creature.trail[i - 1];
        const curr = creature.trail[i];
        const alpha = curr.alpha * 0.5;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = config.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.lineWidth = config.radius * 0.6 * alpha;
        ctx.stroke();
      }
    },
    []
  );

  const drawCreature = useCallback(
    (ctx: CanvasRenderingContext2D, creature: Creature) => {
      const config = CREATURE_CONFIGS[creature.type];
      const { x, y, rotation } = creature;
      const radius = config.radius;

      drawTrail(ctx, creature);

      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      glowGradient.addColorStop(0, config.glowColor);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
      bodyGradient.addColorStop(0, '#ffffff');
      bodyGradient.addColorStop(0.3, config.color);
      bodyGradient.addColorStop(1, config.color);
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (config.baseSpeed > 0) {
        const eyeOffset = radius * 0.4;
        const eyeRadius = radius * 0.25;
        const eyeX = x + Math.cos(rotation) * eyeOffset;
        const eyeY = y + Math.sin(rotation) * eyeOffset;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(
          eyeX + Math.cos(rotation) * eyeRadius * 0.3,
          eyeY + Math.sin(rotation) * eyeRadius * 0.3,
          eyeRadius * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        const indicatorLength = radius * 0.8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          x + Math.cos(rotation) * radius * 0.3,
          y + Math.sin(rotation) * radius * 0.3
        );
        ctx.lineTo(
          x + Math.cos(rotation) * indicatorLength,
          y + Math.sin(rotation) * indicatorLength
        );
        ctx.stroke();
      }

      const maxEnergy =
        config.reproductionThreshold * params.reproductionThresholdMultiplier * 1.5;
      const energyRatio = Math.max(0, Math.min(1, creature.energy / maxEnergy));
      const barWidth = radius * 2;
      const barHeight = 3;
      const barX = x - barWidth / 2;
      const barY = y - radius - 8;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const energyColor =
        energyRatio > 0.6
          ? '#00ff88'
          : energyRatio > 0.3
          ? '#ffd93d'
          : '#ff6b6b';
      ctx.fillStyle = energyColor;
      ctx.fillRect(barX, barY, barWidth * energyRatio, barHeight);
    },
    [drawTrail, params.reproductionThresholdMultiplier]
  );

  const drawCorpse = useCallback(
    (ctx: CanvasRenderingContext2D, corpse: Creature, now: number) => {
      if (!corpse.deathTime) return;

      const config = CREATURE_CONFIGS[corpse.type];
      const decayProgress = Math.min(1, (now - corpse.deathTime) / 5000);
      const radius = config.radius * (1 - decayProgress * 0.5);
      const alpha = 1 - decayProgress;

      const glowGradient = ctx.createRadialGradient(
        corpse.x,
        corpse.y,
        0,
        corpse.x,
        corpse.y,
        radius * 2
      );
      glowGradient.addColorStop(0, `rgba(160, 160, 160, ${alpha * 0.5})`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(corpse.x, corpse.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      const bodyGradient = ctx.createRadialGradient(
        corpse.x - radius * 0.3,
        corpse.y - radius * 0.3,
        0,
        corpse.x,
        corpse.y,
        radius
      );
      bodyGradient.addColorStop(0, `rgba(200, 200, 200, ${alpha})`);
      bodyGradient.addColorStop(0.5, `rgba(160, 160, 160, ${alpha})`);
      bodyGradient.addColorStop(1, `rgba(120, 120, 120, ${alpha})`);
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(corpse.x, corpse.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(corpse.x, corpse.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', corpse.x, corpse.y);
    },
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle) => {
      const { x, y, radius, color, alpha } = particle;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { poolWidth, poolHeight } = params;
    if (canvas.width !== poolWidth || canvas.height !== poolHeight) {
      canvas.width = poolWidth;
      canvas.height = poolHeight;
    }

    ctx.save();
    ctx.globalAlpha = fadeOpacity;

    drawBackground(ctx, poolWidth, poolHeight);

    const now = performance.now();
    const currentSnapshot = engineRef.current.update();
    setSnapshot(currentSnapshot);

    currentSnapshot.corpses.forEach((corpse) => {
      drawCorpse(ctx, corpse, now);
    });

    currentSnapshot.creatures.forEach((creature) => {
      drawCreature(ctx, creature);
    });

    currentSnapshot.particles.forEach((particle) => {
      drawParticle(ctx, particle);
    });

    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(render);
  }, [params, fadeOpacity, drawBackground, drawCreature, drawCorpse, drawParticle]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const handleAddCreature = useCallback((type: CreatureType) => {
    if (engineRef.current) {
      engineRef.current.addCreature(type);
    }
  }, []);

  const handleParamsChange = useCallback((newParams: Partial<EcosystemParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const handleReset = useCallback(() => {
    setIsFading(true);
    let opacity = 1;
    const fadeInterval = setInterval(() => {
      opacity -= 0.05;
      setFadeOpacity(Math.max(0, opacity));
      if (opacity <= 0) {
        clearInterval(fadeInterval);
        if (engineRef.current) {
          engineRef.current.reset();
          setSnapshot(engineRef.current.getSnapshot());
        }
        setTimeout(() => {
          setFadeOpacity(1);
          setIsFading(false);
        }, 50);
      }
    }, 15);
  }, []);

  const statsHistory = engineRef.current?.getStatsHistory() || [];

  return (
    <div className="app-container">
      <div className="control-panel">
        <ControlPanel
          onAddCreature={handleAddCreature}
          onParamsChange={handleParamsChange}
          onReset={handleReset}
          params={params}
          disabled={isFading}
        />
      </div>

      <div className="ecosystem-container">
        <div className="canvas-wrapper">
          <div
            className={`canvas-container ${isFading ? 'fade-out' : ''}`}
            style={{ width: params.poolWidth, height: params.poolHeight }}
          >
            <canvas
              ref={canvasRef}
              className="ecosystem-canvas"
              width={params.poolWidth}
              height={params.poolHeight}
            />
          </div>
        </div>
      </div>

      <div className="stats-panel">
        {snapshot && (
          <Statistics
            stats={snapshot.stats}
            statsHistory={statsHistory}
            events={snapshot.events}
          />
        )}
      </div>
    </div>
  );
};

export default App;
