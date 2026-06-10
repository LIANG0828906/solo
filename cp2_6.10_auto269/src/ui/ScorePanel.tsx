import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SCALE_NAMES, PARTICLE_COLORS } from '@/utils/constants';
import { PlayedNote } from '@/types';
import { Music2, Clock, Volume2 } from 'lucide-react';

const getDurationLabel = (duration: number): string => {
  if (duration >= 2) return '全音符';
  if (duration >= 1) return '二分音符';
  if (duration >= 0.5) return '四分音符';
  if (duration >= 0.25) return '八分音符';
  return '十六分音符';
};

const getDurationSymbol = (duration: number): string => {
  if (duration >= 2) return '𝅝';
  if (duration >= 1) return '𝅗𝅥';
  if (duration >= 0.5) return '♩';
  if (duration >= 0.25) return '♪';
  return '𝅘𝅥𝅯';
};

const NoteItem: React.FC<{ note: PlayedNote; index: number; isLatest: boolean }> = ({
  note,
  index,
  isLatest,
}) => {
  const color = PARTICLE_COLORS[note.note];
  const age = Date.now() - note.timestamp;
  const opacity = Math.max(0.4, 1 - age / 10000);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                  ${isLatest ? 'bg-white/30 scale-105 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
      style={{ opacity }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        {SCALE_NAMES[note.note]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ color }}>
            {getDurationSymbol(note.duration)}
          </span>
          <span className="text-sm font-medium text-white/90">
            {SCALE_NAMES[note.note]}
            <span className="text-white/50 ml-1">{note.octave}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Volume2 className="w-3 h-3" />
            <span>{note.velocity}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Clock className="w-3 h-3" />
            <span>{getDurationLabel(note.duration)}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xs text-white/50">#{index + 1}</div>
        <div className="text-[10px] text-white/40 mt-1">
          {new Date(note.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

export const ScorePanel: React.FC = () => {
  const { playedNotes } = useGameStore();
  const reversedNotes = [...playedNotes].reverse();

  return (
    <div className="fixed bottom-6 right-6 z-10">
      <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/30 w-[340px] max-h-[500px] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow">乐谱记录</h2>
            <p className="text-xs text-white/70">最近 {playedNotes.length} 个音符</p>
          </div>
          {playedNotes.length > 0 && (
            <div className="ml-auto">
              <div className="text-3xl font-bold text-white/30">
                {playedNotes.length}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1
                       [&::-webkit-scrollbar]:w-1.5
                       [&::-webkit-scrollbar-track]:bg-transparent
                       [&::-webkit-scrollbar-thumb]:bg-white/30
                       [&::-webkit-scrollbar-thumb]:rounded-full">
          {reversedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Music2 className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-white/60 text-sm">还没有演奏记录</p>
              <p className="text-white/40 text-xs mt-2">
                拖拽编钟到音阶台上开始创作吧！
              </p>
            </div>
          ) : (
            reversedNotes.map((note, index) => (
              <NoteItem
                key={note.id}
                note={note}
                index={reversedNotes.length - 1 - index}
                isLatest={index === 0}
              />
            ))
          )}
        </div>

        {reversedNotes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>音阶台: Do Re Mi Fa Sol La Si</span>
              <span className="text-white/40">自动保存最近10个</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
