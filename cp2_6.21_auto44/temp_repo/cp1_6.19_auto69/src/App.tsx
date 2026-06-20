import React, { useState, useCallback, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import FlavorWheel from './components/FlavorWheel';
import TastingForm from './components/TastingForm';
import { TastingProvider, useTastingStore, TastingRecord, RoastLevel } from './records/tastingStore';
import { getTagById } from './data/flavorWheel';

const MAX_FLAVOR_TAGS = 5;

const getRoastLabel = (level: RoastLevel): string => {
  switch (level) {
    case 'light': return '浅烘焙';
    case 'medium': return '中烘焙';
    case 'dark': return '深烘焙';
  }
};

const getRoastColor = (level: RoastLevel): string => {
  switch (level) {
    case 'light': return '#C4956A';
    case 'medium': return '#8B5E3C';
    case 'dark': return '#5D3A1A';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

interface RadarChartProps {
  acidity: number;
  bitterness: number;
  mouthfeel: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ acidity, bitterness, mouthfeel }) => {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 45;

  const angles = [-90, 30, 150];
  const values = [acidity, bitterness, mouthfeel];
  const labels = ['酸度', '苦度', '口感'];

  const points = values.map((val, i) => {
    const angle = (angles[i] * Math.PI) / 180;
    const r = (val / 5) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const axisPoints = angles.map((angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  });

  const labelPoints = angles.map((angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + (radius + 14) * Math.cos(rad),
      y: cy + (radius + 14) * Math.sin(rad),
    };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ') + ' Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="record-radar">
      {[1, 2, 3, 4, 5].map((level) => (
        <circle
          key={level}
          cx={cx}
          cy={cy}
          r={(level / 5) * radius}
          fill="none"
          stroke="#E0D5C7"
          strokeWidth="0.5"
        />
      ))}
      {axisPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="#D3B89F"
          strokeWidth="0.5"
        />
      ))}
      <path
        d={pathD}
        fill="rgba(107, 66, 38, 0.2)"
        stroke="#6B4226"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6B4226" />
      ))}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="#8B7355"
          fontWeight="500"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
};

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || rating) >= star;
        return (
          <span
            key={star}
            className={`star ${isFilled ? 'filled' : ''}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRate(star)}
          >
            {isFilled ? <FaStar /> : <FiStar />}
          </span>
        );
      })}
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};

interface RecordCardProps {
  record: TastingRecord;
}

const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const { deleteRecord, updateRating } = useTastingStore();
  const [isSwiped, setIsSwiped] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      if (deltaX < -50) {
        setIsSwiped(true);
      } else if (deltaX > 50) {
        setIsSwiped(false);
      }
    },
    [touchStartX]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchStartX(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (touchStartX === null) return;
      const deltaX = e.clientX - touchStartX;
      if (deltaX < -50) {
        setIsSwiped(true);
      } else if (deltaX > 50) {
        setIsSwiped(false);
      }
    },
    [touchStartX]
  );

  const handleMouseUp = useCallback(() => {
    setTouchStartX(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deleteRecord(record.id);
    setShowDeleteModal(false);
  }, [deleteRecord, record.id]);

  const handleRate = useCallback(
    (rating: number) => {
      updateRating(record.id, rating);
    },
    [updateRating, record.id]
  );

  return (
    <>
      <div
        className={`card record-card ${isSwiped ? 'swiped' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setTouchStartX(null)}
      >
        <button className="record-delete-btn" onClick={handleDeleteClick}>
          删除
        </button>
        <div style={{ paddingRight: isSwiped ? '0' : '0' }}>
          <div className="record-header">
            <div>
              <span className="record-name">{record.coffeeName}</span>
              <span
                className="record-roast-badge"
                style={{ backgroundColor: getRoastColor(record.roastLevel) }}
              >
                {getRoastLabel(record.roastLevel)}
              </span>
              <div className="record-date">{formatDate(record.tasteDate)}</div>
            </div>
            <StarRating rating={record.rating} onRate={handleRate} />
          </div>

          <div className="record-flavors">
            {record.flavorTags.map((tagId) => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="record-flavor-dot"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                />
              );
            })}
          </div>

          <RadarChart
            acidity={record.acidity}
            bitterness={record.bitterness}
            mouthfeel={record.mouthfeel}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="删除记录"
        message={`确定要删除"${record.coffeeName}"的品鉴记录吗？此操作不可撤销。`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

const AppContent: React.FC = () => {
  const { records } = useTastingStore();
  const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([]);

  const handleSelectTag = useCallback((tagId: string) => {
    setSelectedFlavorTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= MAX_FLAVOR_TAGS) {
        return prev;
      }
      return [...prev, tagId];
    });
  }, []);

  const handleRemoveTag = useCallback((tagId: string) => {
    setSelectedFlavorTags((prev) => prev.filter((id) => id !== tagId));
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedFlavorTags([]);
  }, []);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      return new Date(b.tasteDate).getTime() - new Date(a.tasteDate).getTime();
    });
  }, [records]);

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFF8EE',
            color: '#3A2C1F',
            border: '1px solid #D3B89F',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#FFF8EE',
            },
          },
          error: {
            style: {
              background: '#FDE8E8',
              borderColor: '#C45C5C',
              color: '#A04040',
            },
          },
        }}
      />

      <h1 className="app-title">☕ 咖啡风味品鉴工坊</h1>

      <div className="main-layout">
        <div>
          <FlavorWheel
            selectedTags={selectedFlavorTags}
            onSelect={handleSelectTag}
          />
        </div>

        <div>
          <TastingForm
            selectedFlavorTags={selectedFlavorTags}
            onRemoveTag={handleRemoveTag}
            onClearTags={handleClearTags}
          />
        </div>

        <div className="records-section">
          <div className="card">
            <h2 className="records-title">品鉴记录 ({sortedRecords.length})</h2>
            {sortedRecords.length === 0 ? (
              <div className="empty-state">
                暂无品鉴记录，开始记录你的第一杯咖啡吧！
              </div>
            ) : (
              <div className="records-list">
                {sortedRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TastingProvider>
      <AppContent />
    </TastingProvider>
  );
};

export default App;
