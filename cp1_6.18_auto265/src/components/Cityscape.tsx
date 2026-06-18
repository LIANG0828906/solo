import { memo, useMemo } from 'react';
import { useSpring, animated, to } from '@react-spring/web';
import { useCityStore } from '../store/useCityStore';
import { Building, ZONE_COLORS, ZoneType, generateWindowGrid } from '../utils/heatData';

interface BuildingBlockProps {
  building: Building;
  hotness: number;
  isHighlighted: boolean;
  bucketSeed: number;
}

const WINDOW_W = 4;
const WINDOW_H = 4;
const WINDOW_GAP = 2;
const COLS = 3;
const ROWS = 5;

const BuildingBlock = memo(function BuildingBlock({
  building,
  hotness,
  isHighlighted,
  bucketSeed,
}: BuildingBlockProps) {
  const gridSeed = useMemo(
    () => building.id * 99991 + bucketSeed * 7 + Math.floor(hotness / 10),
    [building.id, bucketSeed, hotness]
  );
  const windowGrid = useMemo(
    () => generateWindowGrid(gridSeed, hotness),
    [gridSeed, hotness]
  );

  const breathePeriod = 3 - (hotness / 100) * 2.5;

  const color = ZONE_COLORS[building.zoneType];

  const breatheSpring = useSpring({
    from: { glowOpacity: 0.3 },
    to: async (next) => {
      while (true) {
        await next({ glowOpacity: 1.0 });
        await next({ glowOpacity: 0.3 });
      }
    },
    config: { duration: breathePeriod * 1000 * 0.5 },
    loop: true,
  });

  const highlightSpring = useSpring({
    targetOpacity: isHighlighted ? 1 : 0,
    immediate: isHighlighted,
    config: { duration: 200 },
  });

  const width = 36;
  const padH = 8;
  const totalWindowH = ROWS * (WINDOW_H + WINDOW_GAP) - WINDOW_GAP;
  const startY = building.height - totalWindowH - padH;

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${building.height + 8}px`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <animated.div
        style={{
          position: 'absolute',
          top: '-7px',
          left: '50%',
          width: '6px',
          height: '6px',
          marginLeft: '-3px',
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 10px ${color}, 0 0 18px ${color}99`,
          transform: to(
            [breatheSpring.glowOpacity, highlightSpring.targetOpacity] as const,
            (o, t) => `scale(${1 + (t > 0.5 ? 1 : o) * 0.2})`
          ),
          opacity: to(
            [breatheSpring.glowOpacity, highlightSpring.targetOpacity] as const,
            (o, t) => (t > 0.5 ? 1 : o)
          ),
          willChange: 'opacity, transform',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${building.height}px`,
          background:
            'linear-gradient(180deg, rgba(50, 56, 80, 0.95) 0%, rgba(22, 25, 42, 0.98) 100%)',
          borderTop: '1px solid rgba(0, 229, 255, 0.18)',
          borderLeft: '1px solid rgba(0, 229, 255, 0.08)',
          borderRight: '1px solid rgba(0, 229, 255, 0.04)',
          boxShadow: '0 0 6px rgba(0, 229, 255, 0.15)',
        }}
      >
        {windowGrid.map((row, ri) =>
          row.map((lit, ci) => (
            <WindowPane
              key={`${ri}-${ci}`}
              lit={lit}
              x={8 + ci * (WINDOW_W + WINDOW_GAP)}
              y={startY + ri * (WINDOW_H + WINDOW_GAP)}
            />
          ))
        )}
      </div>
    </div>
  );
});

interface WindowPaneProps {
  lit: boolean;
  x: number;
  y: number;
}

const WindowPane = memo(function WindowPane({ lit, x, y }: WindowPaneProps) {
  const spring = useSpring({
    opacity: lit ? 1 : 0,
    config: { tension: 170, friction: 26, clamp: true },
  });
  return (
    <animated.div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${WINDOW_W}px`,
        height: `${WINDOW_H}px`,
        background: '#FFE082',
        boxShadow: lit ? '0 0 6px #FFE082, 0 0 12px rgba(255, 224, 130, 0.55)' : 'none',
        opacity: spring.opacity,
        borderRadius: '1px',
        willChange: 'opacity',
      }}
    />
  );
});

export default function Cityscape() {
  const buildings = useCityStore((s) => s.buildings);
  const hotness = useCityStore((s) => s.hotness);
  const hoveredZone = useCityStore((s) => s.hoveredZone);
  const selectedTime = useCityStore((s) => s.selectedTime);

  const bucketSeed = useMemo(() => Math.floor(selectedTime / 5), [selectedTime]);

  return (
    <div
      className="cityscape-root"
      style={{
        position: 'absolute',
        bottom: '96px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '18px',
        padding: '0 40px',
      }}
    >
      {buildings.map((b) => (
        <BuildingBlock
          key={b.id}
          building={b}
          hotness={hotness[b.zoneType]}
          isHighlighted={hoveredZone === b.zoneType}
          bucketSeed={bucketSeed}
        />
      ))}
    </div>
  );
}
