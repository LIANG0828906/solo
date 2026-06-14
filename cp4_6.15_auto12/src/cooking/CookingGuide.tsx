import { useState, useEffect, useRef, useCallback } from 'react';
import type { Recipe, RecipeStep } from '@/shared/types';
import { useAppStore } from '@/shared/store';
import { Timer, ChevronRight, ArrowLeft, Trophy, Star, RotateCcw } from 'lucide-react';

const STEP_OUT_KEYFRAMES = `
@keyframes stepOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}`;
const STEP_IN_KEYFRAMES = `
@keyframes stepIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`;
const STEP_OUT_BACK_KEYFRAMES = `
@keyframes stepOutBack {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}`;
const STEP_IN_BACK_KEYFRAMES = `
@keyframes stepInBack {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`;
const PULSE_KEYFRAMES = `
@keyframes timerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(107,142,35,0.4); }
  50% { box-shadow: 0 0 0 12px rgba(107,142,35,0); }
}`;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StarCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#6B8E23', '#b8955a', '#cbb07e', '#facc15', '#fcd34d'];
    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      speed: 1 + Math.random() * 2,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
    }));

    startTimeRef.current = Date.now();

    function draw() {
      if (!ctx || !canvas) return;
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > 5000) {
        cancelAnimationFrame(animRef.current);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.y += p.speed;
        const sway = Math.sin(p.y * p.swaySpeed + p.swayOffset) * 1.5;
        const fadeFactor = Math.max(0, 1 - p.y / canvas.height);

        ctx.globalAlpha = fadeFactor;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const cx = p.x + sway;
        const cy = p.y;
        const r = p.size;
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const outerX = cx + r * Math.cos(angle);
          const outerY = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          const innerAngle = angle + (2 * Math.PI) / 10;
          const innerX = cx + (r * 0.4) * Math.cos(innerAngle);
          const innerY = cy + (r * 0.4) * Math.sin(innerAngle);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();

        if (p.y > canvas.height) {
          p.y = Math.random() * -50;
          p.x = Math.random() * canvas.width;
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={500}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

function StepContent({
  step,
  timerSeconds,
  timerRunning,
  timerFlashing,
  onToggleTimer,
  onResetTimer,
}: {
  step: RecipeStep;
  timerSeconds: number;
  timerRunning: boolean;
  timerFlashing: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-lg p-8">
      <div className="text-5xl font-serif text-wood-500 mb-4">{step.stepNumber}</div>
      <p className="text-lg text-wood-800 mb-6">{step.description}</p>

      {step.timerSeconds != null && step.timerSeconds > 0 && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <div
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors duration-300 ${
              timerFlashing
                ? 'border-olive-500 animate-[timerPulse_1s_ease-in-out_infinite]'
                : timerSeconds === 0
                ? 'border-olive-500'
                : 'border-wood-200'
            }`}
          >
            <span className="text-2xl font-mono font-bold text-wood-700">
              {formatTime(timerSeconds)}
            </span>
          </div>
          {step.timerLabel && (
            <span className="text-sm text-wood-400">{step.timerLabel}</span>
          )}
          <div className="flex gap-3">
            <button
              onClick={onToggleTimer}
              className="rounded-xl px-6 py-3 font-medium bg-olive-500 text-white hover:bg-olive-600 transition-colors"
            >
              {timerRunning ? '暂停' : timerSeconds === 0 ? '已完成' : '开始'}
            </button>
            <button
              onClick={onResetTimer}
              className="rounded-xl px-4 py-3 font-medium bg-cream-200 text-wood-600 hover:bg-cream-300 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletionScreen({ recipe }: { recipe: Recipe }) {
  const store = useAppStore();
  const [showCanvas, setShowCanvas] = useState(true);

  useEffect(() => {
    store.addExperience(50);
    store.setCookingRecipe(null);
    const t = setTimeout(() => setShowCanvas(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <StarCanvas active={showCanvas} />
      <Trophy className="w-20 h-20 text-olive-500" />
      <h2 className="text-3xl font-serif text-wood-700">烹饪完成!</h2>
      <p className="text-xl text-olive-500 font-medium">+50 经验值</p>
      <p className="text-lg text-wood-500">{recipe.name}</p>
      <button
        onClick={() => store.setCurrentPage('recipes')}
        className="rounded-xl px-6 py-3 font-medium bg-olive-500 text-white hover:bg-olive-600 transition-colors mt-4"
      >
        返回推荐
      </button>
    </div>
  );
}

export default function CookingGuide() {
  const cookingRecipe = useAppStore((s) => s.cookingRecipe);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFlashing, setTimerFlashing] = useState(false);
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [displayStep, setDisplayStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recipe = cookingRecipe as Recipe | null;

  const initTimer = useCallback(
    (stepIndex: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setTimerRunning(false);
      setTimerFlashing(false);
      if (recipe && recipe.steps[stepIndex]?.timerSeconds != null) {
        setTimerSeconds(recipe.steps[stepIndex].timerSeconds!);
      } else {
        setTimerSeconds(0);
      }
    },
    [recipe]
  );

  useEffect(() => {
    if (recipe) {
      initTimer(0);
      setCurrentStep(0);
      setDisplayStep(0);
      setCompleted(false);
    }
  }, [recipe]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) {
      if (timerRunning && timerSeconds <= 0) {
        setTimerRunning(false);
        setTimerFlashing(true);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setTimerRunning(false);
          setTimerFlashing(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSeconds]);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ArrowLeft className="w-12 h-12 text-wood-300" />
        <p className="text-xl text-wood-400">请先选择一个菜谱</p>
        <button
          onClick={() => setCurrentPage('recipes')}
          className="rounded-xl px-6 py-3 font-medium bg-olive-500 text-white hover:bg-olive-600 transition-colors"
        >
          返回菜谱
        </button>
      </div>
    );
  }

  const steps = recipe.steps;
  const step = steps[displayStep];

  const difficultyLabel: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  const difficultyColor: Record<string, string> = {
    easy: 'bg-olive-100 text-olive-700',
    medium: 'bg-wood-100 text-wood-700',
    hard: 'bg-red-100 text-red-700',
  };

  function goToStep(newIndex: number, direction: 'forward' | 'backward') {
    if (isAnimating) return;
    setAnimDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(newIndex);
      setDisplayStep(newIndex);
      initTimer(newIndex);
      setAnimDirection(null);
      setIsAnimating(false);
    }, 300);
  }

  function handleNext() {
    if (currentStep >= steps.length - 1) {
      setCompleted(true);
      return;
    }
    goToStep(currentStep + 1, 'forward');
  }

  function handlePrev() {
    if (currentStep <= 0) return;
    goToStep(currentStep - 1, 'backward');
  }

  function handleToggleTimer() {
    if (timerSeconds === 0) return;
    setTimerFlashing(false);
    setTimerRunning((prev) => !prev);
  }

  function handleResetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerRunning(false);
    setTimerFlashing(false);
    if (steps[currentStep]?.timerSeconds != null) {
      setTimerSeconds(steps[currentStep].timerSeconds!);
    }
  }

  if (completed) {
    return <CompletionScreen recipe={recipe} />;
  }

  const animStyle: React.CSSProperties = isAnimating
    ? animDirection === 'forward'
      ? { animation: 'stepOut 300ms ease-in forwards' }
      : { animation: 'stepOutBack 300ms ease-in forwards' }
    : animDirection === 'forward'
    ? { animation: 'stepIn 300ms ease-out forwards' }
    : animDirection === 'backward'
    ? { animation: 'stepInBack 300ms ease-out forwards' }
    : {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <style>{STEP_OUT_KEYFRAMES}</style>
      <style>{STEP_IN_KEYFRAMES}</style>
      <style>{STEP_OUT_BACK_KEYFRAMES}</style>
      <style>{STEP_IN_BACK_KEYFRAMES}</style>
      <style>{PULSE_KEYFRAMES}</style>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-wood-800">{recipe.name}</h1>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              difficultyColor[recipe.difficulty] || 'bg-wood-100 text-wood-700'
            }`}
          >
            {difficultyLabel[recipe.difficulty] || recipe.difficulty}
          </span>
          <span className="flex items-center gap-1 text-wood-500 text-sm">
            <Timer className="w-4 h-4" />
            {recipe.cookTime}分钟
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
        <div key={displayStep} style={animStyle}>
          <StepContent
            step={step}
            timerSeconds={timerSeconds}
            timerRunning={timerRunning}
            timerFlashing={timerFlashing}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-4 h-4 bg-olive-500'
                : i < currentStep
                ? 'w-2.5 h-2.5 bg-wood-300'
                : 'w-2.5 h-2.5 bg-cream-300'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="rounded-xl px-6 py-3 font-medium bg-cream-200 text-wood-600 hover:bg-cream-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          上一步
        </button>
        <button
          onClick={handleNext}
          className="rounded-xl px-6 py-3 font-medium bg-olive-500 text-white hover:bg-olive-600 transition-colors flex items-center gap-2"
        >
          {currentStep >= steps.length - 1 ? (
            '完成'
          ) : (
            <>
              下一步
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
