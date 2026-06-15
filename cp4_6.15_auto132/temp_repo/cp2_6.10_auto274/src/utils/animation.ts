export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const createParticles = (x: number, y: number, count: number = 12): Particle[] => {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;

    particles.push({
      id: i,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      opacity: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }

  return particles;
};

export const getParticleStyle = (particle: Particle): React.CSSProperties => {
  return {
    position: 'absolute',
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size,
    opacity: particle.opacity,
    transform: `translate(-50%, -50%) rotate(${particle.rotation}rad)`,
    pointerEvents: 'none',
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(255,215,0,${particle.opacity}) 0%, rgba(255,165,0,${particle.opacity * 0.6}) 50%, transparent 70%)`,
    boxShadow: `0 0 ${particle.size * 2}px rgba(255,215,0,${particle.opacity * 0.8})`,
  };
};

export const updateParticle = (particle: Particle, deltaTime: number = 1): Particle => {
  return {
    ...particle,
    x: particle.x + particle.vx * deltaTime,
    y: particle.y + particle.vy * deltaTime,
    vy: particle.vy + 0.1 * deltaTime,
    opacity: Math.max(0, particle.opacity - 0.02 * deltaTime),
    rotation: particle.rotation + particle.rotationSpeed * deltaTime,
  };
};

export const isParticleAlive = (particle: Particle): boolean => {
  return particle.opacity > 0.01;
};
