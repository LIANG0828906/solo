import React, { useState, useCallback } from 'react';
import type { FormulaItem } from '../types';
import { generateGradient, getDominantColor } from '../engine/mixEngine';
import '../styles/BottleRenderer.css';

interface BottleRendererProps {
  formula: FormulaItem[];
  scale?: number;
  interactive?: boolean;
}

interface BottleRendererReturn {
  element: React.ReactNode;
  triggerGlow: () => void;
}

export function useBottleRenderer({
  formula,
  scale = 1,
  interactive = true,
}: BottleRendererProps): BottleRendererReturn {
  const [glowing, setGlowing] = useState(false);

  const triggerGlow = useCallback(() => {
    if (!interactive) return;
    setGlowing(true);
    window.setTimeout(() => setGlowing(false), 800);
  }, [interactive]);

  const gradient = generateGradient(formula);
  const dominant = getDominantColor(formula);

  const Bottle: React.ReactNode = (
    <div
      className={`scent-bottle-stage ${glowing ? 'is-glowing' : ''}`}
      onClick={interactive ? triggerGlow : undefined}
      style={{
        transform: `scale(${scale})`,
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <div className="scent-bottle-3d">
        <div className="scent-bottle-cap" />
        <div className="scent-bottle-neck" />
        <div className="scent-bottle-body">
          <div className="scent-bottle-liquid" style={{ background: gradient }}>
            <div className="scent-bottle-wave" />
          </div>
          <div className="scent-bottle-highlight" />
        </div>
      </div>
      <div className="scent-particles" style={{ color: dominant }}>
        <span className="scent-particle p1" />
        <span className="scent-particle p2" />
        <span className="scent-particle p3" />
        <span className="scent-particle p4" />
        <span className="scent-particle p5" />
      </div>
    </div>
  );

  return { element: Bottle, triggerGlow };
}

export const BottleRendererComponent: React.FC<BottleRendererProps> = (props) => {
  const { element } = useBottleRenderer(props);
  return <>{element}</>;
};

export default BottleRendererComponent;
