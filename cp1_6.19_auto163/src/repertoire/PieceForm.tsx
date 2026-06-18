import { useState } from 'react';
import { Button } from '../components/Button';
import { useStore } from '../store';
import type { Piece, VoicePart } from '../types';

interface Props {
  initial?: Piece;
  onSubmit: () => void;
}

const VOICE_PARTS: VoicePart[] = ['Soprano', 'Alto', 'Tenor', 'Bass'];
const KEYS = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'F Major', 'Bb Major',
  'a minor', 'e minor', 'd minor', 'g minor', 'c minor', 'f minor',
];

export const PieceForm = ({ initial, onSubmit }: Props) => {
  const addPiece = useStore((s) => s.addPiece);
  const updatePiece = useStore((s) => s.updatePiece);

  const [name, setName] = useState(initial?.name ?? '');
  const [composer, setComposer] = useState(initial?.composer ?? '');
  const [key, setKey] = useState(initial?.key ?? 'C Major');
  const [bpm, setBpm] = useState<number>(initial?.bpm ?? 80);
  const [requiredParts, setRequiredParts] = useState<VoicePart[]>(
    initial?.requiredParts ?? ['Soprano', 'Alto', 'Tenor', 'Bass'],
  );
  const [targetMin, setTargetMin] = useState<number>(240);

  const togglePart = (p: VoicePart) => {
    setRequiredParts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || requiredParts.length === 0) return;
    if (initial) {
      updatePiece(initial.id, {
        name,
        composer,
        key,
        bpm,
        requiredParts,
      });
    } else {
      addPiece({
        name,
        composer,
        key,
        bpm,
        requiredParts,
        targetMinutesPerPart: targetMin,
      });
    }
    onSubmit();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-white/60 mb-1.5">曲目名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all"
            placeholder="如：圣母颂"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-white/60 mb-1.5">作曲家</label>
          <input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all"
            placeholder="如：巴赫/古诺"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5">调号</label>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 text-white text-sm border border-white/10 focus:border-[#FFD54F] focus:outline-none focus:ring-1 focus:ring-[#FFD54F]/50 transition-all appearance-none cursor-pointer"
          >
            {KEYS.map((k) => (
              <option key={k} value={k} className="bg-[#263238]">
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            BPM (每分钟节拍数): <span className="text-[#FFD54F] font-medium">{bpm}</span>
          </label>
          <input
            type="range"
            min={40}
            max={200}
            step={4}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-[#FFD54F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/60 mb-1.5">
          需要的声部 ({requiredParts.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {VOICE_PARTS.map((p) => {
            const selected = requiredParts.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePart(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selected
                    ? 'text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                }`}
                style={
                  selected
                    ? {
                        background: 'linear-gradient(135deg,#3D5AFE,#536DFE)',
                        boxShadow: '0 0 0 1px rgba(61,90,254,0.45), 0 4px 12px rgba(61,90,254,0.25)',
                      }
                    : undefined
                }
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {!initial && (
        <div>
          <label className="block text-xs text-white/60 mb-1.5">
            每声部目标练习时长 (分钟): <span className="text-[#FFD54F] font-medium">{targetMin}</span>
          </label>
          <input
            type="range"
            min={60}
            max={480}
            step={30}
            value={targetMin}
            onChange={(e) => setTargetMin(Number(e.target.value))}
            className="w-full accent-[#FFD54F]"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onSubmit}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || requiredParts.length === 0}>
          {initial ? '保存修改' : '添加曲目'}
        </Button>
      </div>
    </div>
  );
};
