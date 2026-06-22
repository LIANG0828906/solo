import { useState, useEffect } from 'react';
import type { QuizQuestion } from '@/types';

interface QuizProps {
  question: QuizQuestion;
  onAnswer: (exhibitId: string, correct: boolean) => void;
  onClose: () => void;
}

const playBeep = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  gain.gain.value = 0.3;
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export default function Quiz({ question, onAnswer, onClose }: QuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (isCorrect === true) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (isCorrect === false) {
      const timer = setTimeout(() => {
        setSelectedIndex(null);
        setIsCorrect(null);
        setShaking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, onClose]);

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;

    const correct = index === question.correctIndex;
    setSelectedIndex(index);
    setIsCorrect(correct);
    onAnswer(question.exhibitId, correct);

    if (correct) {
      playBeep();
    } else {
      setShaking(true);
    }
  };

  const getButtonStyle = (index: number) => {
    const base =
      'w-full rounded-lg bg-navy-light text-white text-base py-3 px-4 mb-2 cursor-pointer transition-colors';

    if (selectedIndex === null) {
      return `${base} hover:bg-navy-hover`;
    }

    if (index === selectedIndex) {
      return isCorrect
        ? `${base} bg-correct`
        : `${base} bg-incorrect ${shaking ? 'animate-shake' : ''}`;
    }

    return `${base} opacity-50 cursor-not-allowed`;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="animate-pop-in bg-navy text-white text-base p-6 rounded-lg relative w-[420px] max-[480px]:w-[90%] max-[480px]:max-w-[360px]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white text-xl leading-none cursor-pointer hover:opacity-70 transition-opacity"
        >
          ✕
        </button>

        <p className="font-serif text-lg mb-5">{question.question}</p>

        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={selectedIndex !== null}
            className={getButtonStyle(index)}
          >
            {option}
          </button>
        ))}

        {isCorrect !== null && (
          <p className="mt-3 text-center text-base">
            {isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
          </p>
        )}
      </div>
    </div>
  );
}
