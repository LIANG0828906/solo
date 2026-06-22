import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { StepType, BalmState } from '@/types';
import { SteamParticleSystem, LiquidParticleSystem } from '@/utils/particles';

interface CookingPotProps {
  flowerColor: string;
  oilColor: string;
  heatingProgress: number;
  thickness: number;
  transparency: number;
  balmState: BalmState;
  isHeating: boolean;
  isStirring: boolean;
  onStirComplete: () => void;
  onHeatComplete: () => void;
  onCoolComplete: () => void;
  currentStep: StepType;
}

export default function CookingPot({
  flowerColor,
  oilColor,
  heatingProgress,
  thickness,
  transparency,
  balmState,
  isHeating,
  isStirring,
  onStirComplete,
  onHeatComplete,
  onCoolComplete,
  currentStep,
}: CookingPotProps) {
  const steamCanvasRef = useRef<HTMLCanvasElement>(null);
  const liquidCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const steamSystemRef = useRef<SteamParticleSystem | null>(null);
  const liquidSystemRef = useRef<LiquidParticleSystem | null>(null);
  const stirProgressRef = useRef<number>(0);
  const coolTimerRef = useRef<number>(0);
  const potShakeRef = useRef<number>(0);

  const [potSize, setPotSize] = useState<number>(600);
  const [coolProgress, setCoolProgress] = useState<number>(0);

  const mixedColor = useMemo(() => {
    const hex = (c: string) => parseInt(c.slice(1), 16);
    const r1 = (hex(flowerColor) >> 16) & 255;
    const g1 = (hex(flowerColor) >> 8) & 255;
    const b1 = hex(flowerColor) & 255;
    const r2 = (hex(oilColor) >> 16) & 255;
    const g2 = (hex(oilColor) >> 8) & 255;
    const b2 = hex(oilColor) & 255;
    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);
    return `rgb(${r}, ${g}, ${b})`;
  }, [flowerColor, oilColor]);

  const potColor = useMemo(() => {
    const progress = heatingProgress / 100;
    const darkR = 183, darkG = 149, darkB = 11;
    const lightR = 230, lightG = 126, lightB = 34;
    const r = Math.round(darkR + (lightR - darkR) * progress);
    const g = Math.round(darkG + (lightG - darkG) * progress);
    const b = Math.round(darkB + (lightB - darkB) * progress);
    return `radial-gradient(ellipse at 30% 30%, rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 10)}) 0%, rgb(${r}, ${g}, ${b}) 50%, rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 20)}) 100%)`;
  }, [heatingProgress]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPotSize(280);
      } else if (window.innerWidth < 1024) {
        setPotSize(400);
      } else {
        setPotSize(600);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentStep === 'cool') {
      coolTimerRef.current = 0;
      setCoolProgress(0);
    }
  }, [currentStep]);

  useEffect(() => {
    const steamCanvas = steamCanvasRef.current;
    const liquidCanvas = liquidCanvasRef.current;
    if (!steamCanvas || !liquidCanvas) return;

    const steamCtx = steamCanvas.getContext('2d');
    const liquidCtx = liquidCanvas.getContext('2d');
    if (!steamCtx || !liquidCtx) return;

    const scale = potSize / 600;
    const centerX = potSize / 2;
    const centerY = potSize / 2;
    const potRadius = potSize * 0.35;

    steamCanvas.width = potSize;
    steamCanvas.height = potSize;
    liquidCanvas.width = potSize;
    liquidCanvas.height = potSize;

    if (!steamSystemRef.current) {
      steamSystemRef.current = new SteamParticleSystem(centerX, centerY - potRadius * 0.8, 40);
    } else {
      steamSystemRef.current.setBasePosition(centerX, centerY - potRadius * 0.8);
    }

    if (!liquidSystemRef.current) {
      liquidSystemRef.current = new LiquidParticleSystem(centerX, centerY, potRadius * 0.7, thickness, 40);
    } else {
      liquidSystemRef.current.setLiquidParams(centerX, centerY, potRadius * 0.7, thickness);
    }

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16;
      lastTimeRef.current = currentTime;

      steamCtx.clearRect(0, 0, potSize, potSize);
      liquidCtx.clearRect(0, 0, potSize, potSize);

      if (isHeating || heatingProgress > 0) {
        if (Math.random() < 0.15 * (heatingProgress / 100 + 0.2)) {
          steamSystemRef.current?.emit();
        }
        steamSystemRef.current?.update(deltaTime);
        steamSystemRef.current?.render(steamCtx);
      }

      if (currentStep === 'mix' || currentStep === 'heat' || currentStep === 'cool') {
        if (Math.random() < 0.1) {
          liquidSystemRef.current?.emit();
        }
        if (liquidSystemRef.current) {
          liquidSystemRef.current.setLiquidParams(centerX, centerY, potRadius * 0.7, thickness);
        }
        liquidSystemRef.current?.update(deltaTime);
        liquidSystemRef.current?.render(liquidCtx);
      }

      if (isStirring && currentStep === 'mix') {
        stirProgressRef.current += deltaTime * 0.033;
        potShakeRef.current = Math.sin(currentTime * 0.01) * 2 * scale;
        if (stirProgressRef.current >= 100) {
          stirProgressRef.current = 0;
          onStirComplete();
        }
      } else {
        potShakeRef.current *= 0.9;
      }

      if (isHeating && currentStep === 'heat') {
        if (heatingProgress >= 100) {
          onHeatComplete();
        }
      }

      if (currentStep === 'cool') {
        coolTimerRef.current += deltaTime;
        const progress = Math.min(100, (coolTimerRef.current / 3000) * 100);
        setCoolProgress(progress);
        if (progress >= 100) {
          onCoolComplete();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [potSize, isHeating, isStirring, currentStep, heatingProgress, thickness, onStirComplete, onHeatComplete, onCoolComplete]);

  const scale = potSize / 600;
  const potRadius = potSize * 0.35;
  const centerX = potSize / 2;
  const centerY = potSize / 2;
  const liquidOpacity = balmState === 'solid' ? 0.9 : transparency;
  const isBoiling = heatingProgress >= 70 && isHeating;
  const isCooling = currentStep === 'cool';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center transition-transform duration-75'
      )}
      style={{
        width: potSize,
        height: potSize + 80 * scale,
        transform: `translateX(${potShakeRef.current}px) rotate(${potShakeRef.current * 0.3}deg)`,
      }}
    >
      <div
        className="absolute bottom-0 rounded-xl"
        style={{
          width: potSize * 0.9,
          height: 60 * scale,
          background: `
            repeating-linear-gradient(
              90deg,
              #8B4513 0px,
              #8B4513 40px,
              #A0522D 40px,
              #A0522D 42px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 28px,
              #A0522D 28px,
              #A0522D 30px
            )
          `,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
        }}
      />

      <div
        className="absolute rounded-full"
        style={{
          width: potRadius * 2,
          height: potRadius * 2,
          top: centerY - potRadius,
          left: centerX - potRadius,
          background: potColor,
          boxShadow: `
            inset -${8 * scale}px -${8 * scale}px ${32 * scale}px rgba(0,0,0,0.4),
            inset ${8 * scale}px ${8 * scale}px ${32 * scale}px rgba(255,255,255,0.2),
            0 ${16 * scale}px ${48 * scale}px rgba(0,0,0,0.5)
          `,
        }}
      >
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: potRadius * 1.6,
            height: potRadius * 1.6,
            top: potRadius * 0.2,
            left: potRadius * 0.2,
            background: mixedColor,
            opacity: liquidOpacity,
            filter: isCooling ? `blur(${coolProgress * 0.02}px)` : 'none',
            boxShadow: isBoiling
              ? `inset 0 ${4 * scale}px ${16 * scale}px rgba(255,255,255,0.3), 0 0 ${20 * scale}px rgba(255,200,100,0.5)`
              : `inset 0 ${4 * scale}px ${16 * scale}px rgba(0,0,0,0.3)`,
            transition: 'filter 0.3s ease',
          }}
        >
          {isCooling && (
            <div
              className="absolute inset-0"
              style={{
                background: `
                  repeating-linear-gradient(
                    45deg,
                    rgba(255,255,255,${0.1 * (coolProgress / 100)}) 0px,
                    rgba(255,255,255,${0.1 * (coolProgress / 100)}) 4px,
                    transparent 4px,
                    transparent 8px
                  )
                `,
              }}
            />
          )}

          {isBoiling && (
            <>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/40 animate-ping"
                  style={{
                    width: (8 + Math.random() * 8) * scale,
                    height: (8 + Math.random() * 8) * scale,
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </>
          )}

          <canvas
            ref={liquidCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: potRadius * 1.6,
            height: potRadius * 1.6,
            top: potRadius * 0.2,
            left: potRadius * 0.2,
            background: `
              radial-gradient(
                ellipse at 30% 20%,
                rgba(255,255,255,0.4) 0%,
                rgba(255,255,255,0.1) 30%,
                transparent 60%
              )
            `,
          }}
        />
      </div>

      <canvas
        ref={steamCanvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: potSize, height: potSize }}
      />

      {currentStep === 'mix' && isStirring && (
        <div
          className="absolute bg-gradient-to-r from-amber-500 to-orange-500 rounded-full overflow-hidden"
          style={{
            width: potSize * 0.6,
            height: 8 * scale,
            top: centerY + potRadius + 20 * scale,
            left: centerX - potSize * 0.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-yellow-300 to-amber-300 transition-all duration-100"
            style={{ width: `${stirProgressRef.current}%` }}
          />
        </div>
      )}

      {currentStep === 'heat' && (
        <div
          className="absolute bg-gradient-to-r from-red-700 to-red-500 rounded-full overflow-hidden"
          style={{
            width: potSize * 0.6,
            height: 8 * scale,
            top: centerY + potRadius + 20 * scale,
            left: centerX - potSize * 0.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-300"
            style={{ width: `${heatingProgress}%` }}
          />
        </div>
      )}

      {currentStep === 'cool' && (
        <div
          className="absolute bg-gradient-to-r from-blue-700 to-blue-500 rounded-full overflow-hidden"
          style={{
            width: potSize * 0.6,
            height: 8 * scale,
            top: centerY + potRadius + 20 * scale,
            left: centerX - potSize * 0.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-300 to-blue-300 transition-all duration-100"
            style={{ width: `${coolProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
