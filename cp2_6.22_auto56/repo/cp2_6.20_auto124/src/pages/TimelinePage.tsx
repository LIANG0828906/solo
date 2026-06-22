import { useState, useEffect, type KeyboardEvent } from 'react';
import { useAppStore } from '@/store/useStore';
import { TRAINING_TYPES, getTrainingTypeInfo, type TrainingType, type CreateRecordDto } from '@/types';
import dayjs from 'dayjs';

export default function TimelinePage() {
  const { records, fetchRecords, addRecord, loading } = useAppStore();

  const [formData, setFormData] = useState<CreateRecordDto>({
    type: 'strength',
    duration: 30,
    date: dayjs().format('YYYY-MM-DD'),
    note: '',
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchRecords();
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleSubmit = async () => {
    if (!formData.type || !formData.duration || !formData.date) return;
    await addRecord(formData);
    setFormData({
      type: 'strength',
      duration: 30,
      date: dayjs().format('YYYY-MM-DD'),
      note: '',
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      className={`min-h-screen bg-[#1a1d24] text-white p-6 md:p-8 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">训练时间线</h1>

        <div
          className="rounded-[12px] bg-[#2a2d35] p-5 mb-8"
          style={{ animationDelay: '0s' }}
        >
          <h2 className="text-lg font-semibold mb-4">添加新记录</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">训练类型</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as TrainingType })
                  }
                  className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {TRAINING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">时长（分钟）</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number(e.target.value) })
                  }
                  className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                感想 <span className="text-gray-500">（Ctrl+Enter 提交）</span>
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="记录今天的训练感受..."
                className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? '提交中...' : '添加记录'}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

          <div className="space-y-6">
            {sortedRecords.map((record, index) => {
              const typeInfo = getTrainingTypeInfo(record.type);
              return (
                <div
                  key={record.id}
                  className="relative pl-10 md:pl-12 opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: `${0.3 + index * 0.1}s`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <div
                    className="absolute left-0 md:left-1 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-[#1a1d24] z-10"
                    style={{ backgroundColor: typeInfo.color, top: '1rem' }}
                  />

                  <div
                    className="rounded-[12px] bg-[#2a2d35] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 cursor-default w-full md:w-auto"
                  >
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                      <span
                        className="text-xs md:text-sm font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${typeInfo.color}20`,
                          color: typeInfo.color,
                        }}
                      >
                        {typeInfo.label}
                      </span>
                      <span className="text-gray-400 text-sm md:text-base">
                        {record.duration} 分钟
                      </span>
                      <span className="text-gray-500 text-xs md:text-sm ml-auto">
                        {dayjs(record.date).format('YYYY年MM月DD日')}
                      </span>
                    </div>

                    {record.note && (
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        {record.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedRecords.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">还没有训练记录</p>
              <p className="text-sm mt-2">添加你的第一条训练记录吧！</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
