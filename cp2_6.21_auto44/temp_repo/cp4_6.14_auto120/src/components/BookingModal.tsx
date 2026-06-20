import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, type Course } from '@/store/useStore';

const COLOR_AVAILABLE = '#10b981';
const COLOR_FULL = '#ef4444';

export default function BookingModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const createBooking = useStore(s => s.createBooking);
  const fetchMembers = useStore(s => s.fetchMembers);
  const members = useStore(s => s.members);
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const remaining = course.remainingCapacity ?? (course.capacity - course.bookings.length);
  const isFull = remaining <= 0;

  const matchedMember = members.find(m => m.id === memberId);
  const isExpired = matchedMember?.status === '已过期';

  const handleBook = async () => {
    if (!memberName.trim()) {
      setError('请输入姓名');
      return;
    }
    if (!memberId.trim()) {
      setError('请输入会员号');
      return;
    }
    if (isFull) {
      setError('课程已满，无法预约');
      return;
    }

    const result = await createBooking(course.id, memberName.trim(), memberId.trim());
    if (result.success) {
      setSuccess(true);
      fetchMembers();
      setTimeout(() => onClose(), 800);
    } else {
      setError(result.error || '预约失败，请稍后重试');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white p-6"
        style={{
          width: '400px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">课程预约</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">课程名称</span>
            <span className="font-medium text-gray-800">{course.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">教练</span>
            <span className="font-medium text-gray-800">{course.coach}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">日期</span>
            <span className="font-medium text-gray-800">{course.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">时间段</span>
            <span className="font-medium text-gray-800">{course.timeSlot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">剩余名额</span>
            <span
              className="font-bold"
              style={{ color: remaining > 0 ? COLOR_AVAILABLE : COLOR_FULL }}
            >
              {remaining} / {course.capacity}
            </span>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4 font-medium" style={{ color: COLOR_AVAILABLE }}>预约成功！</div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={e => { setMemberName(e.target.value); setError(''); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员号</label>
                <input
                  type="text"
                  value={memberId}
                  onChange={e => { setMemberId(e.target.value); setError(''); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入会员号"
                />
                {matchedMember && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: isExpired ? COLOR_FULL : COLOR_AVAILABLE }}
                  >
                    {matchedMember.name} - {matchedMember.status}
                  </p>
                )}
              </div>
            </div>
            {error && <p className="text-xs mt-2" style={{ color: COLOR_FULL }}>{error}</p>}
            <button
              onClick={handleBook}
              disabled={isFull || isExpired}
              className={`btn-primary w-full mt-4 text-sm ${isFull || isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFull ? '课程已满' : isExpired ? '会员已过期' : '立即预约'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
