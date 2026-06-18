import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, User, Disc, Activity } from 'lucide-react';
import type { Piece } from '../types';
import { ProgressBar } from './ProgressBar';
import { computePieceProgress } from './engine';
import { PART_COLORS } from '../data/seed';
import { useStore } from '../store';
import { Button } from '../components/Button';

interface Props {
  piece: Piece;
  onEdit?: () => void;
}

export const PieceCard = ({ piece, onEdit }: Props) => {
  const [flipped, setFlipped] = useState(false);
  const updateProgress = useStore((s) => s.updateProgress);
  const totalProgress = computePieceProgress(piece);

  const addPractice = (part: string, min: number) => {
    updateProgress(piece.id, part, min);
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 18px 40px rgba(0,0,0,0.4)' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative cursor-pointer"
      style={{ perspective: 1000 }}
      onClick={() => setFlipped((v) => !v)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          transformStyle: 'preserve-3d',
          minHeight: 280,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            backgroundColor: 'rgba(38,50,56,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,213,79,0.12)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(255,213,79,0.12)' }}
            >
              <Music size={18} style={{ color: '#FFD54F' }} />
            </div>
            <div className="text-right">
              <div
                className="text-[10px] uppercase tracking-wider text-white/40 mb-1"
              >
                完成度
              </div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{
                  color: totalProgress === 100 ? '#4CAF50' : '#FFD54F',
                  fontFamily: "'Noto Serif SC', serif",
                }}
              >
                {totalProgress}%
              </div>
            </div>
          </div>

          <h3
            className="mt-4 text-white font-semibold text-lg leading-tight"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {piece.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-white/55">
            <User size={12} />
            <span>{piece.composer}</span>
          </div>

          <div className="flex-1" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[10px] text-white/40 uppercase flex items-center gap-1 mb-0.5">
                <Disc size={10} /> 调号
              </div>
              <div className="text-white text-sm font-medium">{piece.key}</div>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[10px] text-white/40 uppercase flex items-center gap-1 mb-0.5">
                <Activity size={10} /> 速度
              </div>
              <div className="text-white text-sm font-medium tabular-nums">
                {piece.bpm} <span className="text-white/40 text-xs">BPM</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {piece.requiredParts.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: `${PART_COLORS[p]}20`,
                  color: PART_COLORS[p],
                  border: `1px solid ${PART_COLORS[p]}40`,
                }}
              >
                {p}
              </span>
            ))}
          </div>

          <div className="text-[10px] text-white/30 text-center mt-3">
            点击卡片翻转查看进度详情
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: 'rgba(38,50,56,0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(61,90,254,0.2)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h4
              className="text-white font-semibold"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              声部练习进度
            </h4>
            <button
              onClick={() => setFlipped(false)}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              返回
            </button>
          </div>

          <div className="text-[11px] text-white/40 mt-1 mb-3">
            {piece.name} · {piece.composer}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {piece.requiredParts.map((part) => {
              const record = piece.practiceProgress[part];
              if (!record) return null;
              const percent = Math.round((record.practicedMinutes / record.targetMinutes) * 100);
              const completed = percent >= 100;
              return (
                <div key={part} className="space-y-1.5">
                  <ProgressBar percent={percent} completed={completed} label={part} />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/35 tabular-nums">
                      {record.practicedMinutes}/{record.targetMinutes} 分钟
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => addPractice(part, -15)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                      >
                        -15
                      </button>
                      <button
                        onClick={() => addPractice(part, 15)}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#FFD54F]/10 text-[#FFD54F] hover:bg-[#FFD54F]/20 transition-colors"
                      >
                        +15
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onEdit && (
            <div className="pt-3 mt-2 border-t border-white/5">
              <Button variant="secondary" size="sm" onClick={onEdit} className="w-full">
                编辑曲目信息
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
