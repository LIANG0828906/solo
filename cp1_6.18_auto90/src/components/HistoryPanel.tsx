import React, { useState, useEffect } from 'react';
import {
  useAppStore,
  SortType,
  TastingNote,
  getDominantFlavor,
  DIMENSION_COLORS,
  DIMENSION_LABELS,
  FlavorDimension,
  type DominantFlavor,
} from '@/stores/appStore';
import FlavorRadar from './FlavorRadar';
import WheelThumbnail from './WheelThumbnail';

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'date-desc', label: '日期降序' },
  { value: 'date-asc', label: '日期升序' },
  { value: 'sweet', label: '甜' },
  { value: 'sour', label: '酸' },
  { value: 'bitter', label: '苦' },
  { value: 'spicy', label: '辣' },
  { value: 'salty', label: '咸' },
  { value: 'umami', label: '鲜' },
];

const HistoryPanel: React.FC = () => {
  const { notes, sortType, sortNotes, selectNote, selectedNoteId } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalNote, setModalNote] = useState<TastingNote | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note) {
        setModalNote(note);
      }
    }
  }, [selectedNoteId, notes]);

  const handleCardClick = (note: TastingNote) => {
    selectNote(note.id);
    setModalNote(note);
  };

  const closeModal = () => {
    setModalNote(null);
    selectNote(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  const panelContent = (
    <>
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2A2A44',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>历史记录</h3>
        <select
          value={sortType}
          onChange={(e) => sortNotes(e.target.value as SortType)}
          style={{
            background: '#2D2D44',
            border: '1px solid #4A4A6A',
            borderRadius: '6px',
            color: 'white',
            padding: '6px 10px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {notes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6A6A8A',
              fontSize: '14px',
            }}
          >
            暂无品鉴记录
            <br />
            <span style={{ fontSize: '12px' }}>保存第一份记录开始你的味觉之旅</span>
          </div>
        ) : (
          notes.map((note, index) => {
            const dominant: DominantFlavor = getDominantFlavor(note.wheelData);
            const color = DIMENSION_COLORS[dominant.dimension];
            return (
              <div
                key={note.id}
                onClick={() => handleCardClick(note)}
                style={{
                  height: '100px',
                  background: '#1A1A2E',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${color}`,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '6px',
                  animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {note.dishName}
                </div>
                <div style={{ fontSize: '12px', color: '#8A8AAA' }}>{formatDate(note.date)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: `${color}33`,
                      color: color,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {DIMENSION_LABELS[dominant.dimension]} {dominant.value}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(108, 92, 231, 0.4)',
              zIndex: 90,
              transition: 'transform 0.2s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            📋
          </button>

          {drawerOpen && (
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70vh',
                background: '#0F0F23',
                borderTop: '1px solid #2A2A44',
                borderRadius: '16px 16px 0 0',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideUp 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  background: '#4A4A6A',
                  borderRadius: '2px',
                  margin: '12px auto',
                }}
              />
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#8A8AAA',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
              {panelContent}
            </div>
          )}

          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: '70vh',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 99,
                animation: 'fadeIn 0.3s ease',
              }}
            />
          )}
        </>
      ) : (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '300px',
            background: '#0F0F23',
            borderLeft: '1px solid #2A2A44',
            borderRadius: '16px 0 0 16px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease',
          }}
        >
          {panelContent}
        </div>
      )}

      {modalNote && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? '90%' : '400px',
              maxWidth: '400px',
              maxHeight: '90vh',
              background: '#1A1A2E',
              borderRadius: '12px',
              border: '1px solid #4A4A6A',
              padding: '20px',
              overflowY: 'auto',
              animation: 'scaleIn 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{modalNote.dishName}</h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8A8AAA',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#8A8AAA', marginBottom: '16px' }}>
              {formatDate(modalNote.date)}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#8A8AAA' }}>风味轮盘</span>
                <WheelThumbnail data={modalNote.wheelData} size={120} />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#8A8AAA' }}>雷达图</span>
                <FlavorRadar data={modalNote.wheelData} size={120} />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {(['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami'] as FlavorDimension[]).map(
                (dim) => (
                  <div
                    key={dim}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: `${DIMENSION_COLORS[dim]}22`,
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ color: DIMENSION_COLORS[dim], fontSize: '13px' }}>
                      {DIMENSION_LABELS[dim]}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {modalNote.wheelData[dim]}
                    </span>
                  </div>
                )
              )}
            </div>

            {modalNote.description && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#8A8AAA', marginBottom: '6px' }}>描述</div>
                <div
                  style={{
                    background: '#2D2D44',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                >
                  {modalNote.description}
                </div>
              </div>
            )}

            {modalNote.photoUrl && (
              <div>
                <div style={{ fontSize: '12px', color: '#8A8AAA', marginBottom: '6px' }}>照片</div>
                <img
                  src={modalNote.photoUrl}
                  alt={modalNote.dishName}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    aspectRatio: '1',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryPanel;
