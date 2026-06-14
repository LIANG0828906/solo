import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';

function getStripColor(timeSlot: string): string {
  if (timeSlot.startsWith('09')) return '#3b82f6';
  if (timeSlot.startsWith('14')) return '#f59e0b';
  return '#8b5cf6';
}

function getTimePeriodLabel(timeSlot: string): string {
  if (timeSlot.startsWith('09')) return '上午';
  if (timeSlot.startsWith('14')) return '下午';
  return '晚上';
}

export default function CoachPanel() {
  const coachSchedule = useStore(s => s.coachSchedule);
  const fetchCoachSchedule = useStore(s => s.fetchCoachSchedule);

  useEffect(() => {
    fetchCoachSchedule();
  }, [fetchCoachSchedule]);

  if (!coachSchedule) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
        今日暂无课程安排
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Clock className="w-5 h-5 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-800">教练看板</h2>
        <span className="text-xs text-gray-400 ml-2">{coachSchedule.date}</span>
      </div>
      <div className="p-4">
        {coachSchedule.courses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">今日暂无课程</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coachSchedule.courses.map(course => (
              <div
                key={course.id}
                className="w-[280px] h-[160px] bg-white rounded-xl border border-gray-300 overflow-hidden flex"
              >
                <div
                  className="w-1 shrink-0"
                  style={{ backgroundColor: getStripColor(course.timeSlot) }}
                />
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm mb-1">{course.name}</div>
                    <div className="text-xs text-gray-500">
                      {getTimePeriodLabel(course.timeSlot)} {course.timeSlot} · {course.coach}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      已预约 {course.totalBooked} 人
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {course.bookedStudents.length <= 5
                        ? course.bookedStudents.join('、') || '暂无预约'
                        : `${course.bookedStudents.slice(0, 5).join('、')} 等${course.bookedStudents.length}人`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
