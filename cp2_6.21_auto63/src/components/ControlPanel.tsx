import React, { useRef, useState } from 'react';
import { useGardenStore } from '../store';
import { SoilType, SOIL_WATER_RETENTION } from '../types';

const SOIL_OPTIONS: { type: SoilType; name: string; color: string }[] = [
  { type: 'sand', name: '沙土', color: '#F5DEB3' },
  { type: 'loam', name: '壤土', color: '#8B7355' },
  { type: 'clay', name: '黏土', color: '#A0522D' },
  { type: 'humus', name: '腐殖土', color: '#3E2723' },
];

export const ControlPanel: React.FC = () => {
  const lightIntensity = useGardenStore((state) => state.environment.lightIntensity);
  const waterAmount = useGardenStore((state) => state.environment.waterAmount);
  const soilType = useGardenStore((state) => state.environment.soilType);
  const turnCount = useGardenStore((state) => state.turnCount);
  const isTransitioning = useGardenStore((state) => state.isTransitioning);
  const setLight = useGardenStore((state) => state.setLight);
  const addWater = useGardenStore((state) => state.addWater);
  const setSoil = useGardenStore((state) => state.setSoil);
  const nextTurn = useGardenStore((state) => state.nextTurn);
  const saveGarden = useGardenStore((state) => state.saveGarden);
  const loadGarden = useGardenStore((state) => state.loadGarden);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSave = () => {
    const jsonString = saveGarden();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garden-save-${turnCount}-turns.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = loadGarden(content);
      if (!result.success && result.error) {
        setLoadError(result.error);
        setTimeout(() => setLoadError(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleWaterClick = () => {
    addWater(0.5);
  };

  return (
    <div
      style={{
        backgroundColor: '#FFF8E1',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '240px',
        border: '2px solid #FFB74D',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          color: '#5D4037',
          fontSize: '18px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        ⚙️ 环境调控
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={{ fontSize: '14px', color: '#5D4037', fontWeight: '500' }}>
            ☀️ 光照强度
          </label>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#FF8F00',
              backgroundColor: '#FFECB3',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {lightIntensity}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={lightIntensity}
          onChange={(e) => setLight(Number(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: 'linear-gradient(to right, #FFD54F, #FF8F00)',
            appearance: 'none',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#8D6E63',
            marginTop: '4px',
          }}
        >
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={{ fontSize: '14px', color: '#5D4037', fontWeight: '500' }}>
            💧 浇水量
          </label>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#0288D1',
              backgroundColor: '#B3E5FC',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {waterAmount.toFixed(1)} L
          </span>
        </div>
        <button
          onClick={handleWaterClick}
          disabled={waterAmount >= 5}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: waterAmount >= 5 ? '#B0BEC5' : '#4FC3F7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: waterAmount >= 5 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (waterAmount < 5) {
              e.currentTarget.style.backgroundColor = '#29B6F6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (waterAmount < 5) {
              e.currentTarget.style.backgroundColor = '#4FC3F7';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          浇水 +0.5L
        </button>
        <p
          style={{
            fontSize: '11px',
            color: '#8D6E63',
            marginTop: '6px',
            textAlign: 'center',
          }}
        >
          每回合结束后重置为 0
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            fontSize: '14px',
            color: '#5D4037',
            fontWeight: '500',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          🌍 土壤类型
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
          }}
        >
          {SOIL_OPTIONS.map((soil) => (
            <button
              key={soil.type}
              onClick={() => setSoil(soil.type)}
              style={{
                padding: '8px 6px',
                backgroundColor: soilType === soil.type ? soil.color : 'white',
                color: soilType === soil.type ? 'white' : '#5D4037',
                border: `2px solid ${soil.color}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: soilType === soil.type ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (soilType !== soil.type) {
                  e.currentTarget.style.backgroundColor = `${soil.color}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (soilType !== soil.type) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {soil.name}
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                保水: {(SOIL_WATER_RETENTION[soil.type] * 100).toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: '2px solid #FFB74D40',
          paddingTop: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#5D4037', fontWeight: '500' }}>
            当前回合
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FF8F00',
            }}
          >
            第 {turnCount} 回合
          </span>
        </div>
        <button
          onClick={nextTurn}
          disabled={isTransitioning}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isTransitioning ? '#BDBDBD' : '#8BC34A',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.backgroundColor = '#7CB342';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.backgroundColor = '#8BC34A';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }
          }}
        >
          {isTransitioning ? '⏳ 生长中...' : '➡️ 下一回合'}
        </button>
      </div>

      <div
        style={{
          borderTop: '2px solid #FFB74D40',
          paddingTop: '16px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#FFB74D',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFA726';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFB74D';
          }}
        >
          💾 保存
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#A1887F',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#8D6E63';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#A1887F';
          }}
        >
          📂 加载
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleLoad}
        />
      </div>

      {loadError && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#FFCCBC',
            color: '#D84315',
            borderRadius: '6px',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          ⚠️ {loadError}
        </div>
      )}
    </div>
  );
};
