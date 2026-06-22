import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { pourMethodLabels } from '../types';
import { formatBrewTime } from '../utils/qrGenerator';
import type { BrewRecord, CoffeeBean } from '../types';

interface BrewTimelineProps {
  records: BrewRecord[];
  beans: CoffeeBean[];
  onGenerateQR?: (recordId: string) => void;
}

interface TimelineItemProps {
  record: BrewRecord;
  bean: CoffeeBean | undefined;
  isSelected: boolean;
  onToggle: () => void;
  onGenerateQR?: () => void;
}

const TimelineItem = ({ record, bean, isSelected, onToggle, onGenerateQR }: TimelineItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #E0D5C7',
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#FFF8E1' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = '#FAFAFA';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div
          style={{
            width: 120,
            fontSize: 13,
            color: '#6D4C41',
            fontWeight: 500,
            fontFamily: "'Source Serif Pro', serif",
          }}
        >
          {formatTime(record.createdAt)}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 12,
            color: '#5D4037',
          }}
        >
          <span style={{ fontWeight: 600, color: '#4E342E' }}>
            {bean?.name || '未知咖啡豆'}
          </span>
          <span>
            {record.coffeeAmount}g / {record.waterAmount}ml
          </span>
          <span>{record.waterTemp}°C</span>
          <span>研磨度 {record.grindSize}</span>
          <span>{formatBrewTime(record.brewTime)}</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: '#D7CCC8',
              color: '#4E342E',
              fontSize: 11,
            }}
          >
            {pourMethodLabels[record.pourMethod]}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#FF8F00',
              fontWeight: 600,
            }}
          >
            ★ {record.rating.overall}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: `1px solid ${isSelected ? '#6D4C41' : '#BCAAA4'}`,
              backgroundColor: isSelected ? '#6D4C41' : 'transparent',
              color: isSelected ? '#FFFFFF' : '#6D4C41',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isSelected ? '已选择' : '对比'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateQR?.();
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid #8D6E63',
              backgroundColor: '#8D6E63',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            二维码
          </button>
          <span
            style={{
              fontSize: 16,
              color: '#A1887F',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                width: 400,
                backgroundColor: '#FFF8E1',
                borderRadius: 12,
                padding: 20,
                margin: '12px 16px',
                boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: 15,
                    color: '#4E342E',
                    fontWeight: 600,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {bean?.name}
                </h4>
                <p style={{ margin: 0, fontSize: 11, color: '#8D6E63' }}>
                  {formatDateTime(record.createdAt)}
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>咖啡粉量</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {record.coffeeAmount}g
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>水量</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {record.waterAmount}ml
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>水温</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {record.waterTemp}°C
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>研磨度</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {record.grindSize}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>冲煮时间</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {formatBrewTime(record.brewTime)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#A1887F' }}>注水方式</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 14, color: '#4E342E', fontWeight: 600 }}>
                    {pourMethodLabels[record.pourMethod]}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  marginBottom: 16,
                  padding: '12px 0',
                  borderTop: '1px solid #E0D5C7',
                  borderBottom: '1px solid #E0D5C7',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#FF8F00' }}>
                    ★ {record.rating.overall}
                  </div>
                  <div style={{ fontSize: 10, color: '#A1887F' }}>总分</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#6D4C41' }}>
                    {record.rating.acidity}
                  </div>
                  <div style={{ fontSize: 10, color: '#A1887F' }}>酸度</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#6D4C41' }}>
                    {record.rating.sweetness}
                  </div>
                  <div style={{ fontSize: 10, color: '#A1887F' }}>甜度</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#6D4C41' }}>
                    {record.rating.aroma}
                  </div>
                  <div style={{ fontSize: 10, color: '#A1887F' }}>香气</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#A1887F' }}>品鉴笔记</span>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 12,
                    color: '#5D4037',
                    lineHeight: 1.6,
                  }}
                >
                  {record.notes}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BrewTimeline = ({ records, beans, onGenerateQR }: BrewTimelineProps) => {
  const { selectedForComparison, toggleComparison } = useStore();

  const groupedRecords = useMemo(() => {
    const groups: Record<string, BrewRecord[]> = {};
    records.forEach((record) => {
      const dateKey = new Date(record.createdAt).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  }, [records]);

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
      {Object.entries(groupedRecords).map(([date, dayRecords]) => (
        <div key={date}>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#F5E6CC',
              fontSize: 13,
              fontWeight: 600,
              color: '#4E342E',
              borderBottom: '1px solid #E0D5C7',
            }}
          >
            {date}
          </div>
          {dayRecords.map((record) => (
            <TimelineItem
              key={record.id}
              record={record}
              bean={beans.find((b) => b.id === record.beanId)}
              isSelected={selectedForComparison.includes(record.id)}
              onToggle={() => toggleComparison(record.id)}
              onGenerateQR={() => onGenerateQR?.(record.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
