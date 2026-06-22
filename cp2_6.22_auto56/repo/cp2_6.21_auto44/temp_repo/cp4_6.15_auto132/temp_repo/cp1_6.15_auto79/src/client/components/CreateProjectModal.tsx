import { useState, useEffect } from 'react';
import { X, Check, Music, Tempo, Guitar } from 'lucide-react';
import { KEYS, INSTRUMENTS } from '@/types';

/**
 * 创建项目弹窗组件
 * - 毛玻璃遮罩+从下向上滑入
 * - 表单：项目名称、调性、BPM滑块、乐器多选
 */
interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    key: string;
    bpm: number;
    instruments: string[];
  }) => void;
}

export function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState(KEYS[0]);
  const [bpm, setBpm] = useState(120);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName('');
      setKey(KEYS[0]);
      setBpm(120);
      setSelectedInstruments([]);
    }
  }, [open]);

  const toggleInstrument = (instrumentId: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrumentId)
        ? prev.filter((id) => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const isValid = name.trim().length > 0 && selectedInstruments.length >= 2;

  const handleSubmit = () => {
    if (!isValid) return;
    onCreate({
      name: name.trim(),
      key,
      bpm,
      instruments: selectedInstruments,
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={handleBackdropClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-slide-up w-full md:max-w-lg md:mx-4 bg-[#16213e] rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#e94560' }}
            >
              <Music size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">创建新项目</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* 项目名称 */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              项目名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入项目名称..."
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560]/30 transition-all"
            />
          </div>

          {/* 调性选择 */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              调性
            </label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560]/30 transition-all cursor-pointer"
            >
              {KEYS.map((k) => (
                <option key={k} value={k} className="bg-[#16213e]">
                  {k} 调
                </option>
              ))}
            </select>
          </div>

          {/* BPM滑块 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Tempo size={16} />
                速度 (BPM)
              </label>
              <span
                className="text-lg font-bold px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#e94560', color: 'white' }}
              >
                {bpm}
              </span>
            </div>
            <div className="px-2">
              <input
                type="range"
                min={40}
                max={200}
                step={1}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-[#e94560]"
              />
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>40</span>
                <span>200</span>
              </div>
            </div>
          </div>

          {/* 乐器多选 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Guitar size={16} />
                选择乐器
              </label>
              <span
                className={`text-xs ${selectedInstruments.length >= 2 ? 'text-green-400' : 'text-white/40'}`}
              >
                {selectedInstruments.length >= 2
                  ? `已选 ${selectedInstruments.length} 种`
                  : `至少选择 2 种 (${selectedInstruments.length}/2)`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {INSTRUMENTS.map((instrument) => {
                const isSelected = selectedInstruments.includes(instrument.id);
                return (
                  <button
                    key={instrument.id}
                    type="button"
                    onClick={() => toggleInstrument(instrument.id)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#e94560]/20 border-[#e94560] text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    } border`}
                  >
                    <span className="text-2xl mb-1">{instrument.icon}</span>
                    <span className="text-xs font-medium">{instrument.name}</span>
                    {isSelected && (
                      <span className="check-pop absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-[#e94560] text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-6 py-5 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: isValid ? '#e94560' : 'undefined' }}
          >
            创建项目
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateProjectModal;
