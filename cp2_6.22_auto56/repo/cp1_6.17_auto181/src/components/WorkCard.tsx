import { useEffect, useRef } from 'react';
import type { Stroke } from '../CalligraphyEngine';
import { CalligraphyEngine } from '../CalligraphyEngine';

interface WorkCardProps {
  work: {
    id: string;
    strokes: Stroke[];
    width: number;
    height: number;
    createdAt: string;
    title?: string;
  };
  critiqueCount?: number;
  onClick?: () => void;
}

function WorkCard({ work, critiqueCount = 0, onClick }: WorkCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !work.strokes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxWidth = 280;
    const maxHeight = 150;
    const scale = Math.min(maxWidth / work.width, maxHeight / work.height, 1);
    
    canvas.width = work.width * scale;
    canvas.height = work.height * scale;

    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    CalligraphyEngine.renderToCanvas(canvas, work.strokes);
  }, [work]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="work-card" onClick={onClick}>
      <div className="work-thumbnail">
        <canvas ref={canvasRef} />
      </div>
      <div className="work-info">
        <div className="work-title">{work.title || '未命名作品'}</div>
        <div className="work-meta">
          <span>{formatDate(work.createdAt)}</span>
          <span>💬 {critiqueCount}</span>
        </div>
      </div>
    </div>
  );
}

export default WorkCard;
