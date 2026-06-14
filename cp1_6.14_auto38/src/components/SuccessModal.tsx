import { useEffect, useState } from 'react';
import { X, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

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

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (type === 'celebration') {
        fireConfetti();
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FF8C42', '#FFD199', '#FFA333', '#FFB86C', '#FFFFFF'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    setTimeout(frame, 200);
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
        onClick={onClose}
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
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg animate-bounce-soft">
            <Gift className="h-10 w-10 text-white" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-800">{title}</h2>
          <p className="mb-8 text-gray-600">{message}</p>

          <button
            onClick={onClose}
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
