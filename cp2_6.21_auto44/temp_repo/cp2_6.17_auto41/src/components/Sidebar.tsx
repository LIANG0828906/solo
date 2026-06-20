import { useStore } from '@/stores/useStore';

function getWorkloadColor(count: number): string {
  if (count <= 3) return '#27AE60';
  if (count <= 6) return '#E67E22';
  return '#E74C3C';
}

const MAX_DISPLAY_TASKS = 8;

export default function Sidebar() {
  const getMemberWorkload = useStore(s => s.getMemberWorkload);
  const workloads = getMemberWorkload();

  const maxTasks = Math.max(MAX_DISPLAY_TASKS, ...workloads.map(w => w.totalTasks));

  return (
    <aside
      style={{
        width: '320px',
        backgroundColor: '#F8F9FA',
        borderRight: '1px solid #E5E8EB',
        padding: '24px 20px',
        flexShrink: 0,
        overflowY: 'auto',
        height: 'calc(100vh - 64px)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#2C3E50',
            marginBottom: '4px',
          }}
        >
          👥 成员工作负载
        </h2>
        <p style={{ fontSize: '12px', color: '#7F8C8D' }}>
          实时查看团队成员工作分配情况
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {workloads.map(wl => {
          const barColor = getWorkloadColor(wl.totalTasks);
          const percentage = maxTasks > 0 ? (wl.totalTasks / maxTasks) * 100 : 0;

          return (
            <div key={wl.member.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: wl.member.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {wl.member.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#2C3E50' }}>
                      {wl.member.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#95A5A6' }}>
                      共 {wl.totalTasks} 个任务
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: wl.completionRate === 100 ? '#27AE60' : '#5D6D7E',
                  }}
                >
                  {wl.completionRate}%
                </div>
              </div>

              <div
                style={{
                  position: 'relative',
                  height: '28px',
                  backgroundColor: '#E5E8EB',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: barColor,
                    borderRadius: '6px',
                    transition: 'width 0.4s ease, background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    minWidth: percentage > 0 ? '30px' : '0',
                  }}
                >
                  {percentage > 15 && (
                    <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 600 }}>
                      {wl.totalTasks}
                    </span>
                  )}
                </div>
                {percentage <= 15 && wl.totalTasks > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: `${Math.max(percentage, 4)}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      color: barColor,
                      fontWeight: 600,
                    }}
                  >
                    {wl.totalTasks}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#95A5A6' }}>
                  已完成 {wl.completedTasks}
                </span>
                <span style={{ color: '#95A5A6' }}>
                  进行中 {wl.totalTasks - wl.completedTasks}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E5E8EB',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C3E50', marginBottom: '12px' }}>
          📌 工作负载说明
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5D6D7E' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#27AE60' }} />
            ≤ 3 个任务（正常）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5D6D7E' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#E67E22' }} />
            4 - 6 个任务（中等）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5D6D7E' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#E74C3C' }} />
            {'>'} 6 个任务（饱和）
          </div>
        </div>
      </div>
    </aside>
  );
}
