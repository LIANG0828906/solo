import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { TravelEntry } from './types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface TimelineCardProps {
  entry: TravelEntry;
  index: number;
  isNew?: boolean;
}

const TimelineCard = ({ entry, index, isNew = false }: TimelineCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const isLeft = index % 2 === 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const truncateContent = (text: string, max: number) => {
    if (text.length <= max) return text;
    return text.slice(0, max) + '...';
  };

  const openModal = () => {
    setIsOpen(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const closeModal = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 200);
  };

  const cardStyle: React.CSSProperties = {
    opacity: isNew && !visible ? 0 : visible ? 1 : 0,
    transform: isNew && !visible
      ? 'translateY(40px)'
      : visible
      ? 'translateX(0)'
      : isLeft
      ? 'translateX(-40px)'
      : 'translateX(40px)',
    transition: `opacity 0.4s ease ${isNew ? '0s' : '0s'}, transform 0.4s ease ${isNew ? '0s' : '0s'}`,
  };

  return (
    <>
      <div
        ref={cardRef}
        id={`card-${entry.id}`}
        style={{
          position: 'relative',
          width: '50%',
          padding: isLeft ? '20px 60px 20px 20px' : '20px 20px 20px 60px',
          marginLeft: isLeft ? 0 : '50%',
          boxSizing: 'border-box',
          ...cardStyle,
        }}
      >
        <div
          onClick={openModal}
          style={{
            background: '#fef9ef',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 4px 20px var(--color-card-shadow)',
            cursor: 'pointer',
            position: 'relative',
            float: isLeft ? 'right' : 'left',
            width: '100%',
            maxWidth: '500px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            border: '1px solid rgba(180,140,100,0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow =
              '0 8px 30px rgba(180,140,100,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow =
              '0 4px 20px var(--color-card-shadow)';
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              [isLeft ? 'right' : 'left']: '-13px',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#d4a96e',
              border: '2px solid #fef9ef',
              boxShadow: '0 0 0 2px #e0b88a',
              zIndex: 2,
            }}
          />

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#8b6f47',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '12px',
              letterSpacing: '0.5px',
            }}
          >
            {formatDate(entry.date)}
          </div>

          <h3
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#8b6f47',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📍</span>
            {entry.location}
          </h3>

          {entry.photos.length > 0 && (
            <div
              style={{
                width: '100%',
                height: '160px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '14px',
                background: '#f0e6d6',
              }}
            >
              <img
                src={entry.photos[0]}
                alt={entry.location}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          <p
            style={{
              color: '#5a4a3a',
              fontSize: '14px',
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            {truncateContent(entry.content, 50)}
          </p>

          <div
            style={{
              marginTop: '14px',
              color: '#a08868',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            点击查看详情 →
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: isAnimating
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            animation: isAnimating
              ? 'fadeIn 0.3s ease-out'
              : 'fadeOut 0.2s ease-in',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fef9ef',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transform: isAnimating ? 'scale(1)' : 'scale(1)',
              animation: isAnimating
                ? 'scaleIn 0.3s ease-out'
                : 'scaleOut 0.2s ease-in',
            }}
          >
            <div
              style={{
                padding: '30px 40px',
                borderBottom: '1px solid rgba(180,140,100,0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#8b6f47',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '10px',
                    }}
                  >
                    {formatDate(entry.date)}
                  </div>
                  <h2
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#8b6f47',
                      fontSize: '28px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span>📍</span>
                    {entry.location}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(139,111,71,0.1)',
                    color: '#8b6f47',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139,111,71,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139,111,71,0.1)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {entry.photos.length > 0 && (
              <div style={{ padding: '0 40px', marginTop: '30px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f0e6d6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      transition: 'transform 0.4s ease',
                      transform: `translateX(-${photoIndex * 100}%)`,
                    }}
                  >
                    {entry.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`${entry.location} ${i + 1}`}
                        style={{
                          width: '100%',
                          flexShrink: 0,
                          height: '450px',
                          objectFit: 'cover',
                        }}
                      />
                    ))}
                  </div>
                  {entry.photos.length > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      {entry.photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex(i);
                          }}
                          style={{
                            width: i === photoIndex ? '10px' : '8px',
                            height: i === photoIndex ? '10px' : '8px',
                            borderRadius: '50%',
                            border: 'none',
                            background:
                              i === photoIndex
                                ? 'rgba(255,255,255,0.95)'
                                : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ padding: '30px 40px 40px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '30px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h4
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#8b6f47',
                      fontSize: '14px',
                      marginBottom: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ✍️ 旅行随感
                  </h4>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: '#5a4a3a',
                      fontSize: '15px',
                      lineHeight: 2,
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                    {entry.content}
                  </div>
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#8b6f47',
                      fontSize: '14px',
                      marginBottom: '12px',
                      fontWeight: 600,
                    }}
                  >
                    🗺️ 足迹位置
                  </h4>
                  <div
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '220px',
                      border: '1px solid rgba(180,140,100,0.2)',
                    }}
                  >
                    <MapContainer
                      center={[entry.lat, entry.lng]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[entry.lat, entry.lng]} />
                    </MapContainer>
                  </div>
                  <div
                    style={{
                      marginTop: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#a08868',
                    }}
                  >
                    坐标: {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleOut {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default TimelineCard;
