import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BattleLogEntry, LogType } from '../types';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const logColors: Record<LogType, string> = {
  playerAttack: '#81C784',
  enemyAttack: '#E57373',
  turnEnd: '#FFF176',
  battleEnd: '#CE93D8',
};

export const BattleLog = ({ logs }: BattleLogProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-bold mb-3 text-[#4FC3F7] flex items-center gap-2">
        <span>📜</span>
        <span>战斗日志</span>
      </h3>
      
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2"
        style={{ maxHeight: '300px' }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="text-sm p-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderLeft: `3px solid ${logColors[log.type]}`,
              }}
            >
              <span className="text-xs opacity-50 mr-2">
                [回合{log.turn}]
              </span>
              <span style={{ color: logColors[log.type] }}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattleLog;
