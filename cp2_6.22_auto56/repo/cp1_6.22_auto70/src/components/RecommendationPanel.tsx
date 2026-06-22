import { useState } from 'react';
import { Clock, Users, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calculateOptimalSlots } from '@/modules/schedule/autoScheduler';
import { createSchedule } from '@/modules/schedule/scheduleService';

const DURATIONS = [15, 30, 60];

const DURATION_COLORS: Record<number, string> = {
  15: '#4CAF50',
  30: '#2196F3',
  60: '#FF9800',
};

function getColorForCount(count: number): string {
  if (count <= 2) return '#4CAF50';
  if (count <= 4) return '#2196F3';
  return '#9C27B0';
}

function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };
  return `${fmt(startIso)} - ${fmt(endIso)} UTC`;
}

function extractDate(iso: string): string {
  return new Date(iso).toISOString().split('T')[0];
}

export default function RecommendationPanel() {
  const {
    users,
    schedules,
    selectedParticipantIds,
    meetingDuration,
    recommendations,
    toggleParticipant,
    setMeetingDuration,
    setRecommendations,
    addSchedule,
  } = useStore();

  const [animating, setAnimating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const selectedUsers = users.filter((u) => selectedParticipantIds.includes(u.id));

  const handleRecommend = () => {
    if (selectedUsers.length === 0) return;
    const results = calculateOptimalSlots(selectedUsers, meetingDuration, schedules);
    setRecommendations(results);
    setAnimating(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(true));
    });
  };

  const handleConfirm = async (rec: Recommendation, index: number) => {
    setConfirmingId(index);
    try {
      const created = await createSchedule({
        title: '团队会议',
        date: extractDate(rec.startTime),
        startTime: new Date(rec.startTime).toISOString().split('T')[1]?.slice(0, 5) ?? '',
        endTime: new Date(rec.endTime).toISOString().split('T')[1]?.slice(0, 5) ?? '',
        participantIds: selectedParticipantIds,
        color: getColorForCount(selectedParticipantIds.length),
      });
      addSchedule(created);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">参与者</span>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors"
                style={{
                  borderColor: selectedParticipantIds.includes(user.id) ? '#2196F3' : '#e2e8f0',
                  backgroundColor: selectedParticipantIds.includes(user.id) ? '#E3F2FD' : 'transparent',
                  color: selectedParticipantIds.includes(user.id) ? '#1565C0' : '#64748b',
                }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedParticipantIds.includes(user.id)}
                  onChange={() => toggleParticipant(user.id)}
                />
                {user.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">时长</span>
          <div className="flex gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setMeetingDuration(d)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  meetingDuration === d
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}min
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRecommend}
          disabled={selectedParticipantIds.length === 0}
          className="ml-auto rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          推荐时间
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {recommendations.map((rec, index) => (
            <div
              key={`${rec.startTime}-${index}`}
              className="rounded-xl p-4 shadow-md transition-all duration-500 ease-out"
              style={{
                background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(33, 150, 243, 0.15)',
                transform: animating ? 'translateY(0)' : 'translateY(40px)',
                opacity: animating ? 1 : 0,
                transitionDelay: `${index * 120}ms`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      {formatTimeRange(rec.startTime, rec.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">
                      {rec.overlapPercent}%（{rec.overlapCount}/{selectedParticipantIds.length} 人可用）
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleConfirm(rec, index)}
                  disabled={confirmingId === index}
                  className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-600 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" />
                  {confirmingId === index ? '确认中...' : '确认日程'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {rec.participantLocalTimes.map((plt) => {
                  const user = users.find((u) => u.id === plt.userId);
                  if (!user) return null;
                  return (
                    <span
                      key={plt.userId}
                      className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-xs text-blue-800"
                    >
                      <span className="font-medium">{user.name}</span>
                      <span className="text-blue-500">{plt.localTime}</span>
                      <span className="text-blue-400">({user.city})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
