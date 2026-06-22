import { useRef, useEffect, useCallback } from 'react';
import { useClockStore } from '@/store/useClockStore';
import {
  TANK_WIDTH,
  TANK_HEIGHT,
  PIVOT_DIAMETER,
  MIN_PARTICLES,
  MAX_PARTICLES,
  MIN_FLOW_RATE,
  MAX_FLOW_RATE,
  COLORS,
  SPARK_DURATION,
} from '@/utils/constants';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  active: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function WaterClock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const { flowRate, waterLevel, pivotAngle, showSpark, errorAngle, isPivoting } =
    useClockStore((state) => ({
      flowRate: state.flowRate,
      waterLevel: state.waterLevel,
      pivotAngle: state.pivotAngle,
      showSpark: state.showSpark,
      errorAngle: state.errorAngle,
      isPivoting: state.isPivoting,
    }));

  const initParticles = useCallback((count: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * TANK_WIDTH,
        y: Math.random() * TANK_HEIGHT,
        vx: 0.5 + Math.random() * 1.5,
        vy: -0.2 + Math.random() * 0.4,
        size: 3 + Math.random() * 5,
        alpha: 0.4 + Math.random() * 0.4,
        active: true,
      });
    }
    particlesRef.current = particles;
  }, []);

  const createSparks = useCallback((x: number, y: number) => {
    const newSparks: Spark[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: SPARK_DURATION,
        maxLife: SPARK_DURATION,
        size: 2 + Math.random() * 3,
      });
    }
    sparksRef.current = [...sparksRef.current, ...newSparks];
  }, []);

  const drawWoodenTank = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLORS.woodLight);
    gradient.addColorStop(0.5, COLORS.woodDark);
    gradient.addColorStop(1, COLORS.woodLight);

    ctx.fillStyle = gradient;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = COLORS.woodDeep;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i + 10;
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.lineTo(width - 5, y);
      ctx.stroke();
    }
  }, []);

  const drawWater = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, level: number) => {
      const waterHeight = (height - 10) * (level / 100);
      const waterY = height - waterHeight;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(5, waterY, width - 10, waterHeight, [0, 0, 4, 4]);
      ctx.clip();

      const waterGradient = ctx.createLinearGradient(0, waterY, 0, height);
      waterGradient.addColorStop(0, 'rgba(77, 166, 255, 0.6)');
      waterGradient.addColorStop(1, 'rgba(77, 166, 255, 0.3)');
      ctx.fillStyle = waterGradient;
      ctx.fillRect(0, waterY, width, waterHeight);

      particlesRef.current.forEach((particle) => {
        if (!particle.active) return;

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size
        );
        gradient.addColorStop(0, `rgba(135, 206, 235, ${particle.alpha})`);
        gradient.addColorStop(1, 'rgba(135, 206, 235, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    },
    []
  );

  const drawPivotWheel = useCallback(
    (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      const radius = PIVOT_DIAMETER / 2;
      const armLength = 40;
      const armWidth = 8;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((angle * Math.PI) / 180);

      ctx.fillStyle = COLORS.woodDark;
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 12; i++) {
        const armAngle = (Math.PI * 2 * i) / 12;
        const endX = Math.cos(armAngle) * (radius - 5);
        const endY = Math.sin(armAngle) * (radius - 5);

        ctx.save();
        ctx.rotate(armAngle);

        const gradient = ctx.createLinearGradient(0, -armWidth / 2, 0, armWidth / 2);
        gradient.addColorStop(0, COLORS.woodLight);
        gradient.addColorStop(0.5, COLORS.woodDark);
        gradient.addColorStop(1, COLORS.woodLight);

        ctx.fillStyle = gradient;
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(radius * 0.3, -armWidth / 2, armLength, armWidth, 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = COLORS.woodDeep;
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    []
  );

  const drawGear = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number,
      teeth: number,
      angle: number,
      highlight: boolean
    ) => {
      const toothWidth = (Math.PI * 2 * radius) / (teeth * 2.5);
      const toothHeight = radius * 0.15;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const gradient = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius + toothHeight);
      gradient.addColorStop(0, COLORS.bronzeLight);
      gradient.addColorStop(0.7, COLORS.bronze);
      gradient.addColorStop(1, COLORS.bronzeDark);

      ctx.fillStyle = gradient;
      ctx.strokeStyle = highlight ? COLORS.gold : COLORS.bronzeDark;
      ctx.lineWidth = highlight ? 2 : 1;

      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const toothAngle = (Math.PI * 2 * i) / teeth;
        const nextToothAngle = (Math.PI * 2 * (i + 1)) / teeth;

        const innerAngle1 = toothAngle + toothWidth / radius / 2;
        const innerAngle2 = nextToothAngle - toothWidth / radius / 2;

        const outerX1 = Math.cos(toothAngle - toothWidth / radius / 2) * (radius + toothHeight);
        const outerY1 = Math.sin(toothAngle - toothWidth / radius / 2) * (radius + toothHeight);
        const outerX2 = Math.cos(toothAngle + toothWidth / radius / 2) * (radius + toothHeight);
        const outerY2 = Math.sin(toothAngle + toothWidth / radius / 2) * (radius + toothHeight);

        const innerX1 = Math.cos(innerAngle1) * radius;
        const innerY1 = Math.sin(innerAngle1) * radius;
        const innerX2 = Math.cos(innerAngle2) * radius;
        const innerY2 = Math.sin(innerAngle2) * radius;

        if (i === 0) {
          ctx.moveTo(outerX1, outerY1);
        } else {
          ctx.lineTo(outerX1, outerY1);
        }
        ctx.lineTo(outerX2, outerY2);
        ctx.lineTo(innerX1, innerY1);
        ctx.arc(0, 0, radius, innerAngle1, innerAngle2, false);
        ctx.lineTo(innerX2, innerY2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLORS.bronzeDark;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    []
  );

  const drawSparks = useCallback((ctx: CanvasRenderingContext2D) => {
    sparksRef.current.forEach((spark) => {
      const alpha = spark.life / spark.maxLife;
      const gradient = ctx.createRadialGradient(
        spark.x,
        spark.y,
        0,
        spark.x,
        spark.y,
        spark.size
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  useEffect(() => {
    const targetParticleCount = Math.floor(
      MIN_PARTICLES +
        ((MAX_PARTICLES - MIN_PARTICLES) * (flowRate - MIN_FLOW_RATE)) /
          (MAX_FLOW_RATE - MIN_FLOW_RATE)
    );

    if (particlesRef.current.length !== targetParticleCount) {
      initParticles(targetParticleCount);
    }
  }, [flowRate, initParticles]);

  useEffect(() => {
    if (showSpark && sparksRef.current.length < 10) {
      const canvas = canvasRef.current;
      if (canvas) {
        const gearX = canvas.width - 100;
        const gearY = canvas.height / 2 + 30;
        createSparks(gearX, gearY);
      }
    }
  }, [showSpark, createSparks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current === 0 ? 0.016 : (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, 'rgba(26, 26, 74, 0.95)');
      bgGradient.addColorStop(1, 'rgba(10, 10, 42, 0.95)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawWoodenTank(ctx, TANK_WIDTH, TANK_HEIGHT);
      drawWater(ctx, TANK_WIDTH, TANK_HEIGHT, waterLevel);

      particlesRef.current.forEach((particle) => {
        const speedMultiplier = flowRate / 1.5;
        particle.x += particle.vx * speedMultiplier;
        particle.y += particle.vy * speedMultiplier;

        if (particle.x > TANK_WIDTH) {
          particle.x = -particle.size;
          particle.y = 10 + Math.random() * (TANK_HEIGHT - 20);
        }
        if (particle.y < 5) particle.y = 5;
        if (particle.y > TANK_HEIGHT - 5) particle.y = TANK_HEIGHT - 5;
      });

      const pivotCx = TANK_WIDTH / 2;
      const pivotCy = TANK_HEIGHT + 80;
      drawPivotWheel(ctx, pivotCx, pivotCy, pivotAngle);

      const gear1X = pivotCx + 80;
      const gear1Y = pivotCy;
      const gear1Angle = -(pivotAngle * 12) / 5;
      drawGear(ctx, gear1X, gear1Y, 30, 12, gear1Angle, isPivoting);

      const gear2X = gear1X + 50;
      const gear2Y = gear1Y + 10;
      const gear2Angle = (gear1Angle * 12) / 5;
      drawGear(ctx, gear2X, gear2Y, 50, 20, gear2Angle, isPivoting);

      sparksRef.current = sparksRef.current.filter((spark) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.1;
        spark.life -= deltaTime * 1000;
        return spark.life > 0;
      });

      drawSparks(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    drawWoodenTank,
    drawWater,
    drawPivotWheel,
    drawGear,
    drawSparks,
    waterLevel,
    pivotAngle,
    flowRate,
    isPivoting,
  ]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={TANK_WIDTH}
        height={TANK_HEIGHT + 180}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </div>
  );
}
