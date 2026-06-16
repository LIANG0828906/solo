import React, { useEffect, useRef, useState } from 'react';
import type { PlantSpecies, PlantStage, PlantHealth, ActionType } from '../types';

interface PlantCanvasProps {
  species: PlantSpecies;
  stage: PlantStage;
  health: PlantHealth;
  actionType?: ActionType;
  width?: number;
  height?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const SPECIES_COLORS: Record<PlantSpecies, { stem: string; leaf: string; flower: string }> = {
  cactus: { stem: '#228B22', leaf: '#2E8B57', flower: '#FF69B4' },
  sunflower: { stem: '#228B22', leaf: '#32CD32', flower: '#FFD700' },
  succulent: { stem: '#32CD32', leaf: '#3CB371', flower: '#FF6347' },
};

export const PlantCanvas: React.FC<PlantCanvasProps> = ({
  species,
  stage,
  health,
  actionType,
  width = 200,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [actionTriggered, setActionTriggered] = useState<ActionType>(null);
  const lastActionRef = useRef<ActionType>(null);

  useEffect(() => {
    if (actionType && actionType !== lastActionRef.current) {
      lastActionRef.current = actionType;
      setActionTriggered(actionType);
      createParticles(actionType);

      const timer = setTimeout(() => {
        setActionTriggered(null);
        lastActionRef.current = null;
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [actionType]);

  const createParticles = (type: ActionType) => {
    const particles: Particle[] = [];
    const centerX = width / 2;
    const centerY = height / 2;

    if (type === 'water') {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 60,
          y: 20 + Math.random() * 30,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          life: 1,
          maxLife: 60,
          size: 4 + Math.random() * 4,
          color: '#4FC3F7',
        });
      }
    } else if (type === 'fertilize') {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: centerX,
          y: centerY + 20,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 4,
          life: 1,
          maxLife: 80,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#FFD700' : '#FFA500',
        });
      }
    } else if (type === 'light') {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
          x: centerX,
          y: centerY - 30,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 1,
          maxLife: 50,
          size: 5 + Math.random() * 5,
          color: '#FFEB3B',
        });
      }
    }

    particlesRef.current = particles;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    const colors = SPECIES_COLORS[species];

    const isHealthLow = health.water < 30 || health.light < 30 || health.nutrition < 30;
    const healthMultiplier = (health.water + health.light + health.nutrition) / 300;

    const drawPlant = () => {
      const centerX = width / 2;
      const baseY = height - 30;

      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.ellipse(centerX, baseY + 10, 50, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#A0826D';
      ctx.beginPath();
      ctx.ellipse(centerX, baseY + 5, 40, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      const swayOffset = Math.sin(frameCount * 0.02) * 2 * healthMultiplier;

      if (stage === 'seed') {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY - 5, 8, 6, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY - 5, 8, 6, Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stage === 'sprout') {
        ctx.strokeStyle = colors.stem;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.quadraticCurveTo(centerX + swayOffset, baseY - 25, centerX + swayOffset * 1.5, baseY - 40);
        ctx.stroke();

        ctx.fillStyle = colors.leaf;
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 - 8, baseY - 35, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 + 8, baseY - 35, 8, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage === 'adult') {
        ctx.strokeStyle = colors.stem;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.quadraticCurveTo(centerX + swayOffset, baseY - 50, centerX + swayOffset * 1.5, baseY - 90);
        ctx.stroke();

        ctx.fillStyle = colors.leaf;
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 - 15, baseY - 70, 15, 6, -Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 + 15, baseY - 70, 15, 6, Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 - 12, baseY - 50, 12, 5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 + 12, baseY - 50, 12, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.leaf;
        ctx.beginPath();
        ctx.arc(centerX + swayOffset * 1.5, baseY - 95, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (stage === 'flowering') {
        ctx.strokeStyle = colors.stem;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.quadraticCurveTo(centerX + swayOffset, baseY - 50, centerX + swayOffset * 1.5, baseY - 100);
        ctx.stroke();

        ctx.fillStyle = colors.leaf;
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 - 18, baseY - 75, 18, 7, -Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 + 18, baseY - 75, 18, 7, Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 - 15, baseY - 55, 15, 6, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + swayOffset * 1.5 + 15, baseY - 55, 15, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        const flowerX = centerX + swayOffset * 1.5;
        const flowerY = baseY - 105;
        const petalCount = species === 'sunflower' ? 12 : 8;

        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 + frameCount * 0.005;
          const petalX = flowerX + Math.cos(angle) * 12;
          const petalY = flowerY + Math.sin(angle) * 12;

          ctx.fillStyle = colors.flower;
          ctx.beginPath();
          ctx.ellipse(petalX, petalY, 10, 5, angle, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = species === 'sunflower' ? '#8B4513' : '#FFD700';
        ctx.beginPath();
        ctx.arc(flowerX, flowerY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isHealthLow) {
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.3 + Math.sin(frameCount * 0.1) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, width - 10, height - 10);
      }
    };

    const drawParticles = () => {
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      for (const particle of particlesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1 / particle.maxLife;

        if (actionTriggered === 'water') {
          particle.vy += 0.1;
        } else if (actionTriggered === 'fertilize') {
          particle.vy += 0.08;
        }

        const alpha = Math.max(0, particle.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();

        if (actionTriggered === 'light') {
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawLightGlow = () => {
      if (actionTriggered === 'light') {
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2 - 30,
          0,
          width / 2,
          height / 2 - 30,
          80
        );
        gradient.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      drawLightGlow();
      drawPlant();
      drawParticles();

      frameCount++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [species, stage, health, width, height, actionTriggered]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
};

export default PlantCanvas;
