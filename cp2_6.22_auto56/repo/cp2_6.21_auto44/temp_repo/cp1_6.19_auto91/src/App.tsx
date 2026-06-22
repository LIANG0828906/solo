import React, { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { SimulationParams, LayoutType } from './utils/dataTypes';
import ControlPanel from './components/ControlPanel';
import BuildingScene from './components/BuildingScene';

const initialParams: SimulationParams = {
  layout: 'row',
  windAngle: 0,
  windSpeed: 4.5,
  solarIntensity: 75,
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [compareMode, setCompareMode] = useState(false);
  const [compareLayout, setCompareLayout] = useState<LayoutType>('enclosed');
  const [regenerateKey, setRegenerateKey] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      toast.success('欢迎使用城市风环境与热岛效应可视化工具', {
        duration: 3500,
        style: {
          background: '#2C3E50',
          color: 'white',
          borderRadius: 10,
          border: '1px solid rgba(100,181,246,0.5)',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        icon: '🏙️',
      });
    }, 600);
  }, []);

  const handleParamsChange = useCallback((newParams: SimulationParams) => {
    if (newParams.layout !== params.layout) {
      const names: Record<string, string> = {
        enclosed: '围合式布局',
        row: '行列式布局',
        cluster: '点群式布局',
      };
      toast.loading(`正在生成${names[newParams.layout]}...`, { id: 'layout-change' });
      setTimeout(() => {
        toast.success(`${names[newParams.layout]}已生成`, {
          id: 'layout-change',
          duration: 1500,
          icon: '✅',
        });
      }, 300);
    }
    setParams(newParams);
  }, [params.layout]);

  const handleCompareToggle = useCallback(() => {
    setCompareMode((prev) => {
      const next = !prev;
      if (next) {
        toast('对比模式已开启，左右场景使用相同参数对比不同布局', {
          duration: 2500,
          icon: '⚖️',
          style: {
            background: 'linear-gradient(135deg, rgba(39,174,96,0.95), rgba(22,160,133,0.95))',
            color: 'white',
            borderRadius: 10,
            fontWeight: 600,
          },
        });
        if (compareLayout === params.layout) {
          const other = (['enclosed', 'row', 'cluster'] as LayoutType[]).find(
            (l) => l !== params.layout
          ) as LayoutType;
          setCompareLayout(other);
        }
      } else {
        toast('已关闭对比模式', {
          duration: 1200,
          icon: '✕',
          style: {
            background: '#2C3E50',
            color: 'white',
            borderRadius: 10,
          },
        });
      }
      return next;
    });
  }, [compareLayout, params.layout]);

  const handleRegenerate = useCallback(() => {
    setRegenerateKey((k) => k + 1);
    toast.success('建筑高度已随机重新生成', {
      duration: 1500,
      icon: '🎲',
      style: {
        background: '#2C3E50',
        color: 'white',
        borderRadius: 10,
      },
    });
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#1A2332',
        overflow: 'hidden',
      }}
    >
      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          duration: 2000,
          style: {
            background: '#2C3E50',
            color: 'white',
          },
        }}
      />

      <div
        style={{
          width: '30%',
          minWidth: 290,
          maxWidth: 360,
          height: '100%',
          flexShrink: 0,
          position: 'relative',
          zIndex: 5,
        }}
      >
        <ControlPanel
          params={params}
          onParamsChange={handleParamsChange}
          onCompareToggle={handleCompareToggle}
          compareMode={compareMode}
          compareLayout={compareLayout}
          onCompareLayoutChange={(l) => {
            setCompareLayout(l);
            const names: Record<string, string> = {
              enclosed: '围合式布局',
              row: '行列式布局',
              cluster: '点群式布局',
            };
            toast(`对比方案已切换为${names[l]}`, {
              duration: 1200,
              icon: '↔️',
              style: {
                background: 'rgba(39,174,96,0.95)',
                color: 'white',
                borderRadius: 10,
                fontWeight: 600,
              },
            });
          }}
          onRegenerate={handleRegenerate}
        />
      </div>

      <div
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          minWidth: 0,
          background: '#0f171f',
        }}
      >
        <BuildingScene
          key={`${params.layout}-${regenerateKey}`}
          params={params}
          compareMode={compareMode}
          compareLayout={compareLayout}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 20,
            zIndex: 10,
            display: 'flex',
            gap: 14,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(44,62,80,0.85)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 11,
              border: '1px solid rgba(100,181,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #1A237E, #2196F3, #66BB6A, #FFEB3B, #FF7043, #D32F2F)',
              }}
            />
            温度色阶 蓝(冷) → 红(热) · 每2℃
          </div>
          <div
            style={{
              background: 'rgba(44,62,80,0.85)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 11,
              border: '1px solid rgba(100,181,246,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 22,
                height: 3,
                borderRadius: 2,
                background: '#4FC3F7',
                opacity: 0.75,
              }}
            />
            蓝色流线 · 粒子表示风向运动
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 20,
            zIndex: 10,
            background: 'rgba(44,62,80,0.85)',
            color: '#90A4AE',
            padding: '6px 12px',
            borderRadius: 10,
            fontSize: 10.5,
            border: '1px solid rgba(255,255,255,0.06)',
            pointerEvents: 'none',
            letterSpacing: 0.3,
          }}
        >
          Urban CFD Visualizer · v0.1 · Three.js + React
        </div>
      </div>
    </div>
  );
};

export default App;
