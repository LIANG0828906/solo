import { useState } from 'react';
import { X } from 'lucide-react';
import { MUSCLE_GROUPS } from '../../../../shared/types';
import { DAY_LABELS } from './types';
import type { CreatePlanFormData } from './types';

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlanFormData) => void;
  clientId: string;
}

export default function CreatePlanModal({
  open,
  onClose,
  onSubmit,
  clientId,
}: CreatePlanModalProps) {
  const [trainingDays, setTrainingDays] = useState<number[]>([0, 2, 4]);
  const [duration, setDuration] = useState(60);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  if (!open) return null;

  const toggleDay = (dayIndex: number) => {
    setTrainingDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const toggleArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ clientId, trainingDays, duration, focusAreas });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">创建新计划</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              训练日
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    trainingDays.includes(i)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每日时长（分钟）
            </label>
            <input
              type="number"
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              重点部位
            </label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    focusAreas.includes(area)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={trainingDays.length === 0}
            className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            生成训练计划
          </button>
        </form>
      </div>
    </div>
  );
}
