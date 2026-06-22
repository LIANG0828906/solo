import { useSimStore } from './store';
import { RESOURCE_COLORS, RESOURCE_LABELS, type ResourceType } from './ResourceManager';
import { useEffect, useRef, useState } from 'react';

interface AnimatedValueProps {
  value: number;
}

function AnimatedValue({ value }: AnimatedValueProps) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevRef = useRef(value);
  const animRef = useRef(0);

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimating(true);
      const start = prevRef.current;
      const end = value;
      const duration = 200;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(start + (end - start) * eased));
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setAnimating(false);
          prevRef.current = value;
        }
      };

      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
  }, [value]);

  return (
    <span
      style={{
        display: 'inline-block',
        fontWeight: 700,
        fontSize: 18,
        color: '#FFFFFF',
        transform: animating ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.15s ease-out',
      }}
    >
      {display}
    </span>
  );
}

const RESOURCE_ORDER: ResourceType[] = ['iron', 'copper', 'titanium'];

export default function ResourcePanel() {
  const resources = useSimStore((s) => s.resources);

  return (
    <div style={styles.container}>
      <div style={styles.title}>资源统计</div>
      <div style={styles.total}>
        总采集: <AnimatedValue value={resources.totalCollections} />
      </div>
      <div style={styles.cardRow}>
        {RESOURCE_ORDER.map((type) => (
          <div key={type} style={styles.card}>
            <div
              style={{
                ...styles.cardDot,
                backgroundColor: RESOURCE_COLORS[type],
              }}
            />
            <div style={styles.cardLabel}>{RESOURCE_LABELS[type]}</div>
            <AnimatedValue value={resources[type]} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    width: 220,
    background: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#E0E0E0',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: 13,
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#FFD700',
  },
  total: {
    fontSize: 14,
    marginBottom: 12,
    color: '#C0C0D0',
  },
  cardRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  card: {
    width: 60,
    borderRadius: 8,
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    transition: 'background-color 0.2s ease-out',
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  cardLabel: {
    fontSize: 10,
    color: '#A0A0B0',
  },
};
