import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Equipment, DateRange } from './types';

interface EquipmentCardProps {
  equipment: Equipment;
  index: number;
  onAddToTrip: (equipment: Equipment, dateRange: DateRange) => boolean;
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function EquipmentCard({ equipment, index, onAddToTrip }: EquipmentCardProps) {
  const [startDate, setStartDate] = useState<string>(todayStr());
  const [endDate, setEndDate] = useState<string>(tomorrowStr());
  const [feedback, setFeedback] = useState<string>('');

  const handleAdd = () => {
    if (!startDate || !endDate) {
      setFeedback('请选择日期');
      setTimeout(() => setFeedback(''), 1500);
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFeedback('结束日期需晚于开始日期');
      setTimeout(() => setFeedback(''), 1500);
      return;
    }
    const ok = onAddToTrip(equipment, { startDate, endDate });
    if (ok) {
      setFeedback('已加入行程 ✓');
      setTimeout(() => setFeedback(''), 1200);
    } else {
      setFeedback('库存不足或日期无效');
      setTimeout(() => setFeedback(''), 1500);
    }
  };

  const rate = equipment.rentalRateLast7Days.reduce((a, b) => a + b, 0) / equipment.rentalRateLast7Days.length;
  let tagLabel = '标准价';
  let tagColor = '#6B8E5A';
  if (rate < 0.3) {
    tagLabel = '特惠 8折';
    tagColor = '#B8860B';
  } else if (rate > 0.7) {
    tagLabel = '旺季 1.2x';
    tagColor = '#A0522D';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ boxShadow: '0 8px 24px rgba(46, 90, 40, 0.18)', y: -2 }}
      transition_hover={{ duration: 0.2 }}
      style={{
        width: 280,
        height: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(46, 90, 40, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      <div
        style={{
          height: 130,
          background: 'linear-gradient(135deg, #C8B89A 0%, #E8DCC4 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '4px 10px',
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            color: tagColor,
          }}
        >
          {tagLabel}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 10px',
            backgroundColor: 'rgba(46, 90, 40, 0.85)',
            borderRadius: 12,
            fontSize: 11,
            color: '#FFFFFF',
          }}
        >
          库存 {equipment.stock}
        </div>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#8B7D6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18l9-12 9 12" />
          <path d="M9 18h6" />
          <circle cx="12" cy="15" r="1" />
        </svg>
      </div>

      <div style={{ padding: '12px 16px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2E3A22' }}>{equipment.name}</div>
        </div>
        <div style={{ fontSize: 13, color: '#B0A896', marginBottom: 10, minHeight: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {equipment.description || `${equipment.category}装备 · 品质保障`}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#2E5A28', marginBottom: 10 }}>
          ¥{equipment.basePrice}<span style={{ fontSize: 12, fontWeight: 400, color: '#7A8B70' }}> /天</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#E2EAD8',
            borderRadius: 8,
            padding: '6px 8px',
            marginBottom: 10,
            gap: 4,
          }}
        >
          <input
            type="date"
            value={startDate}
            min={todayStr()}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 11,
              color: '#2E3A22',
              height: 24,
              padding: '0 2px',
              minWidth: 0,
              WebkitAppearance: 'none',
            }}
          />
          <span style={{ color: '#7A8B70', fontSize: 12 }}>→</span>
          <input
            type="date"
            value={endDate}
            min={startDate || todayStr()}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 11,
              color: '#2E3A22',
              height: 24,
              padding: '0 2px',
              minWidth: 0,
              WebkitAppearance: 'none',
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          style={{
            height: 36,
            width: '100%',
            backgroundColor: '#2E5A28',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 'auto',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E3E1A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E5A28'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          加入行程
        </button>
        {feedback && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: feedback.includes('✓') ? '#2E5A28' : '#A0522D',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
            }}
          >
            {feedback}
          </div>
        )}
      </div>
    </motion.div>
  );
}
