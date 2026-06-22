import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from './store';
import { GameRecord } from './types';
import { playClickSound } from './sound';

interface GameLibraryProps {
  isMobile?: boolean;
}

const GameLibrary: React.FC<GameLibraryProps> = ({ isMobile = false }) => {
  const { records, loadRecord, loadRecords } = useGameStore();

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleLoadRecord = (record: GameRecord) => {
    playClickSound();
    loadRecord(record);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (start: number, end: number): string => {
    const secs = Math.floor((end - start) / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}分${s}秒`;
  };

  if (isMobile) {
    if (records.length === 0) return null;
    return (
      <div className="w-full mt-4">
        <h3 className="font-bold mb-2" style={{ color: '#1a0a00' }}>📚 棋谱库</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {records.map((record) => (
            <button
              key={record.id}
              onClick={() => handleLoadRecord(record)}
              className="w-full p-2 rounded text-left text-sm transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #faf0e6 0%, #f5e6d3 100%)',
                border: '1px solid #8b7d6b'
              }}
            >
              <div className="flex justify-between">
                <span className="font-bold">
                  {record.type === 'manual' ? `📖 ${record.manualName}` : '⚫ 对弈'}
                </span>
                <span style={{ color: '#8b7d6b' }}>
                  {formatDate(record.startTime)}
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#5c3a1e' }}>
                {record.type === 'manual'
                  ? `正确率 ${record.accuracy?.toFixed(1)}%`
                  : `${record.winner === 'black' ? '黑胜' : record.winner === 'white' ? '白胜' : '和棋'} · ${record.moves.length}手`}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-lg min-w-[200px] max-h-[500px] overflow-y-auto"
      style={{
        background: `
          linear-gradient(180deg, #faf0e6 0%, #f5e6d3 100%)
        `,
        border: '3px solid #8b7d6b',
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <h2 className="text-lg font-bold text-center mb-4 pb-2 border-b-2"
        style={{ color: '#1a0a00', borderColor: '#8b7d6b' }}>
        📚 棋谱库
      </h2>

      {records.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: '#8b7d6b' }}>
          暂无记录<br />
          <span className="text-xs">完成一局后将自动保存</span>
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record, idx) => (
            <motion.div
              key={record.id}
              whileHover={{ scale: 1.02, x: -3 }}
              onClick={() => handleLoadRecord(record)}
              className="p-3 rounded cursor-pointer transition-all"
              style={{
                background: idx === 0
                  ? 'linear-gradient(135deg, #fff8e7 0%, #fff0d4 100%)'
                  : 'linear-gradient(135deg, #faf0e6 0%, #f5e6d3 100%)',
                border: '2px solid #8b7d6b',
                boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#1a0a00' }}>
                  {record.type === 'manual' ? '📖' : '⚫'}
                  {' '}
                  {record.type === 'manual' ? record.manualName : '自由对弈'}
                </span>
                <span className="text-xs" style={{ color: '#8b7d6b' }}>
                  {formatDate(record.startTime)}
                </span>
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between" style={{ color: '#5c3a1e' }}>
                  <span>
                    {record.moves.length} 手
                  </span>
                  <span>
                    {formatDuration(record.startTime, record.endTime)}
                  </span>
                </div>
                
                {record.type === 'manual' && record.accuracy !== undefined && (
                  <div className="flex justify-between">
                    <span style={{ color: '#8b7d6b' }}>正确率</span>
                    <span className="font-bold" style={{ color: '#2b5e3c' }}>
                      {record.accuracy.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {record.type === 'free' && (
                  <div className="flex justify-between">
                    <span style={{ color: '#8b7d6b' }}>结果</span>
                    <span className="font-bold" style={{
                      color: record.winner === 'black' ? '#1a0a00'
                        : record.winner === 'white' ? '#8b7d6b'
                        : '#2b5e3c'
                    }}>
                      {record.winner === 'black' ? '黑方胜'
                        : record.winner === 'white' ? '白方胜'
                        : '和棋'}
                    </span>
                  </div>
                )}
                
                {record.type === 'free' && record.winRate !== undefined && (
                  <div className="flex justify-between">
                    <span style={{ color: '#8b7d6b' }}>黑方胜率</span>
                    <span className="font-bold" style={{ color: '#2b5e3c' }}>
                      {record.winRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t text-xs"
        style={{ borderColor: '#8b7d6b', color: '#8b7d6b' }}>
        <p className="text-center">最多保存 5 条记录</p>
      </div>
    </div>
  );
};

export default GameLibrary;
