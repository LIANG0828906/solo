import { CheckInRecord } from '../types';

interface SidePanelProps {
  todayDuration: number;
  totalDuration: number;
  todayRecords: CheckInRecord[];
  activeCheckIn: CheckInRecord | null;
  elapsedSeconds: number;
  onCheckOut: () => void;
}

export default function SidePanel({ 
  todayDuration, 
  totalDuration, 
  todayRecords, 
  activeCheckIn, 
  elapsedSeconds,
  onCheckOut 
}: SidePanelProps) {

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}小时${m}分钟`;
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      width: '320px',
      background: '#F8FAFC',
      borderLeft: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '20px' }}>
          学习时长统计
        </h3>
        
        {activeCheckIn && (
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
              正在学习 - 座位 {activeCheckIn.seatNumber}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '1px' }}>
              {formatElapsed(elapsedSeconds)}
            </div>
            <button
              onClick={onCheckOut}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                backdropFilter: 'blur(10px)'
              }}
            >
              签退
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>今日学习</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>
              {todayDuration.toFixed(1)}h
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>总学习</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>
              {totalDuration.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '16px' }}>
          今日签到记录
        </h3>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {todayRecords.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#94A3B8', 
              fontSize: '14px',
              padding: '40px 0'
            }}>
              今天还没有签到记录
            </div>
          ) : (
            todayRecords.map((record, index) => (
            <div
              key={record.id}
              style={{
                borderBottom: index < todayRecords.length - 1 ? '1px dashed #E2E8F0' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderRadius: '8px',
                padding: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>
                  座位 {record.seatNumber}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {formatHours(record.actualDuration)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                {formatTime(record.checkInTime)} - {record.checkOutTime ? formatTime(record.checkOutTime) : '--:--'}
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
