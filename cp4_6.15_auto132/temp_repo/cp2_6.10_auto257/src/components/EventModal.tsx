import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Bug, Skull, BugOff, Flame } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import type { GameEvent } from '../types';

const EVENT_ICONS: Record<GameEvent['type'], typeof Bug> = {
  plague: Flame,
  pest: BugOff,
  poison: Skull,
  worm: Bug,
};

const EVENT_COLORS: Record<GameEvent['type'], string> = {
  plague: '#c0392b',
  pest: '#7a9e7a',
  poison: '#8b4513',
  worm: '#d4a351',
};

interface EventOptionProps {
  text: string;
  onClick: () => void;
  timeLeft: number;
  totalTime: number;
  index: number;
}

function EventOption({ text, onClick, timeLeft, totalTime, index }: EventOptionProps) {
  const progress = (timeLeft / totalTime) * 100;

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(212, 163, 81, 0.2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full p-4 text-left border-2 border-earth/40 rounded-lg bg-paper/80 hover:border-earth/80 transition-all overflow-hidden group"
    >
      <div
        className="absolute bottom-0 left-0 h-1 bg-earth/60 transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
      <span className="font-kai text-ink group-hover:text-pine transition-colors">{text}</span>
    </motion.button>
  );
}

export function EventModal() {
  const { currentEvent, setEvent, handleEventResult } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      setIsVisible(true);
      setTimeLeft(currentEvent.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setIsVisible(false);
    }
  }, [currentEvent]);

  const handleTimeout = () => {
    if (currentEvent) {
      const worstOption = currentEvent.options.reduce(
        (worst, opt) => 
          opt.scoreEffect < worst.scoreEffect ? opt : worst,
        currentEvent.options[0]
      );
      handleSelect(worstOption.id);
    }
  };

  const handleSelect = async (optionId: string) => {
    if (!currentEvent) return;

    const result = await api.handleEvent(currentEvent.id, optionId);
    handleEventResult(result.scoreEffect, result.knowledgeEffect, result.message);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setEvent(null), 300);
    }, 500);
  };

  if (!currentEvent) return null;

  const Icon = EVENT_ICONS[currentEvent.type];
  const color = EVENT_COLORS[currentEvent.type];
  const urgency = timeLeft <= 5 ? 'animate-pulse' : '';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(44, 24, 16, 0.6)' }}
        >
          <motion.div
            initial={{ scaleY: 0, opacity: 0, transformOrigin: 'top' }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="scroll-panel w-full max-w-lg p-6 relative overflow-hidden"
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: color + '40' }}
            >
              <motion.div
                className="h-full"
                style={{ backgroundColor: color }}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / currentEvent.timeLimit) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>

            <div className="flex items-start gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-8 h-8" />
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5" style={{ color }} />
                  <h2 className="font-kai text-2xl text-ink">{currentEvent.title}</h2>
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: -12 }}
                    className="seal text-xs ml-auto"
                    style={{ animationDelay: '0.3s' }}
                  >
                    急
                  </motion.div>
                </div>
                <p className="text-ink/80 leading-relaxed">{currentEvent.description}</p>
              </div>
            </div>

            <div className={`flex items-center justify-center gap-2 mb-6 ${urgency}`}>
              <Clock className="w-5 h-5" style={{ color: timeLeft <= 5 ? '#c0392b' : color }} />
              <span 
                className="font-kai text-3xl"
                style={{ color: timeLeft <= 5 ? '#c0392b' : color }}
              >
                {timeLeft}
              </span>
              <span className="text-ink/60">秒</span>
            </div>

            <div className="space-y-3">
              {currentEvent.options.map((option, index) => (
                <EventOption
                  key={option.id}
                  text={option.text}
                  onClick={() => handleSelect(option.id)}
                  timeLeft={timeLeft}
                  totalTime={currentEvent.timeLimit}
                  index={index}
                />
              ))}
            </div>

            <div className="mt-4 text-center text-xs text-ink/50">
              ⚡ 快速做出选择，影响最终评分
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
