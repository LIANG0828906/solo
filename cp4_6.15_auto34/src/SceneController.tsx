import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { WeatherType, ClickEffect, HSLColor } from './types';
import {
  getParticleParams,
  getBackgroundGradient,
  lerpHSL,
  hslToString,
  type ParticleConfig,
} from './WeatherEngine';
import {
  createClickEffect,
  drawRipple,
  drawSnowBurst,
  drawHeat,
  createLightningState,
  updateLightning,
  EFFECT_CLASSES,
  getScreenShakeConfig,
  getLightningFlashConfig,
  type LightningState,
} from './EffectsLibrary';

interface SceneControllerProps {
  weather: WeatherType;
  visibility: number;
  transitionDuration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  seed: number;
}

const FPS_WINDOW = 30;
const LOW_FPS_THRESHOLD = 40;
const DENSITY_SCALE_ON_LOW_FPS = 0.8;

const SceneController: React.FC<SceneControllerProps> = ({
  weather,
  visibility,
  transitionDuration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const clickEffectsRef = useRef<ClickEffect[]>([]);
  const animationFrameRef = useRef<number>(0);
  const fpsFramesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const densityScaleRef = useRef<number>(1);
  const lightningRef = useRef<LightningState>(createLightningState());

  const currentBgRef = useRef<[HSLColor, HSLColor]>(getBackgroundGradient(weather));
  const targetBgRef = useRef<[HSLColor, HSLColor]>(getBackgroundGradient(weather));
  const bgTransitionRef = useRef<{ start: number; duration: number } | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{
    masterGain: GainNode | null;
    noiseNode: AudioBufferSourceNode | null;
    noiseGain: GainNode | null;
    birdOsc: OscillatorNode | null;
    birdGain: GainNode | null;
    birdInterval: number | null;
    thunderOsc: OscillatorNode | null;
    thunderGain: GainNode | null;
    thunderInterval: number | null;
    fluteOsc: OscillatorNode | null;
    fluteGain: GainNode | null;
    fluteLFO: OscillatorNode | null;
    fluteLFOGain: GainNode | null;
  }>({
    masterGain: null,
    noiseNode: null,
    noiseGain: null,
    birdOsc: null,
    birdGain: null,
    birdInterval: null,
    thunderOsc: null,
    thunderGain: null,
    thunderInterval: null,
    fluteOsc: null,
    fluteGain: null,
    fluteLFO: null,
    fluteLFOGain: null,
  });

  const [lightningActive, setLightningActive] = useState(false);
  const [shakeKey, setShakeKey] = useState('');
  const screenShakeCfg = getScreenShakeConfig();
  const lightningCfg = getLightningFlashConfig();
  const fpsDebugRef = useRef<{ lastLog: number; currentFps: number }>({ lastLog: 0, currentFps: 60 });

  const createNoiseBuffer = useCallback((ctx: AudioContext, duration = 2): AudioBuffer => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    audioNodesRef.current.masterGain = ctx.createGain();
    audioNodesRef.current.masterGain.gain.value = 0.15;
    audioNodesRef.current.masterGain.connect(ctx.destination);
  }, []);

  const stopAllAudio = useCallback(() => {
    const nodes = audioNodesRef.current;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (nodes.birdInterval) {
      window.clearInterval(nodes.birdInterval);
      nodes.birdInterval = null;
    }
    if (nodes.thunderInterval) {
      window.clearInterval(nodes.thunderInterval);
      nodes.thunderInterval = null;
    }

    const stopNode = (node: { stop?: () => void; disconnect?: () => void } | null) => {
      try {
        node?.stop?.();
      } catch {
        /* ignore */
      }
      try {
        node?.disconnect?.();
      } catch {
        /* ignore */
      }
    };

    stopNode(nodes.noiseNode);
    stopNode(nodes.birdOsc);
    stopNode(nodes.thunderOsc);
    stopNode(nodes.fluteOsc);
    stopNode(nodes.fluteLFO);

    if (nodes.noiseGain) nodes.noiseGain.disconnect();
    if (nodes.birdGain) nodes.birdGain.disconnect();
    if (nodes.thunderGain) nodes.thunderGain.disconnect();
    if (nodes.fluteGain) nodes.fluteGain.disconnect();
    if (nodes.fluteLFOGain) nodes.fluteLFOGain.disconnect();

    nodes.noiseNode = null;
    nodes.noiseGain = null;
    nodes.birdOsc = null;
    nodes.birdGain = null;
    nodes.thunderOsc = null;
    nodes.thunderGain = null;
    nodes.fluteOsc = null;
    nodes.fluteGain = null;
    nodes.fluteLFO = null;
    nodes.fluteLFOGain = null;
  }, []);

  const playSunnyAudio = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = audioNodesRef.current.masterGain;
    if (!ctx || !master) return;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start();

    const birdGain = ctx.createGain();
    birdGain.gain.value = 0;
    birdGain.connect(master);

    const scheduleBird = () => {
      if (!audioCtxRef.current || !audioNodesRef.current.birdGain) return;
      const c = audioCtxRef.current;
      const osc = c.createOscillator();
      const g = c.createGain();
      const now = c.currentTime;
      const baseFreq = 2000 + Math.random() * 1500;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(g).connect(audioNodesRef.current.masterGain!);
      osc.start(now);
      osc.stop(now + 0.25);
    };

    const birdInterval = window.setInterval(scheduleBird, 2500 + Math.random() * 2000);

    audioNodesRef.current.noiseNode = noise;
    audioNodesRef.current.noiseGain = noiseGain;
    audioNodesRef.current.birdGain = birdGain;
    audioNodesRef.current.birdInterval = birdInterval;
  }, [createNoiseBuffer]);

  const playRainyAudio = useCallback((isStormy = false) => {
    const ctx = audioCtxRef.current;
    const master = audioNodesRef.current.masterGain;
    if (!ctx || !master) return;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = isStormy ? 0.25 : 0.18;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isStormy ? 4000 : 2500;
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start();

    const scheduleThunder = () => {
      if (!audioCtxRef.current || !audioNodesRef.current.masterGain) return;
      const c = audioCtxRef.current;
      const osc = c.createOscillator();
      const g = c.createGain();
      const now = c.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(g).connect(audioNodesRef.current.masterGain!);
      osc.start(now);
      osc.stop(now + 1.3);
    };

    const thunderInterval = window.setInterval(
      scheduleThunder,
      isStormy ? 6000 + Math.random() * 4000 : 12000 + Math.random() * 8000
    );

    audioNodesRef.current.noiseNode = noise;
    audioNodesRef.current.noiseGain = noiseGain;
    audioNodesRef.current.thunderInterval = thunderInterval;
  }, [createNoiseBuffer]);

  const playSnowyAudio = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = audioNodesRef.current.masterGain;
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 523.25;
    gain.gain.value = 0.05;

    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 0.02;

    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(master);

    osc.start();
    lfo.start();

    audioNodesRef.current.fluteOsc = osc;
    audioNodesRef.current.fluteGain = gain;
    audioNodesRef.current.fluteLFO = lfo;
    audioNodesRef.current.fluteLFOGain = lfoGain;
  }, []);

  const playThunderClap = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = audioNodesRef.current.masterGain;
    if (!ctx || !master) return;

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter).connect(g).connect(master);
    noise.start();
  }, []);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  useEffect(() => {
    stopAllAudio();
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* ignore */
      });
    }

    switch (weather) {
      case 'sunny':
        playSunnyAudio();
        break;
      case 'rainy':
        playRainyAudio(false);
        break;
      case 'snowy':
        playSnowyAudio();
        break;
      case 'stormy':
        playRainyAudio(true);
        break;
    }

    return () => {
      stopAllAudio();
    };
  }, [weather, playSunnyAudio, playRainyAudio, playSnowyAudio, stopAllAudio]);

  const initParticles = useCallback((params: ParticleConfig, width: number, height: number) => {
    const count = Math.floor(params.density * densityScaleRef.current);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const speed = params.speedRange[0] + Math.random() * (params.speedRange[1] - params.speedRange[0]);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * params.swayAmount,
        vy: speed,
        size: params.size * (0.7 + Math.random() * 0.6),
        opacity: 0.5 + Math.random() * 0.5,
        seed: Math.random() * 1000,
      });
    }
    particlesRef.current = particles;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    offscreenCanvasRef.current.width = rect.width * dpr;
    offscreenCanvasRef.current.height = rect.height * dpr;
    const offCtx = offscreenCanvasRef.current.getContext('2d');
    if (offCtx) {
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const params = getParticleParams(weather);
    initParticles(params, rect.width, rect.height);
  }, [weather, initParticles]);

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  useEffect(() => {
    targetBgRef.current = getBackgroundGradient(weather);
    bgTransitionRef.current = {
      start: performance.now(),
      duration: transitionDuration,
    };

    const canvas = canvasRef.current;
    if (canvas) {
      const params = getParticleParams(weather);
      const rect = canvas.getBoundingClientRect();
      initParticles(params, rect.width, rect.height);
    }

    if (weather !== 'stormy') {
      lightningRef.current = createLightningState();
      setLightningActive(false);
    }
  }, [weather, transitionDuration, initParticles]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const effect = createClickEffect(weather, x, y);
      clickEffectsRef.current.push(effect);

      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {
          /* ignore */
        });
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
    };
  }, [resizeCanvas, weather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen?.getContext('2d');

    const animate = (now: number) => {
      const container = containerRef.current;
      if (!container) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (lastTimeRef.current > 0) {
        const delta = now - lastTimeRef.current;
        fpsFramesRef.current.push(delta);
        if (fpsFramesRef.current.length > FPS_WINDOW) {
          fpsFramesRef.current.shift();
        }
        if (fpsFramesRef.current.length >= FPS_WINDOW) {
          const avgDelta = fpsFramesRef.current.reduce((a, b) => a + b, 0) / fpsFramesRef.current.length;
          const fps = 1000 / avgDelta;
          fpsDebugRef.current.currentFps = fps;
          if (fps < LOW_FPS_THRESHOLD) {
            if (densityScaleRef.current !== DENSITY_SCALE_ON_LOW_FPS) {
              densityScaleRef.current = DENSITY_SCALE_ON_LOW_FPS;
              const targetParams = getParticleParams(weather);
              const reducedCount = Math.floor(targetParams.density * DENSITY_SCALE_ON_LOW_FPS);
              if (particlesRef.current.length > reducedCount) {
                particlesRef.current.length = reducedCount;
              }
            }
          } else if (fps >= 55) {
            densityScaleRef.current = 1;
          }
          if (now - fpsDebugRef.current.lastLog > 5000) {
            fpsDebugRef.current.lastLog = now;
          }
        }
      }
      lastTimeRef.current = now;

      const params = getParticleParams(weather);
      const particleOpacity = visibility / 100;

      const cullingThreshold = Math.min(params.maxCount * 0.8, 200);
      const shouldCullInvisible = params.density * densityScaleRef.current > cullingThreshold;

      if (bgTransitionRef.current) {
        const t = Math.min(1, (now - bgTransitionRef.current.start) / bgTransitionRef.current.duration);
        currentBgRef.current = [
          lerpHSL(getBackgroundGradient(weather)[0], getBackgroundGradient(weather)[0], 1),
          lerpHSL(getBackgroundGradient(weather)[1], getBackgroundGradient(weather)[1], 1),
        ];
        const [fromTop, fromBottom] = bgTransitionRef.current.start === now
          ? getBackgroundGradient(weather)
          : currentBgRef.current;
        const [toTop, toBottom] = targetBgRef.current;
        currentBgRef.current = [lerpHSL(fromTop, toTop, t), lerpHSL(fromBottom, toBottom, t)];
      }

      const [topColor, bottomColor] = currentBgRef.current;
      const brightnessMod = 0.85 + (visibility / 100) * 0.15;
      const adjustedTop: HSLColor = { ...topColor, l: Math.min(topColor.l * brightnessMod, 95) };
      const adjustedBottom: HSLColor = { ...bottomColor, l: Math.min(bottomColor.l * brightnessMod, 90) };

      const useOffscreen = !!offCtx && !!offscreen && offscreen.width > 0 && offscreen.height > 0;
      const renderCtx = useOffscreen ? offCtx! : ctx;
      if (useOffscreen) {
        offCtx!.clearRect(0, 0, width, height);
      }
      const gradient = renderCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, hslToString(adjustedTop));
      gradient.addColorStop(1, hslToString(adjustedBottom));
      renderCtx.fillStyle = gradient;
      renderCtx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;
      const effectiveCount = Math.floor(params.density * densityScaleRef.current);

      if (particles.length !== effectiveCount) {
        if (particles.length < effectiveCount) {
          for (let i = particles.length; i < effectiveCount; i++) {
            const speed = params.speedRange[0] + Math.random() * (params.speedRange[1] - params.speedRange[0]);
            particles.push({
              x: Math.random() * width,
              y: -Math.random() * height,
              vx: (Math.random() - 0.5) * params.swayAmount,
              vy: speed,
              size: params.size * (0.7 + Math.random() * 0.6),
              opacity: 0.5 + Math.random() * 0.5,
              seed: Math.random() * 1000,
            });
          }
        } else {
          particles.length = effectiveCount;
        }
      }

      renderCtx.save();
      renderCtx.globalAlpha = particleOpacity;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx + Math.sin(now * 0.001 + p.seed) * params.swayAmount * 0.3;
        p.y += p.vy;

        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const inBoundsX = p.x >= -20 && p.x <= width + 20;
        const inBoundsY = p.y >= -20 && p.y <= height + 20;
        const isVisible = inBoundsX && inBoundsY;
        if (!isVisible && shouldCullInvisible) {
          continue;
        }

        renderCtx.fillStyle = params.color;
        renderCtx.globalAlpha = p.opacity * particleOpacity;

        if (weather === 'snowy') {
          drawHexagon(renderCtx, p.x, p.y, p.size);
          renderCtx.fill();
        } else if (weather === 'rainy' || weather === 'stormy') {
          if (params.hasTrail) {
            renderCtx.beginPath();
            renderCtx.moveTo(p.x, p.y);
            renderCtx.lineTo(p.x, p.y + p.size * 6);
            renderCtx.lineWidth = p.size;
            renderCtx.strokeStyle = params.color;
            renderCtx.stroke();
          } else {
            renderCtx.fillRect(p.x, p.y, p.size, p.size * 3);
          }
        } else {
          renderCtx.beginPath();
          renderCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          renderCtx.fill();
        }
      }

      renderCtx.restore();

      clickEffectsRef.current = clickEffectsRef.current.filter((effect) => {
        switch (effect.kind) {
          case 'ripple':
            return drawRipple(renderCtx, effect.data, now);
          case 'snowburst':
            return drawSnowBurst(renderCtx, effect.data, now);
          case 'heat':
            return drawHeat(renderCtx, effect.data, now);
        }
      });

      if (weather === 'stormy') {
        lightningRef.current = updateLightning(lightningRef.current, now, () => {
          setLightningActive(true);
          setShakeKey(screenShakeCfg.triggerKey());
          playThunderClap();
          window.setTimeout(() => setLightningActive(false), lightningCfg.durationMs);
          window.setTimeout(() => setShakeKey(''), screenShakeCfg.durationMs);
        });
      }

      if (useOffscreen && offscreen) {
        ctx.drawImage(offscreen, 0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [weather, visibility, playThunderClap]);

  const containerClass = shakeKey
    ? `scene-canvas-container ${screenShakeCfg.className}`
    : 'scene-canvas-container';

  return (
    <div
      ref={containerRef}
      className={containerClass}
      key={shakeKey || undefined}
    >
      <canvas ref={canvasRef} className="scene-canvas" />
      <div
        className={`${lightningCfg.containerClassName} ${lightningActive ? lightningCfg.activeClassName : ''}`}
      />
    </div>
  );
};

export default SceneController;
