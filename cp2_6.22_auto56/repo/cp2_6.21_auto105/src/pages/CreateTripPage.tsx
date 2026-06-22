import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Image, Check, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { coverImages } from '@/data/mocks';
import { useToastStore } from '@/stores/toastStore';

export default function CreateTripPage() {
  const [tripName, setTripName] = useState('');
  const [selectedCover, setSelectedCover] = useState(coverImages[0].id);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const maxNameLength = 30;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!tripName.trim()) {
      newErrors.tripName = '请输入旅行名称';
    } else if (tripName.length > maxNameLength) {
      newErrors.tripName = `旅行名称不能超过${maxNameLength}字`;
    }
    if (!startDate) {
      newErrors.startDate = '请选择开始日期';
    }
    if (!endDate) {
      newErrors.endDate = '请选择结束日期';
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = '结束日期不能早于开始日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;

    const tripId = Math.random().toString(36).substr(2, 9);
    addToast({
      message: '路线创建成功！开始规划你的旅程吧',
      type: 'success',
    });
    navigate(`/trip/${tripId}/edit`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a73e8] to-[#34a853] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">创建新路线</h1>
                <p className="text-white/80 text-sm mt-1">规划你的下一次精彩旅行</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旅行名称
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="给你的旅行起个名字，比如：云南大理七日游"
                  maxLength={maxNameLength}
                  className={`input-field pr-16 py-3 text-base ${errors.tripName ? 'border-red-400' : ''}`}
                />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${
                  tripName.length >= maxNameLength ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {tripName.length}/{maxNameLength}
                </span>
              </div>
              {errors.tripName && (
                <p className="text-red-500 text-sm mt-1">{errors.tripName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Image size={18} />
                选择封面图
                <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {coverImages.map((cover) => (
                  <div
                    key={cover.id}
                    onClick={() => setSelectedCover(cover.id)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                      selectedCover === cover.id
                        ? 'border-[#1a73e8] ring-4 ring-[#1a73e8]/20'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={cover.url}
                      alt={cover.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                      <p className="absolute bottom-2 left-2 text-white text-sm font-medium">
                        {cover.name}
                      </p>
                    </div>
                    {selectedCover === cover.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#1a73e8] rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} />
                  开始日期
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`input-field py-3 ${errors.startDate ? 'border-red-400' : ''}`}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={18} />
                  结束日期
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`input-field py-3 ${errors.endDate ? 'border-red-400' : ''}`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 btn-secondary py-3"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 btn-primary py-3"
                >
                  创建路线
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
