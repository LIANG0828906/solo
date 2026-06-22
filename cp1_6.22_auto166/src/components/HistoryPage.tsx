import { CheckInRecord } from '../types';

interface HistoryPageProps {
  records: CheckInRecord[];
  onBack: () => void;
}

const getEvaluation = (deviation: number): { text: string; color: string } => {
  if (deviation >= -10) return { text: '优秀', color: '#22C55E' };
  if (deviation >= -20) return { text: '良好', color: '#6366F1' };
  return { text: '需努力', color: '#F59E0B' };
};

const formatDate = (isoString: string) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(1)}h`;
};

export default function HistoryPage({ records, onBack }: HistoryPageProps) {
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
      <div style={{
        height: '64px',
        background: 'linear-gradient(to right, #6366F1, #8B5CF6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← 返回
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>历史签到记录</h1>
        </div>
        <span style={{ fontSize: '14px' }}>共 {records.length} 条记录</span>
      </div>

      <div style={{ flex: 1, padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 120px 140px 120px 120px 100px',
            padding: '16px 20px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            fontWeight: 600,
            fontSize: '13px',
            color: '#475569',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div>座位号</div>
            <div>日期</div>
            <div>预约时间段</div>
            <div>实际时长</div>
            <div>偏差</div>
            <div>评价</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sortedRecords.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 0', 
                color: '#94A3B8',
                fontSize: '14px'
              }}>
                暂无历史记录
              </div>
            ) : (
              sortedRecords.map((record, index) => {
                const evalData = getEvaluation(record.deviation);
                return (
                  <div
                    key={record.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 120px 140px 120px 120px 100px',
                      padding: '14px 20px',
                      background: index % 2 === 0 ? 'white' : '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      fontSize: '14px',
                      color: '#1E293B',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{record.seatNumber}</div>
                    <div>{formatDate(record.checkInTime)}</div>
                    <div>{formatTime(record.checkInTime)} - {record.checkOutTime ? formatTime(record.checkOutTime) : '--:--'}</div>
                    <div>{formatHours(record.actualDuration)}</div>
                    <div style={{ 
                      color: record.deviation >= 0 ? '#22C55E' : '#EF4444' 
                    }}>
                      {record.deviation >= 0 ? '+' : ''}{record.deviation.toFixed(1)}%
                    </div>
                    <div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: `${evalData.color}15`,
                        color: evalData.color,
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {evalData.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
