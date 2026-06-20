import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { X, Check, HelpCircle } from 'lucide-react';

const SYMBOLS = ['✧', '❋', '✿', '❀', '✦', '❉', '✺', '❃'];

interface SymbolPair {
  id: number;
  symbol: string;
  matched: boolean;
  selected: boolean;
}

interface SequenceItem {
  id: number;
  symbol: string;
  order: number;
  clicked: boolean;
  highlight: boolean;
}

export default function Puzzle() {
  const { puzzle, solvePuzzle } = useGameStore((state) => ({
    puzzle: state.puzzle,
    solvePuzzle: state.solvePuzzle
  }));

  const [symbolPairs, setSymbolPairs] = useState<SymbolPair[]>([]);
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showingSequence, setShowingSequence] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (puzzle.isActive) {
      if (puzzle.type === 'symbol-match') {
        initSymbolMatch();
      } else {
        initSequenceClick();
      }
    }
  }, [puzzle.isActive, puzzle.type, puzzle.attempts]);

  const initSymbolMatch = () => {
    const selectedSymbols = SYMBOLS.slice(0, 4);
    const pairs = [...selectedSymbols, ...selectedSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        matched: false,
        selected: false
      }));
    setSymbolPairs(pairs);
  };

  const initSequenceClick = () => {
    const count = 4 + Math.min(puzzle.attempts, 2);
    const items: SequenceItem[] = [];
    const usedSymbols = SYMBOLS.slice(0, count);
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: i,
        symbol: usedSymbols[i],
        order: i + 1,
        clicked: false,
        highlight: false
      });
    }
    
    const shuffled = items.sort(() => Math.random() - 0.5);
    setSequenceItems(shuffled);
    setCurrentSequence([]);
    playSequenceHint(shuffled);
  };

  const playSequenceHint = async (items: SequenceItem[]) => {
    setShowingSequence(true);
    const sorted = [...items].sort((a, b) => a.order - b.order);
    
    for (const item of sorted) {
      setSequenceItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, highlight: true } : i
        )
      );
      await new Promise(r => setTimeout(r, 600));
      setSequenceItems(prev =>
        prev.map(i =>
          i.id === item.id ? { ...i, highlight: false } : i
        )
      );
      await new Promise(r => setTimeout(r, 200));
    }
    
    setShowingSequence(false);
  };

  const handleSymbolClick = (id: number) => {
    if (puzzle.type !== 'symbol-match') return;
    
    const selected = symbolPairs.filter(p => p.selected && !p.matched);
    
    if (selected.length === 2) return;
    
    setSymbolPairs(prev =>
      prev.map(p =>
        p.id === id ? { ...p, selected: true } : p
      )
    );

    const newSelected = symbolPairs
      .filter(p => (p.selected || p.id === id) && !p.matched);
    
    if (newSelected.length === 2) {
      setTimeout(() => {
        if (newSelected[0].symbol === newSelected[1].symbol) {
          setSymbolPairs(prev =>
            prev.map(p =>
              newSelected.some(s => s.id === p.id)
                ? { ...p, matched: true, selected: false }
                : p
            )
          );
          setMessage('配对成功！');
          
          const allMatched = symbolPairs
            .filter(p => !p.matched)
            .every(p => newSelected.some(s => s.id === p.id));
          
          if (allMatched) {
            setTimeout(() => {
              setMessage(null);
              solvePuzzle(true);
            }, 800);
          } else {
            setTimeout(() => setMessage(null), 600);
          }
        } else {
          setSymbolPairs(prev =>
            prev.map(p =>
              newSelected.some(s => s.id === p.id)
                ? { ...p, selected: false }
                : p
            )
          );
          setMessage('配对失败，再试一次！');
          setTimeout(() => {
            setMessage(null);
            solvePuzzle(false);
          }, 800);
        }
      }, 500);
    }
  };

  const handleSequenceClick = (id: number) => {
    if (puzzle.type !== 'sequence-click' || showingSequence) return;
    
    const item = sequenceItems.find(i => i.id === id);
    if (!item || item.clicked) return;
    
    const expectedOrder = currentSequence.length + 1;
    
    if (item.order === expectedOrder) {
      setSequenceItems(prev =>
        prev.map(i =>
          i.id === id ? { ...i, clicked: true, highlight: true } : i
        )
      );
      setCurrentSequence(prev => [...prev, id]);
      setMessage('正确！');
      
      if (expectedOrder === sequenceItems.length) {
        setTimeout(() => {
          setMessage(null);
          solvePuzzle(true);
        }, 800);
      } else {
        setTimeout(() => setMessage(null), 400);
      }
    } else {
      setMessage(`错误！请按顺序点击`);
      solvePuzzle(false);
      setTimeout(() => {
        setMessage(null);
        initSequenceClick();
      }, 1000);
    }
  };

  if (!puzzle.isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-b from-[#4a3b2c] to-[#2c1810] rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-[#b87333] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-[#f5e6b8] flex items-center gap-2">
            <HelpCircle size={24} />
            缠线解谜
          </h2>
          <div className="text-sm text-[#b87333]">
            尝试次数: {puzzle.attempts + 1}
          </div>
        </div>

        <p className="text-[#b87333] mb-6 text-center">
          {puzzle.type === 'symbol-match'
            ? '找出所有匹配的符号对来解除缠线'
            : '按照提示的顺序依次点击符号'}
        </p>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mb-4 font-bold ${
                message.includes('成功') || message.includes('正确')
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {puzzle.type === 'symbol-match' ? (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {symbolPairs.map((pair) => (
              <motion.button
                key={pair.id}
                whileHover={!pair.matched ? { scale: 1.05 } : {}}
                whileTap={!pair.matched ? { scale: 0.95 } : {}}
                onClick={() => handleSymbolClick(pair.id)}
                disabled={pair.matched}
                className={`
                  aspect-square rounded-lg text-3xl flex items-center justify-center
                  transition-all duration-300 border-2
                  ${pair.matched
                    ? 'bg-green-500/30 border-green-400 text-green-300'
                    : pair.selected
                    ? 'bg-[#f5e6b8]/30 border-[#f5e6b8] text-[#f5e6b8] glow-gold'
                    : 'bg-[#2c1810] border-[#b87333] text-[#b87333] hover:border-[#f5e6b8]'
                  }
                `}
              >
                {pair.matched || pair.selected ? pair.symbol : '?'}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {sequenceItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={!item.clicked && !showingSequence ? { scale: 1.05 } : {}}
                whileTap={!item.clicked && !showingSequence ? { scale: 0.95 } : {}}
                onClick={() => handleSequenceClick(item.id)}
                disabled={item.clicked || showingSequence}
                className={`
                  aspect-square rounded-lg text-3xl flex items-center justify-center
                  transition-all duration-300 border-2 relative
                  ${item.clicked
                    ? 'bg-green-500/30 border-green-400 text-green-300'
                    : item.highlight
                    ? 'bg-[#f5e6b8]/50 border-[#f5e6b8] text-[#f5e6b8] glow-gold scale-110'
                    : 'bg-[#2c1810] border-[#b87333] text-[#b87333] hover:border-[#f5e6b8]'
                  }
                `}
                animate={item.highlight ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {item.symbol}
                {item.clicked && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
                    <Check size={12} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-[#b87333] hover:text-[#f5e6b8] text-sm flex items-center gap-1"
          >
            <HelpCircle size={14} />
            {showHint ? '隐藏提示' : '显示提示'}
          </button>
          
          <button
            onClick={() => solvePuzzle(false)}
            className="px-4 py-2 bg-[#b87333] hover:bg-[#f5e6b8] text-white rounded-lg text-sm transition-colors"
          >
            跳过本关
          </button>
        </div>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-[#2c1810] rounded-lg text-xs text-[#b87333]"
            >
              {puzzle.type === 'symbol-match'
                ? '💡 提示：点击两个符号进行匹配，相同的符号会保持显示，不同的会重新隐藏。'
                : '💡 提示：仔细观察符号闪烁的顺序，然后按相同顺序点击。'}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
