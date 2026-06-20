import { useState } from 'react';
import { MapPin, Thermometer, Clock } from 'lucide-react';
import type { CoffeeBean } from '@/types';

interface BeanCardProps {
  bean: CoffeeBean;
  brewCount?: number;
  onClick?: () => void;
}

const roastLabels: Record<string, string> = {
  light: '浅烘',
  medium: '中烘',
  'medium-dark': '中深烘',
  dark: '深烘',
};

export default function BeanCard({ bean, brewCount = 0, onClick }: BeanCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={styles.cardContent}>
        <h3 style={styles.name}>{bean.name}</h3>
        <p style={styles.origin}>
          <MapPin size={14} />
          {bean.origin}
        </p>

        <div style={styles.tags}>
          <span style={styles.tag}>{roastLabels[bean.roastLevel] || bean.roastLevel}</span>
          <span style={styles.tag}>{bean.processMethod}</span>
          <span style={styles.tagCount}>{brewCount} 次冲煮</span>
        </div>

        <div
          style={{
            ...styles.coords,
            opacity: isHovered ? 1 : 0,
            maxHeight: isHovered ? 40 : 0,
          }}
        >
          <span style={styles.coordLabel}>产地坐标</span>
          <span style={styles.coordValue}>
            {bean.latitude.toFixed(4)}°N, {bean.longitude.toFixed(4)}°E
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(22, 33, 62, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    color: '#eee',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  origin: {
    fontSize: 13,
    color: '#aaa',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(233, 69, 96, 0.15)',
    color: '#e94560',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  tagCount: {
    backgroundColor: 'rgba(167, 201, 87, 0.15)',
    color: '#a7c957',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  coords: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingTop: 8,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    transition: 'opacity 0.3s ease, max-height 0.3s ease',
  },
  coordLabel: {
    fontSize: 11,
    color: '#666',
  },
  coordValue: {
    fontSize: 12,
    color: '#e94560',
    fontFamily: 'monospace',
  },
};
