import React, { useState, useRef } from 'react';
import { Trip } from '../dataStore';

interface TripBoardProps {
  trips: Trip[];
  onTripSelect: (id: string) => void;
  onTripCreate: (trip: Omit<Trip, 'id'>) => void;
  onTripDelete: (id: string) => void;
}

const styles = {
  container: {
    padding: '24px 32px',
    backgroundColor: '#F5F3F0',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700 as const,
    color: '#2D2D2D',
    margin: 0,
  },
  createBtn: {
    padding: '10px 24px',
    backgroundColor: '#00BCA4',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 16px',
    border: '1px solid #DDD',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#fff',
  },
  dateInput: {
    padding: '10px 12px',
    border: '1px solid #DDD',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#fff',
  },
  dateSeparator: {
    color: '#999',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    animation: 'cardFadeIn 0.4s ease forwards',
    opacity: 0,
  },
  cardCover: {
    width: '100%',
    height: '160px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  gradientPlaceholder: {
    width: '100%',
    height: '160px',
    background: 'linear-gradient(135deg, #00BCA4, #00897B)',
  },
  cardBody: {
    padding: '16px',
  },
  cardDestination: {
    fontSize: '18px',
    fontWeight: 600 as const,
    color: '#2D2D2D',
    marginBottom: '8px',
    transition: 'color 0.2s ease',
  },
  cardDate: {
    fontSize: '13px',
    color: '#888',
  },
  deleteBtn: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    lineHeight: 1,
    padding: 0,
    opacity: 0,
    zIndex: 2,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600 as const,
    color: '#2D2D2D',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '24px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '480px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    animation: 'modalSlideIn 0.3s ease',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: '#2D2D2D',
    margin: '0 0 24px 0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600 as const,
    color: '#555',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #DDD',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box' as const,
  },
  uploadArea: {
    width: '100%',
    padding: '20px',
    border: '2px dashed #CCC',
    borderRadius: '10px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#999',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  coverPreview: {
    width: '100%',
    height: '120px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    marginTop: '8px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  submitBtn: {
    padding: '10px 28px',
    backgroundColor: '#00BCA4',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  cancelBtn: {
    padding: '10px 28px',
    backgroundColor: '#E0E0E0',
    color: '#555',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  highlight: {
    backgroundColor: 'rgba(0, 188, 166, 0.3)',
    color: 'inherit',
    padding: '0 2px',
    borderRadius: '2px',
    transition: 'background-color 0.3s ease',
  },
};

const injectedCSS = `
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 1024px) {
  .trip-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
@media (max-width: 768px) {
  .trip-grid {
    grid-template-columns: 1fr !important;
  }
  .trip-board-container {
    padding: 16px !important;
  }
  .trip-filter-row {
    flex-direction: column;
  }
  .trip-filter-row .search-bar {
    width: 100%;
  }
}
.trip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 12px rgba(0,188,166,0.4);
}
.trip-card:hover .card-delete-btn {
  opacity: 1;
}
.search-bar:focus {
  border-color: #00BCA4;
  box-shadow: 0 0 0 3px rgba(0,188,166,0.15);
}
.form-input:focus {
  border-color: #00BCA4;
  box-shadow: 0 0 0 3px rgba(0,188,166,0.15);
}
.date-input:focus {
  border-color: #00BCA4;
  box-shadow: 0 0 0 3px rgba(0,188,166,0.15);
}
.create-btn:hover {
  background-color: #009e8a;
  transform: translateY(-1px);
}
.submit-btn:hover {
  background-color: #009e8a;
  transform: translateY(-1px);
}
.cancel-btn:hover {
  background-color: #CCC;
}
.card-delete-btn:hover {
  background-color: #E53935 !important;
}
.upload-area:hover {
  border-color: #00BCA4;
  color: #00BCA4;
}
`;

const TripBoard: React.FC<TripBoardProps> = ({ trips, onTripSelect, onTripCreate, onTripDelete }) => {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formDestination, setFormDestination] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = !search || trip.destination.toLowerCase().includes(search.toLowerCase());
    const matchesDateFrom = !dateFrom || trip.endDate >= dateFrom;
    const matchesDateTo = !dateTo || trip.startDate <= dateTo;
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return <span>{text}</span>;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark key={i} style={styles.highlight}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDestination.trim() || !formStartDate || !formEndDate) return;
    onTripCreate({
      destination: formDestination.trim(),
      startDate: formStartDate,
      endDate: formEndDate,
      coverImage: formCoverImage,
      days: [],
    });
    setFormDestination('');
    setFormStartDate('');
    setFormEndDate('');
    setFormCoverImage('');
    setShowCreateForm(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个旅行吗？')) {
      onTripDelete(id);
    }
  };

  return (
    <div className="trip-board-container" style={styles.container}>
      <style>{injectedCSS}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>我的旅行</h1>
        <button
          className="create-btn"
          style={styles.createBtn}
          onClick={() => setShowCreateForm(true)}
        >
          + 创建旅行
        </button>
      </div>

      <div className="trip-filter-row" style={styles.filterRow}>
        <input
          className="search-bar"
          style={styles.searchBar}
          type="text"
          placeholder="搜索目的地..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          className="date-input"
          style={styles.dateInput}
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />
        <span style={styles.dateSeparator}>至</span>
        <input
          className="date-input"
          style={styles.dateInput}
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />
      </div>

      {filteredTrips.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✈️</div>
          <div style={styles.emptyTitle}>
            {trips.length === 0 ? '还没有旅行计划' : '没有匹配的旅行'}
          </div>
          <div style={styles.emptyText}>
            {trips.length === 0
              ? '点击上方按钮，开始创建你的第一个旅行吧！'
              : '试试其他搜索条件'}
          </div>
          {trips.length === 0 && (
            <button
              className="create-btn"
              style={styles.createBtn}
              onClick={() => setShowCreateForm(true)}
            >
              创建第一个旅行
            </button>
          )}
        </div>
      ) : (
        <div className="trip-grid" style={styles.grid}>
          {filteredTrips.map((trip, index) => (
            <div
              key={trip.id}
              className="trip-card"
              style={{
                ...styles.card,
                animationDelay: `${index * 0.06}s`,
              }}
              onClick={() => onTripSelect(trip.id)}
            >
              <button
                className="card-delete-btn"
                style={styles.deleteBtn}
                onClick={e => handleDelete(trip.id, e)}
                title="删除旅行"
              >
                ✕
              </button>
              {trip.coverImage ? (
                <img
                  style={styles.cardCover}
                  src={trip.coverImage}
                  alt={trip.destination}
                />
              ) : (
                <div style={styles.gradientPlaceholder} />
              )}
              <div style={styles.cardBody}>
                <div style={styles.cardDestination}>
                  {highlightText(trip.destination, search)}
                </div>
                <div style={styles.cardDate}>
                  {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>创建新旅行</h2>
            <form onSubmit={handleCreateSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>目的地</label>
                <input
                  className="form-input"
                  style={styles.formInput}
                  type="text"
                  value={formDestination}
                  onChange={e => setFormDestination(e.target.value)}
                  placeholder="输入目的地"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>开始日期</label>
                <input
                  className="form-input"
                  style={styles.formInput}
                  type="date"
                  value={formStartDate}
                  onChange={e => setFormStartDate(e.target.value)}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>结束日期</label>
                <input
                  className="form-input"
                  style={styles.formInput}
                  type="date"
                  value={formEndDate}
                  onChange={e => setFormEndDate(e.target.value)}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>封面图片</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div
                  className="upload-area"
                  style={styles.uploadArea}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formCoverImage ? '已选择图片（点击更换）' : '点击上传封面图片'}
                </div>
                {formCoverImage && (
                  <img style={styles.coverPreview} src={formCoverImage} alt="预览" />
                )}
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  className="cancel-btn"
                  style={styles.cancelBtn}
                  onClick={() => setShowCreateForm(false)}
                >
                  取消
                </button>
                <button type="submit" className="submit-btn" style={styles.submitBtn}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripBoard;
