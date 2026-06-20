import type { Animal, HealthStatus } from '../types';

interface AnimalCardProps {
  animal: Animal;
  onClick: () => void;
  isNew?: boolean;
  style?: React.CSSProperties;
}

const healthColors: Record<HealthStatus, string> = {
  healthy: 'var(--health-healthy)',
  observation: 'var(--health-observation)',
  treatment: 'var(--health-treatment)'
};

const healthTitles: Record<HealthStatus, string> = {
  healthy: '健康',
  observation: '需观察',
  treatment: '需治疗'
};

export default function AnimalCard({ animal, onClick, isNew, style }: AnimalCardProps) {
  return (
    <div
      onClick={onClick}
      className={isNew ? 'bounce-in' : ''}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'var(--transition)',
        backgroundColor: 'var(--bg-color)',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: healthColors[animal.healthStatus],
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          zIndex: 1
        }}
        title={healthTitles[animal.healthStatus]}
      />
      <div
        style={{
          width: '100%',
          height: '160px',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5'
        }}
      >
        <img
          src={animal.photoUrl}
          alt={animal.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'var(--transition)'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop';
          }}
        />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
          {animal.name}
        </h3>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-dark)',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          {animal.species}
        </span>
      </div>
    </div>
  );
}
