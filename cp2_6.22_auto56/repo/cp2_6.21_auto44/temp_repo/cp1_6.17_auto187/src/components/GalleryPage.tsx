import React, { useState } from 'react';
import { Logo } from '../services/apiService';

interface GalleryPageProps {
  logos: Logo[];
  onToggleFavorite: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
}

function hueToColor(hue: number): string {
  return `hsl(${hue}, 60%, 55%)`;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ logos, onToggleFavorite }) => {
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const openDetail = (logo: Logo) => {
    setSelectedLogo(logo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLogo(null);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cid) => cid !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const openCompare = () => {
    setShowCompare(true);
  };

  const closeCompare = () => {
    setShowCompare(false);
  };

  const compareLogos = logos.filter((l) => compareIds.includes(l.id));

  return (
    <div style={{ padding: 24, background: '#F5F0E8', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, color: '#5C4F3D', fontWeight: 600, marginBottom: 24 }}>
        画廊
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {logos.map((logo) => (
          <div
            key={logo.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 2px 8px rgba(0,0,0,0.08)';
            }}
            onClick={() => openDetail(logo)}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(logo.id);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 18,
                cursor: 'pointer',
                transition: 'all 0.2s',
                zIndex: 2,
                userSelect: 'none',
              }}
            >
              {logo.isFavorite ? '♥' : '♡'}
            </span>

            <div style={{ position: 'relative' }}>
              {logo.imageData.startsWith('data:') ? (
                <img
                  src={logo.imageData}
                  alt={logo.name}
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    display: 'block',
                    margin: '8px auto 0',
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    display: 'block',
                    margin: '8px auto 0',
                    borderRadius: 8,
                    background: hueToColor(logo.params.hue),
                  }}
                />
              )}

              <input
                type="checkbox"
                checked={compareIds.includes(logo.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleCompare(logo.id)}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  cursor: 'pointer',
                  width: 16,
                  height: 16,
                }}
              />
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 14, color: '#5C4F3D', fontWeight: 500 }}>
                {logo.name}
              </div>
              <div style={{ fontSize: 11, color: '#A89F91', marginTop: 4 }}>
                {formatDate(logo.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {compareIds.length >= 2 && (
        <button
          onClick={openCompare}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 24px',
            background: '#8B7D6B',
            color: '#FFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 999,
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          对比 ({compareIds.length})
        </button>
      )}

      {showModal && selectedLogo && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFF',
              borderRadius: 16,
              padding: 24,
              maxWidth: 660,
              position: 'relative',
            }}
          >
            <span
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                fontSize: 24,
                cursor: 'pointer',
                color: '#8B7D6B',
              }}
            >
              ×
            </span>

            {selectedLogo.imageData.startsWith('data:') ? (
              <img
                src={selectedLogo.imageData}
                alt={selectedLogo.name}
                style={{
                  width: 600,
                  height: 600,
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            ) : (
              <div
                style={{
                  width: 600,
                  height: 600,
                  maxWidth: '100%',
                  borderRadius: 8,
                  background: hueToColor(selectedLogo.params.hue),
                  margin: '0 auto',
                }}
              />
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#5C4F3D' }}>
                {selectedLogo.name}
              </div>
              <div style={{ fontSize: 13, color: '#8B7D6B', marginTop: 8 }}>
                色相: {selectedLogo.params.hue} · 旋转: {selectedLogo.params.rotation}° ·
                形状数: {selectedLogo.params.shapeCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <div
          onClick={closeCompare}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFF',
              borderRadius: 16,
              padding: 24,
              maxWidth: 960,
              position: 'relative',
              display: 'flex',
              gap: 24,
            }}
          >
            <span
              onClick={closeCompare}
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                fontSize: 24,
                cursor: 'pointer',
                color: '#8B7D6B',
              }}
            >
              ×
            </span>

            {compareLogos.map((logo) => (
              <div key={logo.id} style={{ textAlign: 'center' }}>
                {logo.imageData.startsWith('data:') ? (
                  <img
                    src={logo.imageData}
                    alt={logo.name}
                    style={{
                      width: 300,
                      height: 300,
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 300,
                      height: 300,
                      borderRadius: 8,
                      background: hueToColor(logo.params.hue),
                    }}
                  />
                )}
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: '#5C4F3D' }}>
                  {logo.name}
                </div>
                <div style={{ fontSize: 12, color: '#8B7D6B', marginTop: 4 }}>
                  色相: {logo.params.hue} · 旋转: {logo.params.rotation}° · 形状数:{' '}
                  {logo.params.shapeCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
