import React from 'react';
import { useStarStore } from '@/store/starStore';
import { SPECTRAL_TYPES, SPECTRAL_COLORS } from '@/types/star';
import type { SpectralType, StarData } from '@/types/star';

const ConstellationDecoration: React.FC = () => (
  <svg
    width="100%"
    height="40"
    viewBox="0 0 240 40"
    fill="none"
    style={{ marginBottom: '12px' }}
  >
    <polyline
      points="20,20 45,10 65,25 90,5 115,18 140,8 165,22 195,12 220,20"
      stroke="#4ECDC4"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="20" cy="20" r="2.5" fill="#4ECDC4" />
    <circle cx="45" cy="10" r="2" fill="#4ECDC4" />
    <circle cx="65" cy="25" r="3" fill="#4ECDC4" />
    <circle cx="90" cy="5" r="2" fill="#4ECDC4" />
    <circle cx="115" cy="18" r="2.5" fill="#4ECDC4" />
    <circle cx="140" cy="8" r="2" fill="#4ECDC4" />
    <circle cx="165" cy="22" r="2.5" fill="#4ECDC4" />
    <circle cx="195" cy="12" r="2" fill="#4ECDC4" />
    <circle cx="220" cy="20" r="2.5" fill="#4ECDC4" />
  </svg>
);

const StarDetail: React.FC<{ star: StarData }> = ({ star }) => {
  const spectralColor = SPECTRAL_COLORS[star.spectralType];
  
  return (
    <div
      style={{
        marginTop: '16px',
        padding: '14px',
        background: 'rgba(42, 42, 68, 0.5)',
        borderRadius: '12px',
        border: `1px solid ${spectralColor}40`,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${spectralColor}, ${spectralColor}80)`,
            boxShadow: `0 0 20px ${spectralColor}60`,
          }}
        />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
            {star.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: spectralColor,
              fontWeight: 500,
            }}
          >
            {star.spectralType}型恒星
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888899', marginBottom: '3px' }}>
            表面温度
          </div>
          <div style={{ fontSize: '14px', color: '#E0E0E0', fontWeight: 500 }}>
            {star.temperature.toLocaleString()} K
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888899', marginBottom: '3px' }}>
            相对半径
          </div>
          <div style={{ fontSize: '14px', color: '#E0E0E0', fontWeight: 500 }}>
            {star.radius.toFixed(1)} R☉
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '11px', color: '#888899', marginBottom: '4px' }}>
          光谱分类
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div
            style={{
              flex: 1,
              height: '6px',
              background: 'linear-gradient(to right, #FF4C4C, #FF8C42, #FFD93D, #FFF7E0, #D4E2FF, #A2C4FF, #9BB0FF)',
              borderRadius: '3px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                left: `${(SPECTRAL_TYPES.indexOf(star.spectralType) / (SPECTRAL_TYPES.length - 1)) * 100}%`,
                background: spectralColor,
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
                boxShadow: `0 0 8px ${spectralColor}`,
                transition: 'all 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '11px', color: '#888899', marginBottom: '4px' }}>
          简介
        </div>
        <p style={{ fontSize: '12px', color: '#C0C0D0', lineHeight: 1.6, margin: 0 }}>
          {star.description}
        </p>
      </div>
    </div>
  );
};

const AudioPlayer: React.FC = () => {
  const {
    stars,
    selectedStarId,
    filterSpectralTypes,
    selectStar,
    toggleSpectralFilter,
    clearFilters,
  } = useStarStore();

  const selectedStar = selectedStarId ? stars.find((s) => s.id === selectedStarId) : null;
  const hasActiveFilter = filterSpectralTypes.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '20px',
        width: '260px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid #2A2A44',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        padding: '18px',
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
    >
      <ConstellationDecoration />

      <div style={{ marginBottom: '18px' }}>
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            marginBottom: '4px',
            letterSpacing: '1px',
          }}
        >
          光谱宇宙
        </h1>
        <p style={{ fontSize: '11px', color: '#888899', margin: 0 }}>
          3D 恒星数据可视化画廊
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#E0E0E0' }}>
            光谱类型过滤
          </span>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: '11px',
                color: '#888899',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#00E5FF';
                e.currentTarget.style.background = 'rgba(0, 229, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888899';
                e.currentTarget.style.background = 'none';
              }}
            >
              清除
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {SPECTRAL_TYPES.map((type) => {
            const color = SPECTRAL_COLORS[type];
            const isSelected = filterSpectralTypes.includes(type);
            const starCount = stars.filter((s) => s.spectralType === type).length;

            return (
              <label
                key={type}
                onClick={(e) => {
                  e.preventDefault();
                  toggleSpectralFilter(type as SpectralType);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isSelected ? `${color}20` : 'transparent',
                  border: isSelected ? `1px solid ${color}50` : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = `${color}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: `2px solid ${isSelected ? color : '#4A4A6A'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? color : 'transparent',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M2 5L4.5 7.5L8 3"
                        stroke={type === 'F' || type === 'G' ? '#1A1A2E' : '#FFFFFF'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${color}, ${color}80)`,
                    boxShadow: `0 0 8px ${color}60`,
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    fontSize: '14px',
                    color: isSelected ? color : '#E0E0E0',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.3s ease',
                    flex: 1,
                  }}
                >
                  {type}型
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    color: '#666677',
                    background: 'rgba(74, 74, 106, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {starCount}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedStar && <StarDetail star={selectedStar} />}

      {!selectedStar && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(42, 42, 68, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
          <p
            style={{
              fontSize: '12px',
              color: '#888899',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            点击任意恒星查看详细信息
            <br />
            拖拽旋转视角，滚轮缩放
            <br />
            按 ESC 取消选择
          </p>
        </div>
      )}

      <div
        style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid #2A2A44',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', color: '#666677' }}>
          恒星总数
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#00E5FF' }}>
          {stars.length}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
