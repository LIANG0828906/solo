import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSkillsStore } from '@/store/skillsStore';
import type { Skill } from '@/data/mockSkills';

const TIME_OPTIONS = ['工作日白天', '工作日晚上', '周末上午', '周末下午', '随时都可以'];

interface ExchangeRequestProps {
  skill: Skill | null;
  onClose: () => void;
}

export default function ExchangeRequest({ skill, onClose }: ExchangeRequestProps) {
  const [reason, setReason] = useState('');
  const [expectedTime, setExpectedTime] = useState(TIME_OPTIONS[0]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const addExchangeRequest = useSkillsStore((s) => s.addExchangeRequest);

  useEffect(() => {
    if (toastVisible && !toastFading) {
      const timer = setTimeout(() => {
        setToastFading(true);
        setTimeout(() => {
          setToastVisible(false);
          setToastFading(false);
          onClose();
        }, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible, toastFading, onClose]);

  if (!skill) return null;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    addExchangeRequest(skill.id, reason.trim(), expectedTime);
    setToastVisible(true);
  };

  return (
    <>
      {toastVisible && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-lg text-white font-medium shadow-lg ${
            toastFading ? 'animate-toast-out' : 'animate-toast-in'
          }`}
          style={{ backgroundColor: '#22C55E' }}
        >
          交换请求已发送！
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40"
        onClick={onClose}
      >
        <div
          className="animate-modal-in bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            申请技能交换
          </h2>
          <p className="text-sm text-gray-500 mb-5">{skill.title}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                申请理由
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  if (e.target.value.length <= 100) setReason(e.target.value);
                }}
                maxLength={100}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#246A73]/40 focus:border-[#246A73] resize-none"
                placeholder="为什么想学习这个技能？"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {reason.length}/100
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                期望学习时间
              </label>
              <select
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#246A73]/40 focus:border-[#246A73] bg-white"
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!reason.trim()}
              className="animate-scale-in w-full py-2.5 rounded-lg text-white text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#246A73' }}
            >
              提交申请
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
