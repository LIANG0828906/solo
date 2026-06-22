import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import SkillTree from '@/components/SkillTree';
import BattleSimulator from '@/components/BattleSimulator';
import CharacterCreator from '@/components/CharacterCreator';
import BattleReport from '@/components/BattleReport';

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; r: number; a: number; speed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        speed: Math.random() * 0.008 + 0.002,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.a += s.speed;
        const alpha = 0.2 + Math.abs(Math.sin(s.a)) * 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

const phaseConfig = {
  creation: { title: '创建角色', subtitle: '选择你的职业，开启进化之旅' },
  'skill-tree': { title: '技能树', subtitle: '配置你的技能搭配策略' },
  battle: { title: '战斗模拟', subtitle: '测试你的技能搭配效果' },
  report: { title: '战斗报告', subtitle: '查看详细战斗数据分析' },
};

export default function App() {
  const phase = useGameStore((s) => s.phase);

  const config = phaseConfig[phase];

  return (
    <div className="relative min-h-screen flex flex-col font-body">
      <Starfield />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl text-gold tracking-wider">技能进化论</h1>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-sm text-gray-400">{config.title}</span>
        </div>
        <span className="text-xs text-gray-500 font-display">{config.subtitle}</span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {phase === 'creation' && (
            <motion.div
              key="creation"
              className="flex-1 flex items-center justify-center p-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <CharacterCreator />
            </motion.div>
          )}
          {phase === 'skill-tree' && (
            <motion.div
              key="skill-tree"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <SkillTree />
            </motion.div>
          )}
          {phase === 'battle' && (
            <motion.div
              key="battle"
              className="flex-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <BattleSimulator />
            </motion.div>
          )}
          {phase === 'report' && (
            <motion.div
              key="report"
              className="flex-1 flex items-center justify-center p-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              <BattleReport />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
