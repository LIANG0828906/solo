import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CircularProgress from './CircularProgress';
import { ROAST_LEVELS } from '../../server/models';
import './BatchCard.css';

interface RoastPoint {
  time: number;
  temperature: number;
}

interface Batch {
  id: string;
  origin: string;
  variety: string;
  processingMethod: string;
  roastProfile: RoastPoint[];
  greenScore: number;
  flavorNotes: string[];
  roastDate: string;
  createdAt: string;
  roastLevel: 'light' | 'medium' | 'dark';
}

interface BatchCardProps {
  batch: Batch;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const roastLevelInfo = ROAST_LEVELS[batch.roastLevel];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples(prev => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    setTimeout(() => {
      navigate(`/batch/${batch.id}`);
    }, 100);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const cardGradient = {
    light: 'linear-gradient(135deg, #FFF8E7 0%, #FAEBD7 100%)',
    medium: 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
    dark: 'linear-gradient(135deg, #8B5E3C 0%, #5C3A21 100%)',
  };

  const textColor = {
    light: '#8B6914',
    medium: '#5C3A21',
    dark: '#FFFFFF',
  };

  return (
    <div
      ref={cardRef}
      className="batch-card"
      style={{
        background: cardGradient[batch.roastLevel],
        color: textColor[batch.roastLevel],
      }}
      onClick={handleClick}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      <div className="card-header">
        <span
          className="roast-level-badge"
          style={{
            backgroundColor: roastLevelInfo.color,
            color: roastLevelInfo.textColor,
          }}
        >
          {roastLevelInfo.label}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-origin">{batch.origin}</h3>
        <p className="card-variety">{batch.variety}</p>
        <p className="card-processing">{batch.processingMethod}</p>
      </div>

      <div className="card-footer">
        <div className="roast-date">
          <span className="date-label">烘焙日期</span>
          <span className="date-value">{formatDate(batch.roastDate)}</span>
        </div>
        <div className="score-wrapper">
          <span className="score-label">生豆评分</span>
          <CircularProgress value={batch.greenScore} max={10} size={44} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default BatchCard;
