import React, { useRef, useEffect } from 'react';
import type { BattleLogEntry } from '../types';
import { Sword, Zap, Skull } from 'lucide-react';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const logIcons = {
  attack: Sword,
  skill: Zap,
  death: Skull,
};

const logColors = {
  attack: 'text-yellow-400',
  skill: 'text-purple-400',
  death: 'text-red-400',
};

export const BattleLog: React.FC<BattleLogProps> = React.memo(({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const recentLogs = logs.slice(-50);

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="p-3 border-b border-white/10">
        <h3 className="font-display font-bold text-sm">战斗日志</h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ maxHeight: '400px' }}
      >
        {recentLogs.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-8">
            等待战斗开始...
          </div>
        ) : (
          recentLogs.map((log, index) => {
            const Icon = logIcons[log.type];
            return (
              <div
                key={`${log.round}-${index}`}
                className="text-xs p-2 rounded-lg bg-white/5 animate-fade-in"
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${logColors[log.type]}`} />
                  <div className="flex-1">
                    <div className="text-white/50 text-[10px] mb-0.5">
                      回合 {log.round}
                    </div>
                    {log.type === 'death' ? (
                      <div>
                        <span className="text-red-400 font-bold">{log.targetName}</span>
                        <span className="text-white/70"> 被击败了！</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-blue-400 font-bold">{log.attackerName}</span>
                        <span className="text-white/70">
                          {' '}
                          {log.type === 'skill' ? '使用' : '攻击'}
                          {' '}
                        </span>
                        {log.skillName && (
                          <span className="text-purple-400 font-bold">{log.skillName} </span>
                        )}
                        <span className="text-white/70">对 </span>
                        <span className="text-red-400 font-bold">{log.targetName}</span>
                        <span className="text-white/70"> 造成 </span>
                        <span className="text-yellow-400 font-bold">{log.damage}</span>
                        <span className="text-white/70"> 点伤害</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

BattleLog.displayName = 'BattleLog';
