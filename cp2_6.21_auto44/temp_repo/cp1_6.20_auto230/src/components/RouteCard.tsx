import React from 'react';
import { Route, Attraction } from '../types';
import { GaugeChart } from './GaugeChart';

interface RouteCardProps {
  route: Route;
  expanded: boolean;
  onToggle: () => void;
  onAttractionClick: (attraction: Attraction) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, expanded, onToggle, onAttractionClick }) => {
  const fitGradient = `linear-gradient(90deg, #ff5252 0%, #ffd740 50%, #69f0ae 100%)`;

  return (
    <div className={`route-card ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="card-header">
        <h3 className="card-title">{route.title}</h3>
        <div className="card-days">{route.totalDays} 天行程</div>
      </div>
      
      <p className="card-theme">{route.theme}</p>
      
      <div className="fit-score-container">
        <div className="fit-score-label">
          <span>综合适配度</span>
          <span className="fit-score-value">{route.fitScore}%</span>
        </div>
        <div className="fit-score-bar">
          <div
            className="fit-score-fill"
            style={{
              width: `${route.fitScore}%`,
              background: fitGradient,
            }}
          />
        </div>
      </div>
      
      <div className="gauges-row">
        <GaugeChart value={route.foodScore} label="美食评分" />
        <GaugeChart value={route.transportScore} label="交通便利度" />
      </div>
      
      <div className="cost-range">
        <span className="cost-label">预估总花费</span>
        <span className="cost-value">¥{route.costRange.min.toLocaleString()} - ¥{route.costRange.max.toLocaleString()}</span>
      </div>
      
      <div className="expand-hint">
        {expanded ? '收起详情 ▲' : '点击查看详细行程 ▼'}
      </div>
      
      <div className={`itinerary-wrapper ${expanded ? 'open' : ''}`}>
        <div className="itinerary-content">
          {route.dailyItinerary.map((day) => (
            <div key={day.day} className="daily-plan">
              <div className="day-header">
                <span className="day-badge">Day {day.day}</span>
                <span className="day-weather">🌤 {day.weather}</span>
                {day.weatherAlert && <span className="day-alert">⚠ {day.weatherAlert}</span>}
                <span className="day-transport">🚇 {day.transport}</span>
              </div>
              <div className="timeline" onClick={(e) => e.stopPropagation()}>
                {day.attractions.map((attr, idx) => (
                  <div key={attr.id} className="timeline-item">
                    <div className="timeline-dot" />
                    {idx < day.attractions.length - 1 && <div className="timeline-line" />}
                    <div className="timeline-content" onClick={() => onAttractionClick(attr)}>
                      <span className="timeline-time">{attr.time}</span>
                      <span className="timeline-name">{attr.name}</span>
                      <span className="timeline-type">{attr.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
