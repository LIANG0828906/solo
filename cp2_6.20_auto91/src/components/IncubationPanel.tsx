import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useIncubationStore } from '../store/incubationStore';
import { getSuccessRateColor } from '../utils/calculations';
import ProgressGauge from './ProgressGauge';
import { Flame, Droplets, Zap, Play, RotateCcw } from 'lucide-react';

const IncubationPanel: React.FC = () => {
  const environment = useIncubationStore((state) => state.environment);
  const successRate = useIncubationStore((state) => state.successRate);
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);
  const isIncubating = useIncubationStore((state) => state.isIncubating);
  const incubationProgress = useIncubationStore((state) => state.incubationProgress);
  const remainingTime = useIncubationStore((state) => state.remainingTime);
  const evolutionStage = useIncubationStore((state) => state.evolutionStage);
  const setEnvironment = useIncubationStore((state) => state.setEnvironment);
  const startIncubation = useIncubationStore((state) => state.startIncubation);
  const reset = useIncubationStore((state) => state.reset);

  const isInteractingRef = useRef<string | null>(null);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const [pulseScale, setPulseScale] = useState<Record<string, number>>({
    temperature: 1,
    humidity: 1,
    aura: 1,
  });

  const handleSliderChange = useCallback(
    (param: keyof typeof environment, value: number) => {
      setEnvironment({ [param]: value });
    },
    [setEnvironment]
  );

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<Record<string, number>>({
    temperature: 0,
    humidity: 0,
    aura: 0,
  });

  const handlePointerDown = useCallback((key: string) => {
    isInteractingRef.current = key;
    setActiveSlider(key);
    startTimeRef.current[key] = performance.now();
  }, []);

  const handlePointerUp = useCallback(() => {
    isInteractingRef.current = null;
    setActiveSlider(null);
  }, []);

  const handleInput = useCallback((key: string) => {
    isInteractingRef.current = key;
    setActiveSlider(key);
    if (startTimeRef.current[key] === 0) {
      startTimeRef.current[key] = performance.now();
    }
  }, []);

  const handleTouchStart = useCallback((key: string) => {
    isInteractingRef.current = key;
    setActiveSlider(key);
    startTimeRef.current[key] = performance.now();
  }, []);

  const handleTouchEnd = useCallback(() => {
    isInteractingRef.current = null;
    setActiveSlider(null);
  }, []);

  useEffect(() => {
    const targetScale = 1.8;
    const period = 0.7;
    const frequency = (Math.PI * 2) / period;

    const animate = () => {
      const now = performance.now();
      const newPulseScale: Record<string, number> = {
        temperature: 1,
        humidity: 1,
        aura: 1,
      };

      (['temperature', 'humidity', 'aura'] as const).forEach((key) => {
        if (isInteractingRef.current === key) {
          const elapsed = (now - startTimeRef.current[key]) / 1000;
          newPulseScale[key] =
            1 + (targetScale - 1) * (0.5 + 0.5 * Math.sin(elapsed * frequency));
        }
      });

      setPulseScale(newPulseScale);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const sliders = [
    {
      key: 'temperature' as const,
      label: '温度',
      min: -10,
      max: 50,
      unit: '℃',
      icon: Flame,
      iconColor: '#ff6347',
    },
    {
      key: 'humidity' as const,
      label: '湿度',
      min: 0,
      max: 100,
      unit: '%',
      icon: Droplets,
      iconColor: '#1e90ff',
    },
    {
      key: 'aura' as const,
      label: '灵气场',
      min: 0,
      max: 200,
      unit: '',
      icon: Zap,
      iconColor: '#9932cc',
    },
  ];

  const successColor = getSuccessRateColor(successRate);

  const showHatchingControls = evolutionStage === 'egg';
  const showProgress = isIncubating || incubationProgress > 0;

  return (
    <>
      <div className="space-y-6">
        {showHatchingControls && (
          <>
            <div>
              <h3
                className="text-lg font-bold tracking-wide mb-4"
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  color: '#b0b0d0',
                }}
              >
                孵化环境
              </h3>

              <div className="space-y-5">
                {sliders.map((slider) => {
                  const Icon = slider.icon;
                  const isActive = activeSlider === slider.key;

                  return (
                    <div key={slider.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className="text-sm font-medium"
                          style={{ fontFamily: "'Lato', sans-serif", color: '#b0b0d0' }}
                        >
                          {slider.label}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            fontFamily: "'Cinzel Decorative', serif",
                            color: slider.iconColor,
                          }}
                        >
                          {environment[slider.key]}
                          {slider.unit}
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          value={environment[slider.key]}
                          onChange={(e) => handleSliderChange(slider.key, Number(e.target.value))}
                          onPointerDown={() => handlePointerDown(slider.key)}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                          onInput={() => handleInput(slider.key)}
                          onTouchStart={() => handleTouchStart(slider.key)}
                          onTouchEnd={handleTouchEnd}
                          disabled={isIncubating}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${slider.iconColor} ${((environment[slider.key] - slider.min) / (slider.max - slider.min)) * 100}%, #2d2d44 ${((environment[slider.key] - slider.min) / (slider.max - slider.min)) * 100}%)`,
                            opacity: isIncubating ? 0.5 : 1,
                          }}
                        />
                      </div>

                      <div className="flex justify-center mt-2">
                        <div className="relative">
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: -6,
                                borderRadius: '50%',
                                border: `2px solid ${slider.iconColor}`,
                                opacity: 0.4 + 0.5 * ((pulseScale[slider.key] - 1) / 0.8),
                                transform: `scale(${pulseScale[slider.key]})`,
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isActive
                                ? `${slider.iconColor}30`
                                : `${slider.iconColor}15`,
                              border: `2px solid ${isActive ? slider.iconColor : slider.iconColor}40`,
                              transform: `scale(${pulseScale[slider.key]})`,
                              boxShadow: isActive
                                ? `0 0 ${8 + 40 * (pulseScale[slider.key] - 1) / 0.8}px ${slider.iconColor}, 0 0 ${16 + 80 * (pulseScale[slider.key] - 1) / 0.8}px ${slider.iconColor}60`
                                : 'none',
                              transition: !isActive ? 'transform 0.2s ease-out, box-shadow 0.2s ease-out' : 'none',
                            }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{
                                color: slider.iconColor,
                                filter: isActive
                                  ? `drop-shadow(0 0 ${4 + 10 * (pulseScale[slider.key] - 1) / 0.8}px ${slider.iconColor})`
                                  : 'none',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl border border-[#2d2d44] bg-[#0d0d1a]/50">
                <div className="text-center">
                  <div
                    className="text-sm mb-1"
                    style={{ fontFamily: "'Lato', sans-serif", color: '#6b7280' }}
                  >
                    孵化成功率
                  </div>
                  <div
                    className="text-4xl font-bold tracking-wider"
                    style={{
                      fontFamily: "'Cinzel Decorative', serif",
                      color: successColor,
                      textShadow: `0 0 20px ${successColor}60`,
                    }}
                  >
                    {selectedEgg ? successRate : '--'}%
                  </div>
                </div>
              </div>
            </div>

            {showProgress && (
              <div className="flex justify-center">
                <ProgressGauge
                  progress={incubationProgress}
                  remainingTime={remainingTime}
                  isIncubating={isIncubating}
                />
              </div>
            )}

            <div className="space-y-3">
              {!isIncubating && evolutionStage === 'egg' && (
                <button
                  onClick={startIncubation}
                  disabled={!selectedEgg}
                  className={`
                  w-full py-4 px-6 rounded-xl font-bold text-white
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  ${selectedEgg
                    ? 'bg-[#6c63ff] hover:bg-[#8b83ff] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6c63ff]/30 active:scale-95'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }
                `}
                  style={{ fontFamily: "'Cinzel Decorative', serif" }}
                >
                  <Play className="w-5 h-5" />
                  {incubationProgress > 0 ? '继续孵化' : '开始孵化'}
                </button>
              )}

              {evolutionStage !== 'egg' && (
                <button
                  onClick={reset}
                  className="w-full py-3 px-6 rounded-xl font-medium text-white/70
                  bg-[#2d2d44]/50 hover:bg-[#2d2d44] hover:text-white
                  transition-all duration-200 active:scale-95
                  flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <RotateCcw className="w-4 h-4" />
                  重新开始
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default IncubationPanel;
