import { useSkillsStore } from '@/store/skillsStore';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { color: '#EAB308', label: '等待对方确认', Icon: Clock },
  accepted: { color: '#22C55E', label: '已接受', Icon: CheckCircle },
  rejected: { color: '#EF4444', label: '已拒绝', Icon: XCircle },
} as const;

export default function ExchangeRecordsPage() {
  const { exchangeRequests, skills } = useSkillsStore();

  const getSkillTitle = (skillId: string) =>
    skills.find((s) => s.id === skillId)?.title ?? '未知技能';

  return (
    <div className="min-h-screen bg-[#F5F3EE] px-4 py-8">
      <div className="mx-auto max-w-xl">
        <h1
          className="mb-8 text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          交换记录
        </h1>

        {exchangeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Clock size={48} strokeWidth={1.2} className="mb-4" />
            <p className="text-lg">暂无交换记录</p>
            <p className="mt-1 text-sm">发起交换请求后，记录将显示在这里</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm">
            {exchangeRequests.map((req, idx) => {
              const { color, label, Icon } = STATUS_CONFIG[req.status];
              return (
                <div key={req.id}>
                  {idx > 0 && <div className="mx-4 border-t border-gray-100" />}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-gray-900">
                        {getSkillTitle(req.skillId)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{req.date}</p>
                    </div>
                    <span
                      className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Icon size={13} />
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
