import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, BookOpen } from 'lucide-react';
import { ChartSummary } from '../types';
import ChartMini from './ChartMini';

interface ChartCardProps {
  chart: ChartSummary;
  index?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, index = 0 }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/chart/${chart.id}`);
  };

  return (
    <div
      className="chart-card"
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="chart-card-preview">
        <ChartMini width={280} height={280} />
      </div>
      
      <div className="chart-card-info">
        <h3 className="chart-card-title">{chart.title}</h3>
        
        <div className="chart-card-user">
          <img
            src={chart.userAvatar}
            alt={chart.userNickname}
            className="user-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
            }}
          />
          <span className="user-nickname">{chart.userNickname}</span>
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          {chart.city} · {chart.birthDate}
        </div>
        
        <div className="chart-card-stats">
          <div className="chart-card-stat">
            <BookOpen size={14} />
            {chart.annotationCount}
          </div>
          <div className="chart-card-stat">
            <Heart size={14} />
            {chart.likes}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
