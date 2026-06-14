import { useEffect, useState, useRef } from 'react';
import { X, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'celebration';
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'celebration',
}: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (type === 'celebration') {
        setTimeout(() => {
          startCelebration();
        }, 200);
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      cleanupConfetti();
    };
  }, [isOpen, type]);

  const startCelebration = () => {
    cleanupConfetti();

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    confettiCanvasRef.current = canvas;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });
    confettiInstanceRef.current = myConfetti;
    isRunningRef.current = true;

    const colors = ['#FF8C42', '#FFD199', '#FFA333', '#FFB86C', '#FFFFFF', '#FFE4B5'];

    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      gravity: 1.2,
      scalar: 1.2,
      shapes: ['circle', 'square'],
      colors,
    };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const frame = () => {
      if (!isRunningRef.current || !myConfetti) return;

      const timeLeft = animationEnd - Date.now();
      const ticks = Math.max(200, 500 * (timeLeft / duration));

      myConfetti({
        ...defaults,
        particleCount: 2,
        origin: { x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2 },
      });
      myConfetti({
        ...defaults,
        particleCount: 2,
        origin: { x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2 },
      });

      if (timeLeft > 0) {
        animationFrameRef.current = requestAnimationFrame(frame);
      } else {
        isRunningRef.current = false;
      }
    };

    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      scalar: 1.2,
    });

    setTimeout(() => {
      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(frame);
      }
    }, 300);
  };

  const cleanupConfetti = () => {
    isRunningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (confettiInstanceRef.current) {
      try {
        confettiInstanceRef.current = null;
      } catch (e) {
        console.error('Error cleaning up confetti instance:', e);
      }
    }

    if (confettiCanvasRef.current) {
      if (confettiCanvasRef.current.parentNode) {
        confettiCanvasRef.current.parentNode.removeChild(confettiCanvasRef.current);
      }
      confettiCanvasRef.current = null;
    }
  };

  const handleClose = () => {
    cleanupConfetti();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-all duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8',
          'shadow-2xl transition-all duration-500',
          'transform',
          isOpen ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 to-primary-500" />

        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg animate-bounce">
            <Gift className="h-10 w-10 text-white" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-800">{title}</h2>
          <p className="mb-8 text-gray-600">{message}</p>

          <button
            onClick={handleClose}
            className={cn(
              'relative w-full overflow-hidden rounded-2xl px-8 py-4 font-semibold text-white',
              'bg-gradient-to-r from-primary-500 to-primary-400',
              'shadow-lg shadow-primary-200',
              'transition-all duration-300',
              'hover:shadow-xl hover:shadow-primary-300 hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-md'
            )}
          >
            太棒了！
          </button>
        </div>
      </div>
    </div>
  );
}
