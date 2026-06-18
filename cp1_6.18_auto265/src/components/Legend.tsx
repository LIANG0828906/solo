import { useSpring, animated } from '@react-spring/web';
import { useCityStore } from '../store/useCityStore';
import { ZoneType, ZONE_COLORS, ZONE_LABELS } from '../utils/heatData';

const ZONES: ZoneType[] = ['traffic', 'commercial', 'residential', 'cultural'];

export default function Legend() {
  const setHoveredZone = useCityStore((s) => s.setHoveredZone);
  const hoveredZone = useCityStore((s) => s.hoveredZone);

  return (
    <div className="legend-root">
      <animated.div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '16px 18px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 6px rgba(0, 229, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 30,
          minWidth: '140px',
        }}
      >
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            letterSpacing: '1px',
            paddingBottom: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          区域图例
        </div>
        {ZONES.map((zone) => (
          <LegendItem
            key={zone}
            zone={zone}
            active={hoveredZone === zone}
            onEnter={() => setHoveredZone(zone)}
            onLeave={() => setHoveredZone(null)}
          />
        ))}
      </animated.div>
    </div>
  );
}

interface LegendItemProps {
  zone: ZoneType;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}

function LegendItem({ zone, active, onEnter, onLeave }: LegendItemProps) {
  const color = ZONE_COLORS[zone];
  const spring = useSpring({
    scale: active ? 1.08 : 1,
    glow: active ? 1 : 0,
    config: { duration: 200 },
  });
  return (
    <animated.div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        transform: spring.scale.to((s) => `scale(${s})`),
      }}
    >
      <animated.div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
          boxShadow: spring.glow.to(
            (g) =>
              `0 0 ${6 + g * 10}px ${color}, 0 0 ${12 + g * 18}px ${color}${Math.round(
                (0.4 + g * 0.5) * 255
              )
                .toString(16)
                .padStart(2, '0')}`
          ),
        }}
      />
      <span
        style={{
          color: active ? '#fff' : 'rgba(255, 255, 255, 0.8)',
          fontSize: '13px',
          letterSpacing: '0.5px',
          transition: 'color 0.2s ease',
        }}
      >
        {ZONE_LABELS[zone]}
      </span>
    </animated.div>
  );
}
