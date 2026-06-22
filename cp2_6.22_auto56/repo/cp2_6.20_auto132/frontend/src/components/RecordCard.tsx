import type { TrainingRecord, TrainingType } from '../types';
import dayjs from 'dayjs';

interface RecordCardProps {
  record: TrainingRecord;
  index: number;
}

const typeColors: Record<TrainingType, string> = {
  strength: 'var(--strength)',
  cardio: 'var(--cardio)',
  yoga: 'var(--yoga)',
  other: 'var(--other)',
};

const typeLabels: Record<TrainingType, string> = {
  strength: '力量训练',
  cardio: '有氧运动',
  yoga: '瑜伽',
  other: '其他',
};

const RecordCard = ({ record, index }: RecordCardProps) => {
  const animationDelay = `${index * 0.1}s`;

  return (
    <div
      className="card"
      style={{
        animation: `slideUp 0.5s ease-out ${animationDelay} both`,
        position: 'relative',
        marginLeft: '2rem',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-2.75rem',
          top: '1.5rem',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: typeColors[record.type],
          boxShadow: `0 0 0 4px var(--bg-primary), 0 0 0 5px ${typeColors[record.type]}`,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              backgroundColor: typeColors[record.type],
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            {typeLabels[record.type]}
          </span>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            {dayjs(record.date).format('YYYY年MM月DD日')}
          </span>
        </div>
        <span
          style={{
            color: 'var(--accent)',
            fontWeight: '600',
            fontSize: '1.1rem',
          }}
        >
          {record.duration} 分钟
        </span>
      </div>
      {record.notes && (
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginTop: '0.5rem',
          }}
        >
          {record.notes}
        </p>
      )}
    </div>
  );
};

export default RecordCard;
