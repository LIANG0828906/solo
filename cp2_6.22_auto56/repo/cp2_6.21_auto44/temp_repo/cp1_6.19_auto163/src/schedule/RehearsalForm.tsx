import { useState, useMemo } from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { useStore } from '../store';
import type { Rehearsal } from '../types';
import { dateToString } from './utils';
import { detectConflicts } from './utils';

interface Props {
  initialDate?: string;
  initial?: Rehearsal;
  onSubmit: () => void;
}

const DURATIONS = [60, 90, 120, 150, 180, 240];

export const RehearsalForm = ({ initialDate, initial, onSubmit }: Props) => {
  const addRehearsal = useStore((s) => s.addRehearsal);
  const updateRehearsal = useStore((s) => s.updateRehearsal);
  const allRehearsals = useStore((s) => s.rehearsals);
  const members = useStore((s) => s.members);
  const pieces = useStore((s) => s.pieces);

  const [title, setTitle] = useState(initial?.title ?? '新排练');
  const [date, setDate] = useState(initial?.date ?? initialDate ?? dateToString(new Date()));
  const [startTime, setStartTime] = useState(initial?.startTime ?? '19:00');
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 120);
  const [participantIds, setParticipantIds] = useState<string[]>(initial?.participantIds ?? []);
  const [pieceIds, setPieceIds] = useState<string[]>(initial?.pieceIds ?? []);

  const previewConflicts = useMemo(() => {
    const draft: Rehearsal = {
      id: initial?.id ?? '__draft__',
      title,
      date,
      startTime,
      durationMinutes: duration,
      participantIds,
      pieceIds,
      conflicts: [],
    };
    const others = initial ? allRehearsals.filter((r) => r.id !== initial.id) : allRehearsals;
    return detectConflicts(draft, [...others, draft]);
  }, [title, date, startTime, duration, participantIds, pieceIds, initial, allRehearsals]);

  const hasConflict = previewConflicts.length > 0;

  const toggleMember = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePiece = (id: string) => {
    setPieceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    if (hasConflict) return;
    if (initial) {
      updateRehearsal(initial.id, {
        title,
        date,
        startTime,
        durationMinutes: duration,
        participantIds,
        pieceIds,
      });
    } else {
      addRehearsal({
        title,
        date,
        startTime,
        durationMinutes: duration,
        participantIds,
        pieceIds,
      });
    }
    onSubmit();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/60 mb-1.5">排练标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all"
            placeholder="如：周末综合排练"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5">开始时间</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5">时长</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDuration((d) => Math.max(30, d - 30))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="减少时长"
            >
              <Minus size={14} />
            </button>
            <div className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-center text-white text-sm">
              {Math.floor(duration / 60)}时{duration % 60 ? `${duration % 60}分` : ''}
            </div>
            <button
              type="button"
              onClick={() => setDuration((d) => Math.min(360, d + 30))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="增加时长"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  duration === d
                    ? 'bg-[#FFD54F] text-[#1A237E] font-medium'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {Math.floor(d / 60)}h{d % 60 ? `${d % 60}m` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/60 mb-1.5">
          参与人员 ({participantIds.length})
        </label>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-black/20 border border-white/5">
          {members.map((m) => {
            const selected = participantIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  selected
                    ? 'text-white'
                    : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
                style={
                  selected
                    ? {
                        backgroundColor: '#3D5AFE',
                        boxShadow: '0 0 0 1px rgba(61,90,254,0.4)',
                      }
                    : undefined
                }
              >
                {m.name} · {m.primaryPart.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/60 mb-1.5">
          排练曲目 ({pieceIds.length})
        </label>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-lg bg-black/20 border border-white/5">
          {pieces.map((p) => {
            const selected = pieceIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePiece(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  selected
                    ? 'bg-[#FFD54F] text-[#1A237E] font-medium'
                    : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {hasConflict && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.3)' }}
        >
          <AlertCircle size={16} style={{ color: '#E53935', flexShrink: 0, marginTop: 1 }} />
          <div className="text-xs" style={{ color: '#FF8A80' }}>
            <div className="font-medium mb-1">检测到以下人员存在时间冲突：</div>
            <div className="opacity-90">
              {Array.from(new Set(previewConflicts.map((c) => c.memberId)))
                .map((id) => members.find((m) => m.id === id)?.name)
                .filter(Boolean)
                .join('、')}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onSubmit}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={hasConflict || !title.trim()}>
          {initial ? '保存修改' : '创建排练'}
        </Button>
      </div>
    </div>
  );
};
