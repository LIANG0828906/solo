import React, { useState } from 'react';
import {
  sceneManager,
  MaterialKey,
  ShapeType,
} from '../scene/SceneManager';
import { MATERIALS } from '../utils/constants';

const LightIcon: React.FC = () => (
  <div
    style={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      background:
        'radial-gradient(circle, #ffffff 0%, #89CFF0 60%, transparent 100%)',
      boxShadow: '0 0 30px rgba(137, 207, 240, 0.6)',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
    }}
  >
    光源
  </div>
);

export const ControlPanel: React.FC = () => {
  const [config, setConfig] = useState(sceneManager.getConfig());
  const [hoveredKnob, setHoveredKnob] = useState<string | null>(null);

  const updateConfig = () => {
    setConfig(sceneManager.getConfig());
  };

  React.useEffect(() => {
    return sceneManager.onChange(updateConfig);
  }, []);

  const handleMaterialChange = (material: MaterialKey) => {
    sceneManager.setMaterial(material);
  };

  const handleShapeChange = (shape: ShapeType) => {
    sceneManager.setShape(shape);
  };

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    sceneManager.setIncidentAngle(parseFloat(e.target.value));
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    sceneManager.setLightDistance(parseFloat(e.target.value));
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 180,
          height: '100%',
          background: '#1a1a2e',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          borderRight: '1px solid rgba(137, 207, 240, 0.2)',
          zIndex: 10,
        }}
      >
        <h3
          style={{
            color: '#fff',
            fontSize: 16,
            marginBottom: 8,
            borderBottom: '1px solid rgba(137, 207, 240, 0.3)',
            paddingBottom: 8,
          }}
        >
          光源面板
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <LightIcon />
          <span style={{ color: '#89CFF0', fontSize: 12 }}>
            拖动光束对准棱镜
          </span>
        </div>

        <div style={{ marginTop: 16 }}>
          <h4
            style={{
              color: '#89CFF0',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            形状选择
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['prism', 'sphere'] as ShapeType[]).map((shape) => (
              <button
                key={shape}
                onClick={() => handleShapeChange(shape)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border:
                    config.shape === shape
                      ? '1px solid #89CFF0'
                      : '1px solid rgba(137, 207, 240, 0.3)',
                  background:
                    config.shape === shape
                      ? 'rgba(137, 207, 240, 0.2)'
                      : 'rgba(137, 207, 240, 0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                }}
              >
                {shape === 'prism' ? '三棱柱' : '球体'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <h4
            style={{
              color: '#89CFF0',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            材质选择
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.keys(MATERIALS) as MaterialKey[]).map((key) => {
              const mat = MATERIALS[key];
              const active = config.material === key;
              return (
                <button
                  key={key}
                  onClick={() => handleMaterialChange(key)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: active
                      ? '1px solid #89CFF0'
                      : '1px solid rgba(137, 207, 240, 0.3)',
                    background: active
                      ? 'rgba(137, 207, 240, 0.2)'
                      : 'rgba(137, 207, 240, 0.05)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.4s ease',
                    boxShadow: active
                      ? '0 0 20px rgba(137, 207, 240, 0.4)'
                      : 'none',
                  }}
                >
                  <span>{mat.nameCn}</span>
                  <span style={{ color: '#aaa', fontSize: 11 }}>
                    n={mat.refractiveIndex}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 240,
          height: '100%',
          background: 'rgba(30, 30, 50, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          borderLeft: '1px solid rgba(137, 207, 240, 0.15)',
          zIndex: 10,
        }}
      >
        <h3
          style={{
            color: '#fff',
            fontSize: 16,
            marginBottom: 8,
            borderBottom: '1px solid rgba(137, 207, 240, 0.3)',
            paddingBottom: 8,
          }}
        >
          参数控制
        </h3>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <label style={{ color: '#89CFF0', fontSize: 13 }}>入射角</label>
            <span
              style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              {config.incidentAngle.toFixed(0)}°
            </span>
          </div>
          <div style={{ position: 'relative', height: 24 }}>
            <div
              style={{
                position: 'absolute',
                top: 11,
                left: 0,
                right: 0,
                height: 2,
                background: 'rgba(137, 207, 240, 0.3)',
                borderRadius: 1,
              }}
            />
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={config.incidentAngle}
              onChange={handleAngleChange}
              onMouseEnter={() => setHoveredKnob('angle')}
              onMouseLeave={() => setHoveredKnob(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 24,
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 11,
                left: 0,
                width: `${(config.incidentAngle / 90) * 100}%`,
                height: 2,
                background: '#89CFF0',
                borderRadius: 1,
                boxShadow: '0 0 8px rgba(137, 207, 240, 0.6)',
                transition: 'width 0.2s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 12 - 8,
                left: `calc(${(config.incidentAngle / 90) * 100}% - 8px)`,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 ${hoveredKnob === 'angle' ? 16 : 8}px rgba(137, 207, 240, 0.8)`,
                transform: `scale(${hoveredKnob === 'angle' ? 1.2 : 1})`,
                transition: 'all 0.15s ease',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              color: '#666',
              fontSize: 11,
            }}
          >
            <span>0°</span>
            <span>90°</span>
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <label style={{ color: '#89CFF0', fontSize: 13 }}>光源距离</label>
            <span
              style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              {config.lightDistance.toFixed(1)} 单位
            </span>
          </div>
          <div style={{ position: 'relative', height: 24 }}>
            <div
              style={{
                position: 'absolute',
                top: 11,
                left: 0,
                right: 0,
                height: 2,
                background: 'rgba(137, 207, 240, 0.3)',
                borderRadius: 1,
              }}
            />
            <input
              type="range"
              min={2}
              max={8}
              step={0.1}
              value={config.lightDistance}
              onChange={handleDistanceChange}
              onMouseEnter={() => setHoveredKnob('distance')}
              onMouseLeave={() => setHoveredKnob(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 24,
                opacity: 0,
                cursor: 'pointer',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 11,
                left: 0,
                width: `${((config.lightDistance - 2) / 6) * 100}%`,
                height: 2,
                background: '#89CFF0',
                borderRadius: 1,
                boxShadow: '0 0 8px rgba(137, 207, 240, 0.6)',
                transition: 'width 0.2s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 12 - 8,
                left: `calc(${((config.lightDistance - 2) / 6) * 100}% - 8px)`,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 ${hoveredKnob === 'distance' ? 16 : 8}px rgba(137, 207, 240, 0.8)`,
                transform: `scale(${hoveredKnob === 'distance' ? 1.2 : 1})`,
                transition: 'all 0.15s ease',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              color: '#666',
              fontSize: 11,
            }}
          >
            <span>2</span>
            <span>8</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <h4
            style={{
              color: '#89CFF0',
              fontSize: 12,
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            操作提示
          </h4>
          <ul
            style={{
              color: '#aaa',
              fontSize: 11,
              lineHeight: 1.8,
              paddingLeft: 16,
              listStyle: 'disc',
            }}
          >
            <li>鼠标拖拽旋转视角</li>
            <li>滚轮缩放</li>
            <li>Shift + 拖拽平移</li>
            <li>点击彩色光线查看信息</li>
          </ul>
        </div>
      </div>
    </>
  );
};
