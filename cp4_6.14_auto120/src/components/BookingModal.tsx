import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore, type Course } from '@/store/useStore';

export default function BookingModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const members = useStore(s => s.members);
  const createBooking = useStore(s => s.createBooking);
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const remaining = course.capacity - course.bookings.length;
  const isFull = remaining <= 0;

  const selectedMember = members.find(m => m.id === memberId);
  const isExpired = selectedMember?.status === '已过期';

  const handleBook = () => {
    if (!memberName.trim()) {
      setError('请输入姓名');
      return;
    }
    if (!memberId.trim()) {
      setError('请输入会员ID');
      return;
    }
    if (isFull) {
      setError('课程已满，无法预约');
      return;
    }
    if (isExpired) {
      setError('该会员已过期，无法预约');
      return;
    }
    createBooking(course.id, memberName.trim(), memberId.trim());
    setSuccess(true);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-lg w-[400px] p-6"
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
            <span className={`font-bold ${remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {remaining} / {course.capacity}
            </span>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4 text-green-600 font-medium">预约成功！</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">会员ID</label>
                <input
                  type="text"
                  value={memberId}
                  onChange={e => { setMemberId(e.target.value); setError(''); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入会员ID"
                />
                {selectedMember && (
                  <p className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                    {selectedMember.name} - {selectedMember.status}
                  </p>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <button
              onClick={handleBook}
              disabled={isFull}
              className={`btn-primary w-full mt-4 text-sm ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFull ? '课程已满' : '立即预约'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
