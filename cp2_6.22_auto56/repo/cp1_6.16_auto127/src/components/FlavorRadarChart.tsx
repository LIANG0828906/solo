import React, { useRef, useEffect, useCallback } from 'react';
import { useTeaStore } from '../store/teaStore';
import { drawFlavorRadar } from '../canvas/FlavorRadar';

interface FlavorRadarChartProps {
  width?: number;
  height?: number;
}

const FlavorRadarChart: React.FC<FlavorRadarChartProps> = ({ width = 480, height = 420 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const stateRef = useRef({
    defaultFlavor: {} as any,
    currentFlavor: {} as any,
    teaColor: '#2E8B57',
    temperature: 80,
    brewTime: 120
  });

  const currentTea = useTeaStore(state => state.getCurrentTea());
  const temperature = useTeaStore(state => state.temperature);
  const brewTime = useTeaStore(state => state.brewTime);
  const getCurrentFlavorProfile = useTeaStore(state => state.getCurrentFlavorProfile);

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (timestamp - lastTimeRef.current >= 1000 / 30) {
      const { defaultFlavor, currentFlavor, teaColor, temperature, brewTime } = stateRef.current;
      drawFlavorRadar(
        ctx,
        canvas.width,
        canvas.height,
        defaultFlavor,
        currentFlavor,
        teaColor,
        temperature,
        brewTime
      );
      lastTimeRef.current = timestamp;
    }

    animationRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    if (currentTea) {
      stateRef.current = {
        defaultFlavor: currentTea.defaultFlavor,
        currentFlavor: getCurrentFlavorProfile(),
        teaColor: currentTea.color,
        temperature,
        brewTime
      };
    }
  }, [currentTea, temperature, brewTime, getCurrentFlavorProfile]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <div className="radar-container">
      <h3 className="radar-title">风味雷达图</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="flavor-radar-canvas"
      />
      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-color default-color"></span>
          <span>默认风味</span>
        </div>
        <div className="legend-item">
          <span className="legend-color current-color" style={{ backgroundColor: currentTea?.color }}></span>
          <span>当前预测</span>
        </div>
      </div>
    </div>
  );
};

export default FlavorRadarChart;
