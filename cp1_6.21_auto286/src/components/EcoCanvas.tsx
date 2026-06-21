import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Circle, RegularPolygon } from 'react-konva';
import { EcoState, Creature, CreatureType, CREATURE_COLORS, Particle } from '../types';

interface EcoCanvasProps {
  state: EcoState;
  width: number;
  height: number;
  selectedCreature: CreatureType | null;
  onCanvasClick: (x: number, y: number) => void;
  interpolationProgress: number;
}

const CreatureRenderer: React.FC<{
  creature: Creature;
  interpolationProgress: number;
}> = React.memo(({ creature, interpolationProgress }) => {
  const x = creature.prevX + (creature.x - creature.prevX) * interpolationProgress;
  const y = creature.prevY + (creature.y - creature.prevY) * interpolationProgress;
  const scale = creature.spawnScale;
  const color = CREATURE_COLORS[creature.type];

  const commonProps = {
    x,
    y,
    fill: color,
    shadowColor: color,
    shadowBlur: 8,
    shadowOpacity: 0.6,
    scaleX: scale,
    scaleY: scale,
  };

  switch (creature.type) {
    case CreatureType.PRODUCER:
      return <Circle {...commonProps} radius={5} />;
    case CreatureType.PRIMARY_CONSUMER:
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={7}
          rotation={Math.atan2(creature.vy, creature.vx) * (180 / Math.PI)}
        />
      );
    case CreatureType.SECONDARY_CONSUMER:
      return <Circle {...commonProps} radius={8} />;
    case CreatureType.DECOMPOSER:
      return <RegularPolygon {...commonProps} sides={6} radius={6} />;
    default:
      return null;
  }
});

CreatureRenderer.displayName = 'CreatureRenderer';

const ParticleRenderer: React.FC<{ particle: Particle }> = React.memo(({ particle }) => {
  const opacity = particle.life / particle.maxLife;
  return (
    <Circle
      x={particle.x}
      y={particle.y}
      radius={particle.size * opacity}
      fill={particle.color}
      opacity={opacity}
      shadowColor={particle.color}
      shadowBlur={4}
    />
  );
});

ParticleRenderer.displayName = 'ParticleRenderer';

export const EcoCanvas: React.FC<EcoCanvasProps> = ({
  state,
  width,
  height,
  selectedCreature,
  onCanvasClick,
  interpolationProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const handleClick = useCallback(
    (_e: any) => {
      if (!selectedCreature || !stageRef.current) return;
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      if (pos) {
        onCanvasClick(pos.x, pos.y);
      }
    },
    [selectedCreature, onCanvasClick]
  );

  useEffect(() => {
    if (containerRef.current && selectedCreature) {
      containerRef.current.style.cursor = 'crosshair';
    } else if (containerRef.current) {
      containerRef.current.style.cursor = 'default';
    }
  }, [selectedCreature]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: width,
          height: height,
          borderRadius: 12,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 40px rgba(100, 200, 255, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, #0a2463 0%, #1e3f20 100%)',
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onClick={handleClick}
          onTap={handleClick}
          style={{ borderRadius: 12 }}
        >
          <Layer>
            {state.creatures.map((creature) => (
              <CreatureRenderer
                key={creature.id}
                creature={creature}
                interpolationProgress={interpolationProgress}
              />
            ))}
            {state.particles.map((particle, idx) => (
              <ParticleRenderer key={`p-${idx}-${particle.life}`} particle={particle} />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
