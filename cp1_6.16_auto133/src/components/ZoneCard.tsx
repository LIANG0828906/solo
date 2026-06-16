import React from 'react';
import { ZoneId, EnvironmentData, Trend } from '../types';
import { getLightText, getSoilText } from '../utils/adviceGenerator';

interface ZoneCardProps {
  zoneId: ZoneId;
  zoneName: string;
  data: EnvironmentData | null;
  trend: Trend;
  isActive: boolean;
  onClick: () => void;
}

const CircularIndicator: React.FC<{
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}> = ({ value, max, color, label, unit }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={styles.indicatorContainer}>
      <svg width="90" height="90" style={styles.svg}>
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke="#E0E0E0"
          strokeWidth="6"
        />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="45" y="42" textAnchor="middle" style={styles.valueText}>
          {value}
        </text>
        <text x="45" y="58" textAnchor="middle" style={styles.unitText}>
          {unit}
        </text>
      </svg>
      <span style={styles.labelText}>{label}</span>
    </div>
  );
};

const TrendArrow: React.FC<{ direction: 'up' | 'down' | 'stable'; color: string }> = ({ direction, color }) => {
  if (direction === 'stable') {
    return <span style={{ ...styles.trendArrow, color }}>→</span>;
  }
  return (
    <span style={{ ...styles.trendArrow, color, transform: direction === 'up' ? 'rotate(-45deg)' : 'rotate(45deg)' }}>
      ↑
    </span>
  );
};

const ZoneCard: React.FC<ZoneCardProps> = ({ zoneName, data, trend, isActive, onClick }) => {
  if (!data) {
    return (
      <div style={{ ...styles.card, ...styles.inactiveCard }} onClick={onClick}>
        <div style={styles.header}>
          <h3 style={styles.zoneName}>{zoneName}</h3>
          <span style={styles.noData}>暂无数据</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.card,
        ...(isActive ? styles.activeCard : styles.inactiveCard)
      }}
      onClick={onClick}
      className="fade-in"
    >
      <div style={styles.header}>
        <h3 style={styles.zoneName}>{zoneName}</h3>
        <span style={styles.timestamp}>
          {new Date(data.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      <div style={styles.indicatorsRow}>
        <div style={styles.indicatorWithTrend}>
          <CircularIndicator
            value={data.temperature}
            max={50}
            color="#4CAF50"
            label="温度"
            unit="℃"
          />
          <TrendArrow direction={trend.temperature} color="#4CAF50" />
        </div>
        <div style={styles.indicatorWithTrend}>
          <CircularIndicator
            value={data.humidity}
            max={100}
            color="#2196F3"
            label="湿度"
            unit="%"
          />
          <TrendArrow direction={trend.humidity} color="#2196F3" />
        </div>
      </div>

      <div style={styles.infoRow}>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>☀️</span>
          <span style={styles.infoLabel}>光照:</span>
          <span style={styles.infoValue}>{getLightText(data.light)}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoIcon}>🌱</span>
          <span style={styles.infoLabel}>土壤:</span>
          <span style={styles.infoValue}>{getSoilText(data.soilMoisture)}</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: '320px',
    borderRadius: '16px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  activeCard: {
    background: 'linear-gradient(135deg, #37474F 0%, #8BC34A 100%)',
    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
    transform: 'translateY(-3px)'
  },
  inactiveCard: {
    background: 'linear-gradient(135deg, #455A64 0%, #AED581 100%)',
    boxShadow: '0 4px 16px rgba(76, 175, 80, 0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  zoneName: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    fontFamily: 'Georgia, serif'
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '12px'
  },
  noData: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px'
  },
  indicatorsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '16px'
  },
  indicatorWithTrend: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative'
  },
  indicatorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  svg: {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  },
  valueText: {
    fontSize: '18px',
    fontWeight: 'bold',
    fill: '#fff'
  },
  unitText: {
    fontSize: '10px',
    fill: 'rgba(255, 255, 255, 0.8)'
  },
  labelText: {
    color: '#fff',
    fontSize: '12px',
    marginTop: '4px'
  },
  trendArrow: {
    position: 'absolute',
    top: '0',
    right: '0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  infoIcon: {
    fontSize: '16px'
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px'
  },
  infoValue: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500
  }
};

export default ZoneCard;
