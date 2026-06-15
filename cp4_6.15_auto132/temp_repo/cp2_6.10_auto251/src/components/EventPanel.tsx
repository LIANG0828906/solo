import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Skull, Bug, Virus } from 'lucide-react';
import { GameEvent, EventOption, ResolveEventResponse } from '../types';
import { cn } from '../lib/utils';

interface EventPanelProps {
  event: GameEvent;
  onResolve: (eventId: string, optionId: string) => void;
  result?: ResolveEventResponse;
  isOpen: boolean;
  onClose?: () => void;
}

const eventIcons = {
  shortage: AlertTriangle,
  poison: Skull,
  bookworm: Bug,
  plague: Virus,
};

const eventColors = {
  shortage: 'text-wood-brown',
  poison: 'text-cinnabar-red',
  bookworm: 'text-herb-green-dark',
  plague: 'text-purple-700',
};

const eventBgColors = {
  shortage: 'bg-wood-brown/10',
  poison: 'bg-cinnabar-red/10',
  bookworm: 'bg-herb-green/10',
  plague: 'bg-purple-100',
};

export default function EventPanel({ event, onResolve, result, isOpen, onClose }: EventPanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (option: EventOption) => {
    if (selectedOption) return;
    setSelectedOption(option.id);
    onResolve(event.id, option.id);
    setTimeout(() => setShowResult(true), 500);
  };

  const handleClose = () => {
    setSelectedOption(null);
    setShowResult(false);
    onClose?.();
  };

  const Icon = eventIcons[event.type];
  const colorClass = eventColors[event.type];
  const bgClass = eventBgColors[event.type];

  const getEffectText = () => {
    if (!result?.effect) return '';
    const parts: string[] = [];
    if (result.effect.knowledge) {
      parts.push(`学识 ${result.effect.knowledge > 0 ? '+' : ''}${result.effect.knowledge}`);
    }
    if (result.effect.score) {
      parts.push(`积分 ${result.effect.score > 0 ? '+' : ''}${result.effect.score}`);
    }
    if (result.effect.timeBonus) {
      parts.push(`时间 ${result.effect.timeBonus > 0 ? '+' : ''}${result.effect.timeBonus}`);
    }
    return parts.join('，');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink-black/60 backdrop-blur-sm"
            onClick={showResult ? handleClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-lg"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="relative paper-texture bg-paper-cream border-4 border-ink-black rounded-lg shadow-ink overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 20% 50%, #2d2d2d 0%, transparent 50%)',
                }}
              />

              <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-ink-black/5 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-ink-black/5 blur-3xl" />

              <div className="relative p-6">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className={cn('p-3 rounded-lg', bgClass)}
                    initial={{ rotate: -10, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <Icon className={cn('w-8 h-8', colorClass)} />
                  </motion.div>

                  <div>
                    <motion.div
                      className="text-xs text-ink-black-lighter font-kai tracking-widest"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      【{event.type === 'shortage' ? '药事' : event.type === 'poison' ? '毒情' : event.type === 'bookworm' ? '虫患' : '时疫'}】
                    </motion.div>
                    <motion.h2
                      className="text-2xl font-bold text-ink-black font-kai"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {event.title}
                    </motion.h2>
                  </div>
                </div>

                <motion.div
                  className="mb-6 p-4 bg-paper-white/50 rounded-lg border border-wood-brown/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-ink-black-light leading-relaxed font-song text-base">
                    {event.description}
                  </p>
                </motion.div>

                <AnimatePresence mode="wait">
                  {!showResult ? (
                    <motion.div
                      key="options"
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="text-xs text-ink-black-lighter font-kai mb-2 tracking-wider">
                        ━━ 请选择处置方案 ━━
                      </div>
                      {event.options.map((option, index) => (
                        <motion.button
                          key={option.id}
                          onClick={() => handleOptionClick(option)}
                          disabled={!!selectedOption}
                          className={cn(
                            'w-full text-left p-4 rounded-lg border-2 transition-all duration-300',
                            'bg-paper-white hover:bg-paper-white-dark',
                            'border-wood-brown/30 hover:border-herb-green',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            selectedOption === option.id && 'border-herb-green bg-herb-green/5'
                          )}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + index * 0.1 }}
                          whileHover={{ scale: selectedOption ? 1 : 1.02, x: selectedOption ? 0 : 4 }}
                          whileTap={{ scale: selectedOption ? 1 : 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-wood-brown/10 text-wood-brown flex items-center justify-center text-sm font-bold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-ink-black font-song">{option.text}</span>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="result"
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className={cn(
                          'inline-block px-6 py-3 rounded-lg mb-4',
                          result?.success ? 'bg-herb-green/10 border-2 border-herb-green' : 'bg-cinnabar-red/10 border-2 border-cinnabar-red'
                        )}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        <span className={cn(
                          'text-lg font-bold font-kai',
                          result?.success ? 'text-herb-green' : 'text-cinnabar-red'
                        )}>
                          {result?.success ? '✓ 处置得当' : '✗ 处置失当'}
                        </span>
                      </motion.div>

                      <motion.p
                        className="text-ink-black-light mb-4 font-song"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {result?.message}
                      </motion.p>

                      {result?.effect && (
                        <motion.div
                          className="inline-flex items-center gap-2 px-4 py-2 bg-paper-white rounded-lg border border-wood-brown/20 mb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <span className="text-ink-black-lighter text-sm">效果：</span>
                          <span className={cn(
                            'font-bold',
                            (result.effect.knowledge ?? 0) >= 0 && (result.effect.score ?? 0) >= 0
                              ? 'text-herb-green'
                              : 'text-cinnabar-red'
                          )}>
                            {getEffectText()}
                          </span>
                        </motion.div>
                      )}

                      <motion.button
                        onClick={handleClose}
                        className="px-8 py-3 bg-herb-green text-white rounded-lg font-kai text-lg hover:bg-herb-green-light transition-colors shadow-herb"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        继续
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 400 300" preserveAspectRatio="none">
                <path
                  d="M0,50 Q100,30 200,50 T400,40"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M0,250 Q100,270 200,250 T400,260"
                  stroke="#2d2d2d"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
