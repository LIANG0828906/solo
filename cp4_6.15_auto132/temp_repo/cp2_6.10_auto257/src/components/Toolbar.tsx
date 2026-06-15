import { motion } from 'framer-motion';
import { Flame, Settings, RotateCcw, BookOpen, Award } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';

const tools = [
  { icon: Flame, name: '火炉', description: '煎药生火，温通血脉' },
  { icon: Settings, name: '药碾', description: '碾碎药材，释放药性' },
  { icon: BookOpen, name: '捣药罐', description: '捣烂药材，便于煎制' },
];

export function Toolbar() {
  const { period, day, resetGame, showScore, completedRecipes } = useGameStore();

  const handleShowScore = async () => {
    const report = await api.getScore(period);
    showScore(report);
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="scroll-panel p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -4, scale: 1.05 }}
              className="relative group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-b from-earth to-earth/80 flex items-center justify-center text-paper shadow-lg border-2 border-ink/20 group-hover:from-earth group-hover:to-earth transition-all">
                <tool.icon className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-ink/90 text-paper text-xs px-2 py-1 rounded z-10">
                {tool.name}：{tool.description}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 bg-pine/10 text-pine rounded-lg border border-pine/30"
          >
            <Award className="w-4 h-4" />
            <span className="text-sm font-kai">方剂: {completedRecipes}</span>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowScore}
            className="flex items-center gap-2 px-3 py-2 bg-earth/20 text-earth rounded-lg border border-earth/40 hover:bg-earth/30 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-kai">本草录</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="flex items-center gap-2 px-3 py-2 bg-vermilion/10 text-vermilion rounded-lg border border-vermilion/30 hover:bg-vermilion/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-kai">重新开始</span>
          </motion.button>

          <div className="px-3 py-1 bg-ink/10 rounded border border-ink/20">
            <span className="font-kai text-ink/70 text-sm">第 {period} 旬 · 第 {day} 日</span>
