import React, { useRef, useEffect } from 'react';
import useSceneStore from '../stores/sceneStore';

const HeatmapOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pedestrians = useSceneStore((state) => state.pedestrians);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const heatmapDataRef = useRef<number[][]>([]);
  
  const gridSize = 40;
  const gridRange = 80;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 66) {
        lastUpdateRef.current = timestamp;
        updateHeatmapData();
      }
      
      drawHeatmap(ctx, canvas);
      animationRef.current = requestAnimationFrame(render);
    };
    
    const updateHeatmapData = () => {
      const data: number[][] = [];
      const cellSize = (gridRange * 2) / gridSize;
      
      for (let i = 0; i < gridSize; i++) {
        data[i] = [];
        for (let j = 0; j < gridSize; j++) {
          data[i][j] = 0;
        }
      }
      
      pedestrians.forEach((ped) => {
        const gridX = Math.floor((ped.x + gridRange) / cellSize);
        const gridY = Math.floor((ped.z + gridRange) / cellSize);
        
        const radius = 3;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const nx = gridX + dx;
            const ny = gridY + dy;
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= radius) {
                data[nx][ny] += (1 - dist / radius) * 0.5;
              }
            }
          }
        }
      });
      
      heatmapDataRef.current = data;
    };
    
    const drawHeatmap = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const data = heatmapDataRef.current;
      if (data.length === 0) return;
      
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const value = Math.min(data[i][j], 1);
          if (value > 0.01) {
            const alpha = value * 0.6;
            const gradient = ctx.createRadialGradient(
              i * cellWidth + cellWidth / 2,
              j * cellHeight + cellHeight / 2,
              0,
              i * cellWidth + cellWidth / 2,
              j * cellHeight + cellHeight / 2,
              cellWidth * 2
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
              i * cellWidth - cellWidth,
              j * cellHeight - cellHeight,
              cellWidth * 3,
              cellHeight * 3
            );
          }
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [pedestrians]);
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🔥</span>
        <span style={styles.title}>行人热力图</span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={styles.canvas}
      />
      <div style={styles.legend}>
        <span style={styles.legendLow}>低</span>
        <div style={styles.legendBar}></div>
        <span style={styles.legendHigh}>高</span>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    top: '80px',
    left: '24px',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 0 10px rgba(79, 195, 247, 0.5)',
    zIndex: 100,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  icon: {
    fontSize: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
  },
  canvas: {
    display: 'block',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '10px',
    gap: '8px',
  },
  legendLow: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legendHigh: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legendBar: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'linear-gradient(to right, rgba(255,0,0,0.2), rgba(255,0,0,0.8))',
  },
};

export default HeatmapOverlay;
