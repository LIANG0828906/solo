import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useBioStore } from '../bio/BioManager';
import type { EnvironmentData, PopulationStats } from '../../utils/types';

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getTemperatureColor(temp: number): string {
  const t = Math.max(0, Math.min(1, (temp - 400) / 200));
  return lerpColor('#E74C3C', '#F1C40F', t);
}

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  color?: string;
  duration?: number;
}

function AnimatedNumber({
  value,
  format = (v) => v.toFixed(1),
  color,
  duration = 0.6,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const displayValue = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const target = { val: value };
    gsap.to(displayValue.current, {
      val: target.val,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = format(displayValue.current.val);
        }
      },
    });
  }, [value, format, duration]);

  return (
    <span
      ref={ref}
      style={{
        fontFamily: "'Courier New', monospace",
        color: color || 'inherit',
        fontWeight: 600,
      }}
    >
      {format(0)}
    </span>
  );
}

export function DataVisualizer() {
  const [mounted, setMounted] = useState(false);
  const environmentData = useBioStore((s) => s.environmentData);
  const getPopulationStats = useBioStore((s) => s.getPopulationStats);
  const speciesConfigs = useBioStore((s) => s.speciesConfigs);

  const [populationStats, setPopulationStats] = useState<PopulationStats[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPopulationStats(getPopulationStats());
  }, [getPopulationStats, environmentData]);

  const tempColor = getTemperatureColor(environmentData.temperature);

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 200,
        padding: 16,
        background: 'rgba(0, 20, 40, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.125)',
        borderRadius: 8,
        color: '#E0E0E0',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          热液喷口数据
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>温度</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatedNumber
              value={environmentData.temperature}
              format={(v) => `${Math.round(v)}`}
              color={tempColor}
            />
            <span style={{ fontSize: 12, opacity: 0.6 }}>°C</span>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>H₂S 浓度</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatedNumber
              value={environmentData.h2s}
              format={(v) => v.toFixed(2)}
              color="#E67E22"
            />
            <span style={{ fontSize: 12, opacity: 0.6 }}>mM</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>O₂ 浓度</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatedNumber
              value={environmentData.o2}
              format={(v) => v.toFixed(2)}
              color="#3498DB"
            />
            <span style={{ fontSize: 12, opacity: 0.6 }}>mM</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          生物种群
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {populationStats.map((stat) => {
            const species = speciesConfigs.find((s) => s.id === stat.speciesId);
            if (!species) return null;
            return (
              <div
                key={stat.speciesId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: species.color,
                      boxShadow: `0 0 6px ${species.color}`,
                    }}
                  />
                  <span style={{ opacity: 0.85 }}>{species.name}</span>
                </div>
                <AnimatedNumber
                  value={stat.count}
                  format={(v) => `${Math.round(v)}`}
                  color={species.color}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
