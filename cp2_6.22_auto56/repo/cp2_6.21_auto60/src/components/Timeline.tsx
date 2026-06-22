import type { FoodRecord } from '@/types';
import { useFoodStore } from '@/store/foodStore';

interface TimelineProps {
  records: FoodRecord[];
}

export default function Timeline({ records }: TimelineProps) {
  const removeRecord = useFoodStore((state) => state.removeRecord);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这条记录吗？')) {
      removeRecord(id);
    }
  };

  if (records.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
        <p>还没有饮食记录</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          搜索食物开始记录你的第一餐吧
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      <div
        style={{
          position: 'absolute',
          left: '7px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'linear-gradient(to bottom, #4ecdc4, rgba(78, 205, 196, 0.2))',
          borderRadius: '1px',
        }}
      />

      {records.map((record, index) => (
        <div
          key={record.id}
          className="animate-fade-up"
          style={{
            position: 'relative',
            marginBottom: '16px',
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '-20px',
              top: '20px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--primary)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1,
            }}
          />

          <div
            className="timeline-card"
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.3s ease',
              borderLeft: '3px solid transparent',
              cursor: 'default',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderLeftColor = '#4ecdc4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderLeftColor = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px',
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {record.foodName}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {record.grams} 克
                </p>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#888888',
                }}
              >
                {formatTime(record.createdAt)}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>热量</span>
                <p style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                  {record.calories} kcal
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>蛋白质</span>
                <p style={{ fontWeight: 600, color: '#4ecdc4' }}>
                  {record.protein} g
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>脂肪</span>
                <p style={{ fontWeight: 600, color: '#ff6b6b' }}>
                  {record.fat} g
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>碳水</span>
                <p style={{ fontWeight: 600, color: '#d4a72c' }}>
                  {record.carbs} g
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>纤维</span>
                <p style={{ fontWeight: 600, color: '#8bc34a' }}>
                  {record.fiber} g
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>钠</span>
                <p style={{ fontWeight: 600, color: '#9c27b0' }}>
                  {record.sodium} mg
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDelete(record.id)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '18px',
                opacity: 0,
                transition: 'opacity 0.2s',
                padding: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      <style>{`
        .timeline-card:hover button {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
