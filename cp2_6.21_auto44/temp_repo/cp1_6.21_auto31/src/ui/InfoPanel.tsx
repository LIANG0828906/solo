import React, { useState } from 'react';
import type { WeatherState, WeatherData } from '../weather/WeatherSystem';

interface Props {
  weatherData: WeatherData;
  forecast: WeatherState[];
  weatherSystem: { getConfig: (s: WeatherState) => WeatherData };
  gold: number;
  inventory: Record<string, number>;
  stamina: number;
}

const CROP_NAMES: Record<string, string> = {
  tomato: '番茄', carrot: '胡萝卜', wheat: '小麦', corn: '玉米',
};

const CROP_ICONS: Record<string, string> = {
  tomato: '🍅', carrot: '🥕', wheat: '🌾', corn: '🌽',
};

const stageLabel = (s: string) => {
  switch (s) {
    case 'seed': return '种子';
    case 'sprout': return '幼苗';
    case 'flowering': return '开花';
    case 'mature': return '成熟';
    default: return '';
  }
};

export default function InfoPanel({ weatherData, forecast, weatherSystem, gold, inventory, stamina }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const forecastItems = forecast.map((ws, i) => {
    const cfg = weatherSystem.getConfig(ws);
    return (
      <div key={i} style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>第{i + 1}天</div>
        <div style={{ fontSize: 20 }}>{cfg.icon}</div>
        <div style={{ fontSize: 9, color: '#ccc', marginTop: 2 }}>{cfg.label}</div>
      </div>
    );
  });

  const inventoryItems = Object.entries(inventory)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => (
      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span>{CROP_ICONS[k] || ''} {CROP_NAMES[k] || k}</span>
        <span style={{ color: '#FFD700' }}>×{v}</span>
      </div>
    ));

  const panelContent = (
    <div style={{ padding: 16, color: '#e0e0e0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff', letterSpacing: 1 }}>
        🌡️ 天气详情
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
        <span style={{ fontSize: 28 }}>{weatherData.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{weatherData.label}</div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
            生长倍率 ×{weatherData.growthMultiplier}
            {weatherData.autoWater ? ' · 自动灌溉' : ''}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#ccc' }}>📅 三日预报</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: '8px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
        {forecastItems}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#ccc' }}>💰 金币</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#FFD700', marginBottom: 16, padding: '8px 10px', background: 'rgba(255,215,0,0.08)', borderRadius: 8 }}>
        {gold} G
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#ccc' }}>📦 作物库存</div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', minHeight: 40 }}>
        {inventoryItems.length > 0 ? inventoryItems : (
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center', padding: 8 }}>暂无库存</div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a1a2e',
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 100,
        maxHeight: '60vh',
        overflow: 'auto',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
      }}>
        <div
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 40, height: 4, borderRadius: 2, background: '#555',
            transition: 'background 0.2s',
          }} />
        </div>
        {panelContent}
      </div>
    );
  }

  return (
    <div style={{
      width: '30%', minWidth: 220, height: '100%',
      background: 'linear-gradient(180deg, #16213e 0%, #1a1a2e 100%)',
      borderLeft: '2px solid rgba(255,255,255,0.08)',
      overflowY: 'auto',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
    }}>
      {panelContent}
    </div>
  );
}
