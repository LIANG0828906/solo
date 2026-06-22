import { useState } from 'react';
import { usePetStore } from '@/store/petStore';
import StarRating from './StarRating';

interface ReviewFormProps {
  appointmentId: string;
  onClose: () => void;
}

export default function ReviewForm({ appointmentId, onClose }: ReviewFormProps) {
  const { addReview, appointments, pets, services } = usePetStore();
  const [rating, setRating] = useState(3);
  const [content, setContent] = useState('');

  const apt = appointments.find((a) => a.id === appointmentId);
  const pet = apt ? pets.find((p) => p.id === apt.petId) : null;
  const service = apt ? services.find((s) => s.id === apt.serviceId) : null;

  const isContentValid = content.length >= 10 && content.length <= 200;
  const canSubmit = isContentValid && rating > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addReview({ appointmentId, rating, content });
    onClose();
  };

  return (
    <div className="panel-overlay fixed inset-0 z-50 flex items-center justify-center bg-[#00000040]" onClick={onClose}>
      <div
        className="panel-content mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        style={{ animation: 'fadeIn 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#3e3228]">服务评价</h3>
          <button
            className="ripple-btn rounded-full p-2 text-[#a09488] transition-colors hover:bg-[#fef9f2] hover:text-[#3e3228]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-[#fef9f2] p-3">
          <div className="text-sm font-semibold text-[#3e3228]">
            {pet?.avatar} {pet?.name} · {service?.name}
          </div>
          <div className="text-xs text-[#a09488]">
            {apt?.date} {apt?.timeSlot}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-[#3e3228]">评分</label>
          <StarRating value={rating} onChange={setRating} size={32} />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-[#3e3228]">
            评价内容 (10-200字)
          </label>
          <textarea
            className="w-full rounded-lg border border-[#e0d6c8] bg-white p-3 text-sm outline-none focus:border-[#4caf50] focus:ring-1 focus:ring-[#4caf50]"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 200))}
            placeholder="请分享您的服务体验..."
            maxLength={200}
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className={content.length < 10 && content.length > 0 ? 'text-red-400' : 'text-[#a09488]'}>
              {content.length < 10 && content.length > 0 ? `还需${10 - content.length}字` : ''}
            </span>
            <span className="text-[#a09488]">{content.length}/200</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="ripple-btn flex-1 rounded-xl border border-[#e0d6c8] py-2.5 text-sm font-semibold text-[#7a6e62] transition-colors hover:bg-[#fef9f2]"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="ripple-btn flex-1 rounded-xl bg-[#4caf50] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#388e3c] hover:shadow-lg disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            提交评价
          </button>
        </div>
      </div>
    </div>
  );
}
