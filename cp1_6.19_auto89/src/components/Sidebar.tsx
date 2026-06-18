import React, { memo } from 'react';
import { motion } from 'framer-motion';
import type { Location, MoodType } from '../types';
import { MOOD_CONFIGS } from '../types';
import { HiX, HiTrash } from 'react-icons/hi';

interface SidebarProps {
  locations: Location[];
  selectedLocationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😄',
  touched: '🥹',
  surprised: '🎉',
  calm: '🌿',
  tired: '😮‍💨',
};

const Sidebar: React.FC<SidebarProps> = ({
  locations,
  selectedLocationId,
  onSelect,
  onDelete,
  onClose,
}) => {
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
          .sidebar-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            box-shadow: var(--shadow-hover) !important;
          }
          .map-area {
            width: 100% !important;
          }
          .mobile-sidebar-toggle {
            display: flex !important;
          }
        }
      `}</style>

      <div
        className="sidebar-overlay"
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(45, 42, 38, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 498,
        }}
        onClick={onClose}
      />

      <motion.aside
        className="sidebar-root"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -320, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.25 }}
        style={{
          width: 'var(--sidebar-width)',
          height: '100%',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 499,
          position: 'relative',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              我的足迹
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              共 {locations.length} 个地点
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-main)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="关闭侧边栏"
          >
            <HiX style={{ fontSize: '20px' }} />
          </button>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {locations.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontSize: '28px',
                }}
              >
                🗺️
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
                还没有足迹
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                在右侧地图上点击任意位置<br />开始记录你的旅程吧 ✨
              </p>
            </div>
          ) : selectedLocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                onClick={() => onSelect('' as any)}
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                ← 返回列表
              </button>

              {selectedLocation.photos.length > 0 && (
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img
                    src={selectedLocation.photos[0].url}
                    alt={selectedLocation.title}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: `${MOOD_CONFIGS[selectedLocation.mood].color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    {MOOD_EMOJI[selectedLocation.mood]}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedLocation.title}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {MOOD_CONFIGS[selectedLocation.mood].label} · {new Date(selectedLocation.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>📍</span>
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </div>

                {selectedLocation.note && (
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.7,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedLocation.note}
                  </p>
                )}

                {selectedLocation.photos.length > 1 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(selectedLocation.photos.length - 1, 3)}, 1fr)`,
                      gap: '6px',
                      marginTop: '14px',
                    }}
                  >
                    {selectedLocation.photos.slice(1).map(p => (
                      <img
                        key={p.id}
                        src={p.url}
                        alt=""
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onDelete(selectedLocation.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFF0F0',
                  color: '#E5484D',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFE0E0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF0F0'; }}
              >
                <HiTrash />
                删除地点
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {locations.map((loc, idx) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  onClick={() => onSelect(loc.id)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedLocationId === loc.id ? 'var(--bg-main)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: selectedLocationId === loc.id ? '1px solid var(--border-soft)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(45, 42, 38, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = selectedLocationId === loc.id ? 'var(--bg-main)' : 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: 'var(--bg-main)',
                    }}
                  >
                    {loc.photos.length > 0 ? (
                      <img
                        src={loc.photos[0].url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          backgroundColor: `${MOOD_CONFIGS[loc.mood].color}25`,
                        }}
                      >
                        {MOOD_EMOJI[loc.mood]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {loc.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '12px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${MOOD_CONFIGS[loc.mood].color}25`,
                        }}
                      >
                        {MOOD_EMOJI[loc.mood]}
                      </span>
                    </div>
                    {loc.note && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {loc.note}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      {new Date(loc.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default memo(Sidebar);
