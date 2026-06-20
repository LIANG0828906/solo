import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button, Space, message, Tooltip } from 'antd';
import {
  CameraOutlined,
  ReloadOutlined,
  ExportOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import * as THREE from 'three';
import ControlPanel from './components/ControlPanel';
import NebulaScene from './components/NebulaScene';
import { useNebulaStore, defaultParams, NebulaParams } from './store/useNebulaStore';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const params = useNebulaStore((s) => s.params);
  const resetParams = useNebulaStore((s) => s.resetParams);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleSnapshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      messageApi.error('找不到3D画布');
      return;
    }

    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `nebula-snapshot-${timestamp}.png`;
      link.href = dataURL;
      link.click();
      messageApi.success('快照已保存为 PNG 图片');
    } catch (err) {
      messageApi.error('保存快照失败');
    }
  }, [messageApi]);

  const handleReset = useCallback(() => {
    resetParams();
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    messageApi.info('参数已重置为默认值');
  }, [resetParams, messageApi]);

  const handleExportParams = useCallback(() => {
    const exportData = {
      id: uuidv4(),
      name: `星云配置-${new Date().toLocaleString()}`,
      exportedAt: new Date().toISOString(),
      params: params
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `nebula-params-${timestamp}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    messageApi.success('参数配置已导出为 JSON 文件');
  }, [params, messageApi]);

  const setCameraView = useCallback((type: 'top' | 'side' | 'reset') => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (type) {
      case 'top':
        camera.position.set(0, 150, 0.01);
        camera.up.set(0, 1, 0);
        controls.target.set(0, 0, 0);
        break;
      case 'side':
        camera.position.set(150, 0, 0);
        camera.up.set(0, 1, 0);
        controls.target.set(0, 0, 0);
        break;
      case 'reset':
        camera.position.set(0, 40, 120);
        camera.up.set(0, 1, 0);
        controls.target.set(0, 0, 0);
        break;
    }

    controls.update();
    messageApi.info(
      type === 'top' ? '切换到俯视视角' : type === 'side' ? '切换到侧视视角' : '视角已复位'
    );
  }, [messageApi]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D0D2B',
        position: 'relative'
      }}
    >
      {contextHolder}

      {/* 顶部工具栏 */}
      <div
        style={{
          height: 50,
          minHeight: 50,
          background: '#1A1A2E',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 2px 16px rgba(0, 212, 255, 0.08)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00D4FF 0%, #8800FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(0, 212, 255, 0.4)'
            }}
          >
            <span style={{ fontSize: 16 }}>🌌</span>
          </div>
          <div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 0.5
              }}
            >
              3D星云生成器
            </div>
            <div
              style={{
                color: '#607D8B',
                fontSize: 10,
                letterSpacing: 1
              }}
            >
              NEBULA EDITOR v1.0
            </div>
          </div>
        </div>

        <Space size={10}>
          <Tooltip title="保存当前画面快照 (PNG)">
            <Button
              icon={<CameraOutlined />}
              onClick={handleSnapshot}
              style={{
                background: '#1A1A2E',
                color: '#00D4FF',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                height: 36,
                padding: '0 16px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#00D4FF';
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00D4FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#1A1A2E';
                (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 212, 255, 0.4)';
              }}
            >
              快照
            </Button>
          </Tooltip>

          <Tooltip title="重置所有参数为默认值">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{
                background: '#1A1A2E',
                color: '#00D4FF',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                height: 36,
                padding: '0 16px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#00D4FF';
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00D4FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#1A1A2E';
                (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 212, 255, 0.4)';
              }}
            >
              重置
            </Button>
          </Tooltip>

          <Tooltip title="导出当前参数配置为JSON">
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportParams}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(136, 0, 255, 0.2))',
                color: '#00D4FF',
                border: '1px solid rgba(0, 212, 255, 0.6)',
                height: 36,
                padding: '0 16px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #00D4FF, #8800FF)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00D4FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(136, 0, 255, 0.2))';
                (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 212, 255, 0.6)';
              }}
            >
              导出参数
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 控制面板 */}
        <ControlPanel />

        {/* 3D场景容器 */}
        <div style={{ flex: 1, position: 'relative' }}>
          <NebulaScene
            cameraRef={cameraRef}
            controlsRef={controlsRef}
            autoRotate={params.autoRotate}
            autoRotateSpeed={params.autoRotateSpeed}
          />

          {/* 粒子统计信息 */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(26, 26, 46, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              borderRadius: 8,
              padding: '10px 16px',
              display: 'flex',
              gap: 24,
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            <div>
              <div style={{ color: '#607D8B', fontSize: 10, letterSpacing: 1 }}>粒子数量</div>
              <div style={{ color: '#00D4FF', fontSize: 16, fontWeight: 700 }}>
                {params.particleCount.toLocaleString()}
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(0, 212, 255, 0.2)' }} />
            <div>
              <div style={{ color: '#607D8B', fontSize: 10, letterSpacing: 1 }}>星云形状</div>
              <div style={{ color: '#00D4FF', fontSize: 16, fontWeight: 700 }}>
                {params.shape === 'sphere' ? '球状' : '螺旋'}
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(0, 212, 255, 0.2)' }} />
            <div>
              <div style={{ color: '#607D8B', fontSize: 10, letterSpacing: 1 }}>色调角度</div>
              <div style={{ color: '#00D4FF', fontSize: 16, fontWeight: 700 }}>
                {(params.hue * 360).toFixed(0)}°
              </div>
            </div>
          </div>

          {/* 视角切换按钮 */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              background: 'rgba(26, 26, 46, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              borderRadius: 10,
              padding: 8,
              display: 'flex',
              gap: 6,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              zIndex: 5
            }}
          >
            <Tooltip title="俯视视角">
              <Button
                icon={<VerticalAlignTopOutlined />}
                onClick={() => setCameraView('top')}
                shape="circle"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(0, 212, 255, 0.08)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  fontSize: 16
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#00D4FF';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 212, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                }}
              />
            </Tooltip>

            <Tooltip title="侧视视角">
              <Button
                icon={<VerticalAlignMiddleOutlined />}
                onClick={() => setCameraView('side')}
                shape="circle"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(0, 212, 255, 0.08)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  fontSize: 16
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#00D4FF';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 212, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                }}
              />
            </Tooltip>

            <Tooltip title="复位视角">
              <Button
                icon={<HomeOutlined />}
                onClick={() => setCameraView('reset')}
                shape="circle"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(0, 212, 255, 0.08)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  transition: 'all 0.2s ease',
                  fontSize: 16
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#00D4FF';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 212, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF';
                }}
              />
            </Tooltip>
          </div>

          {/* FPS 显示 */}
          <FPSCounter />
        </div>
      </div>
    </div>
  );
};

const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(60);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let rafId: number;

    const loop = () => {
      framesRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastTimeRef.current = now;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const fpsColor = fps >= 45 ? '#00FF88' : fps >= 25 ? '#FFAA00' : '#FF4444';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        background: 'rgba(26, 26, 46, 0.6)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${fpsColor}40`,
        borderRadius: 10,
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: fpsColor,
          boxShadow: `0 0 8px ${fpsColor}`
        }}
      />
      <div style={{ color: '#607D8B', fontSize: 10, letterSpacing: 1 }}>FPS</div>
      <div style={{ color: fpsColor, fontSize: 16, fontWeight: 700, minWidth: 28 }}>{fps}</div>
    </div>
  );
};

export default App;
