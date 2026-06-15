import React, { useEffect, useRef } from 'react';
import type { CombatAction } from '../types';

interface BattleLogProps {
  logs: CombatAction[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-amber-900/30">
        <h3 className="text-amber-300 font-medieval text-xs tracking-wider">
          📜 战斗日志
        </h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1"
      >
        {logs.length === 0 && (
          <div className="text-amber-200/30 text-xs text-center py-4">
            等待战斗开始...
          </div>
        )}
        {logs.map((action, i) => (
          <div
            key={i}
            className="log-entry text-xs px-2 py-1.5 rounded border border-amber-900/20 bg-stone-900/60"
          >
            <span className="text-amber-200/40 mr-1">R{action.round}</span>
            <span
              className={`font-bold ${
                action.actorType === 'player' ? 'text-blue-300' : 'text-red-300'
              }`}
            >
              {action.actorName}
            </span>
            <span className="text-amber-200/60"> 攻击 </span>
            <span
              className={`font-bold ${
                action.actorType === 'player' ? 'text-red-300' : 'text-blue-300'
              }`}
            >
              {action.targetName}
            </span>
            <span className="text-amber-200/60">：</span>
            {action.hit ? (
              <>
                <span className="text-green-400 font-bold">
                  命中{action.critical ? '（暴击！）' : ''}！
                </span>
                <span className="text-red-400"> 造成 {action.damage} 点伤害</span>
                <span className="text-amber-200/40 ml-1">
                  （剩余 {action.targetRemainingHp} HP）
                </span>
              </>
            ) : (
              <span className="text-amber-400">未命中</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleLog;
