import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { usePodcastStore } from '@/store';
import StatRing from '@/components/StatRing';

export default function GuestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { guests, programs, linkGuestToProgram, unlinkGuestFromProgram } = usePodcastStore();
  const guest = guests.find((g) => g.id === id);

  const [showProgramPicker, setShowProgramPicker] = useState(false);

  if (!guest) {
    return (
      <div className="card-base text-center py-16 animate-fade-in">
        <h3 className="font-display font-semibold text-lg text-slate-600 mb-2">嘉宾不存在</h3>
        <button onClick={() => navigate('/guests')} className="btn-press px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium mt-4">
          返回嘉宾列表
        </button>
      </div>
    );
  }

  const linkedPrograms = programs.filter((p) => p.guestIds.includes(guest.id));
  const availablePrograms = programs.filter((p) => !p.guestIds.includes(guest.id));

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getTime());
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getTime());

  const recentPrograms = linkedPrograms.filter((p) => {
    if (!p.recordDate) return false;
    return new Date(p.recordDate) >= threeMonthsAgo;
  });

  const thisMonthPrograms = linkedPrograms.filter((p) => {
    if (!p.recordDate) return false;
    return new Date(p.recordDate) >= oneMonthAgo;
  });

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthPrograms = linkedPrograms.filter((p) => {
    if (!p.recordDate) return false;
    const d = new Date(p.recordDate);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const activityTrend = thisMonthPrograms.length > lastMonthPrograms.length
    ? '本月活跃度上升'
    : thisMonthPrograms.length < lastMonthPrograms.length
    ? '本月活跃度下降'
    : '本月活跃度持平';

  const recentTrend = `近3个月参与${recentPrograms.length}期节目`;

  const avgRating = guest.rating > 0 ? guest.rating : (linkedPrograms.length > 0 ? 4.0 : 0);
  const lastDate = linkedPrograms.length > 0
    ? linkedPrograms
        .filter((p) => p.recordDate)
        .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0]?.recordDate
    : null;

  const daysSinceLast = lastDate
    ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const lastDateTrend = daysSinceLast !== null
    ? daysSinceLast === 0
      ? '今天刚参与录制'
      : daysSinceLast <= 7
      ? `${daysSinceLast}天前刚参与`
      : `${Math.ceil(daysSinceLast / 30)}个月前参与`
    : '暂无参与记录';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guests')}
          className="btn-press p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          {guest.avatarUrl ? (
            <img src={guest.avatarUrl} alt={guest.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: guest.color }}
            >
              {guest.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-xl text-slate-800">{guest.name}</h1>
            {guest.bio && <p className="text-xs text-slate-400 line-clamp-1">{guest.bio}</p>}
          </div>
        </div>
      </div>

      <div className="card-base">
        <h3 className="text-xs font-medium text-slate-400 mb-4">信息统计</h3>
        <div className="flex items-center justify-around">
          <StatRing
            value={linkedPrograms.length}
            max={Math.max(linkedPrograms.length, 10)}
            label="参与节目"
            color="#3b82f6"
            trendText={activityTrend}
          />
          <StatRing
            value={avgRating}
            max={5}
            label="平均评分"
            color="#f59e0b"
            suffix=""
            trendText={recentTrend}
          />
          <StatRing
            value={daysSinceLast !== null ? Math.max(0, 30 - (daysSinceLast || 0)) : 0}
            max={30}
            label="最近参与"
            color="#22c55e"
            trendText={lastDateTrend}
          />
        </div>
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-slate-400">参与节目</h3>
          <button
            onClick={() => setShowProgramPicker(true)}
            className="btn-press flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-500 hover:text-accent"
          >
            <Plus size={12} />
            关联
          </button>
        </div>

        {linkedPrograms.length === 0 ? (
          <p className="text-xs text-slate-300 py-2">暂未参与任何节目</p>
        ) : (
          <div className="space-y-2">
            {linkedPrograms.map((program) => (
              <div
                key={program.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-sm"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      program.status === 'draft' ? '#94a3b8' :
                      program.status === 'recording' ? '#3b82f6' :
                      program.status === 'editing' ? '#f59e0b' : '#22c55e',
                  }}
                />
                <span
                  className="flex-1 text-slate-600 cursor-pointer hover:text-accent"
                  onClick={() => navigate(`/program/${program.id}`)}
                >
                  {program.title}
                </span>
                {program.recordDate && (
                  <span className="text-[11px] text-slate-300">{program.recordDate}</span>
                )}
                <button
                  onClick={() => unlinkGuestFromProgram(program.id, guest.id)}
                  className="text-slate-300 hover:text-red-400 btn-press"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showProgramPicker && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">选择节目</span>
              <button onClick={() => setShowProgramPicker(false)} className="text-slate-400 hover:text-slate-600 btn-press">
                <X size={14} />
              </button>
            </div>
            {availablePrograms.length === 0 ? (
              <p className="text-xs text-slate-300">所有节目已关联或无可用节目</p>
            ) : (
              <div className="space-y-1">
                {availablePrograms.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => {
                      linkGuestToProgram(program.id, guest.id);
                      if (availablePrograms.length <= 1) setShowProgramPicker(false);
                    }}
                    className="btn-press w-full text-left px-3 py-2 rounded-md bg-white text-sm text-slate-600 hover:text-accent"
                  >
                    {program.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
