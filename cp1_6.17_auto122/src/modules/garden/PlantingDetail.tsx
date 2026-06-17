import React, { useState, useEffect } from 'react';
import type { Garden, CropType } from '../../../shared/types';
import { useGardenStore } from '../../store/useGardenStore';
import { X } from 'lucide-react';

interface Props {
  garden: Garden | null;
  onClose: () => void;
}

const CROP_OPTIONS: { value: CropType; label: string; emoji: string }[] = [
  { value: 'tomato', label: '番茄', emoji: '🍅' },
  { value: 'lettuce', label: '生菜', emoji: '🥬' },
  { value: 'carrot', label: '胡萝卜', emoji: '🥕' },
  { value: 'strawberry', label: '草莓', emoji: '🍓' },
];

function formatCountdown(target?: number): string {
  if (!target) return '--';
  const diff = target - Date.now();
  if (diff <= 0) return '已成熟';
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}天${hours}小时`;
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}小时${mins}分钟`;
}

export const PlantingDetail: React.FC<Props> = ({ garden, onClose }) => {
  const claimGarden = useGardenStore((s) => s.claimGarden);
  const [ownerName, setOwnerName] = useState('');
  const [cropType, setCropType] = useState<CropType>('tomato');
  const [countdown, setCountdown] = useState<string>(formatCountdown(garden?.expectedHarvestAt));

  useEffect(() => {
    setCountdown(formatCountdown(garden?.expectedHarvestAt));
    if (!garden?.expectedHarvestAt) return;
    const timer = setInterval(() => {
      setCountdown(formatCountdown(garden.expectedHarvestAt));
    }, 60000);
    return () => clearInterval(timer);
  }, [garden?.expectedHarvestAt]);

  if (!garden) return null;

  const handleClaim = async () => {
    if (!ownerName.trim()) return;
    await claimGarden(garden.id, { ownerName: ownerName.trim(), cropType });
    onClose();
  };

  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const cropInfo = garden.cropType ? CROP_OPTIONS.find((c) => c.value === garden.cropType) : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-modal-in"
        style={{ animation: 'fadeIn 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {garden.claimed ? `${cropInfo?.emoji || ''} 种植详情` : '🌱 认领菜畦'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {!garden.claimed ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">您的昵称</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="请输入昵称"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择作物种子</label>
                <div className="grid grid-cols-4 gap-2">
                  {CROP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCropType(opt.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                        cropType === opt.value
                          ? 'border-green-500 bg-green-50 scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl mb-1">{opt.emoji}</span>
                      <span className="text-xs text-gray-600">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={!ownerName.trim()}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{ backgroundColor: '#4CAF50' }}
              >
                确认认领
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{cropInfo?.emoji}</span>
                <div>
                  <div className="text-lg font-semibold text-gray-800">{cropInfo?.label}</div>
                  <div className="text-sm text-gray-500">种植者：{garden.ownerName}</div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">预计成熟倒计时</div>
                <div className="text-2xl font-bold text-amber-700">{countdown}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">种植进度</div>
                  <div className="text-xl font-bold text-gray-800">{garden.progress}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">浇水次数</div>
                  <div className="text-xl font-bold text-gray-800">{garden.waterLogs.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
