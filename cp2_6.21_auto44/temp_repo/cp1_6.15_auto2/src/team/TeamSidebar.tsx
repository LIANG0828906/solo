import { useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { useStore } from '@/shared/store';

export default function TeamSidebar() {
  const teamMembers = useStore((s) => s.teamMembers);
  const tasks = useStore((s) => s.tasks);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setTeamMembers = useStore((s) => s.setTeamMembers);

  useEffect(() => {
    fetch('/api/team')
      .then((r) => r.json())
      .then(setTeamMembers)
      .catch(() => {});
  }, [setTeamMembers, tasks]);

  const workloadData = teamMembers
    .filter((m) => (m.totalHours || 0) > 0)
    .map((m) => ({
      name: m.name,
      value: m.totalHours || 0,
      color: m.color,
    }));

  const onlineMembers = teamMembers.filter((m) => m.online);
  const offlineMembers = teamMembers.filter((m) => !m.online);

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-white/80 backdrop-blur-glass rounded-l-card p-1.5 shadow-card hover:bg-white transition-colors"
      >
        <ChevronLeft size={16} className="text-macaron-dark" />
      </button>
    );
  }

  return (
    <div className="w-[260px] flex-shrink-0 bg-white/50 backdrop-blur-glass border-l border-white/60 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100/60">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-macaron-purple" />
          <h3 className="font-display font-bold text-macaron-dark text-xs">团队概况</h3>
        </div>
        <button onClick={toggleSidebar} className="p-1 text-gray-300 hover:text-macaron-dark transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">在线 ({onlineMembers.length})</p>
          {onlineMembers.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </div>

        {offlineMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">离线 ({offlineMembers.length})</p>
            {offlineMembers.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}

        {workloadData.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">工作量分布</p>
            <div className="bg-white/60 rounded-card p-3 shadow-card">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workloadData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {workloadData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      formatter={(value: number, name: string) => [`${value}h`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {workloadData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: { id: string; name: string; avatar: string; online: boolean; color: string; taskCount?: number; totalHours?: number } }) {
  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <div className="relative">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: member.color + '30' }}>
          {member.avatar}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
            member.online ? 'bg-green-400' : 'bg-gray-300'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display font-semibold text-macaron-dark truncate">{member.name}</p>
        <p className="text-[10px] text-gray-400">
          {member.taskCount || 0} 个任务 · {member.totalHours || 0}h
        </p>
      </div>
    </div>
  );
}
