import { useRef, useEffect } from 'react';
import { useNebulaStore } from '@/store/nebulaStore';
import { Slider } from './Slider';
import { ColorPicker } from './ColorPicker';
import { PresetSelector } from './PresetSelector';
import { captureScreenshotWithUiToggle } from './Screenshot';
import * as THREE from 'three';
import { CameraIcon, Sparkles, Palette, Settings } from 'lucide-react';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}

export function ControlPanel({ rendererRef, sceneRef, cameraRef }: ControlPanelProps) {
  const density = useNebulaStore((state) => state.density);
  const turbulence = useNebulaStore((state) => state.turbulence);
  const colorMode = useNebulaStore((state) => state.colorMode);
  const setDensity = useNebulaStore((state) => state.setDensity);
  const setTurbulence = useNebulaStore((state) => state.setTurbulence);
  const setColorMode = useNebulaStore((state) => state.setColorMode);
  const setUiVisible = useNebulaStore((state) => state.setUiVisible);
  const uiVisible = useNebulaStore((state) => state.uiVisible);
  const currentFPS = useNebulaStore((state) => state.currentFPS);
  const particleScale = useNebulaStore((state) => state.particleScale);
  const setParticleScale = useNebulaStore((state) => state.setParticleScale);

  const lowFpsCountRef = useRef(0);
  const highFpsCountRef = useRef(0);

  useEffect(() => {
    if (currentFPS < 45 && particleScale === 1.0) {
      lowFpsCountRef.current += 1;
      highFpsCountRef.current = 0;
      if (lowFpsCountRef.current >= 3) {
        setParticleScale(0.7);
        lowFpsCountRef.current = 0;
      }
    } else if (currentFPS >= 55 && particleScale < 1.0) {
      highFpsCountRef.current += 1;
      lowFpsCountRef.current = 0;
      if (highFpsCountRef.current >= 5) {
        setParticleScale(1.0);
        highFpsCountRef.current = 0;
      }
    } else {
      lowFpsCountRef.current = Math.max(0, lowFpsCountRef.current - 0.5);
      highFpsCountRef.current = Math.max(0, highFpsCountRef.current - 0.5);
    }
  }, [currentFPS, particleScale, setParticleScale]);

  const handleScreenshot = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    try {
      await captureScreenshotWithUiToggle(
        rendererRef.current,
        sceneRef.current,
        cameraRef.current,
        setUiVisible,
        {
          width: 1920,
          height: 1080,
          filename: `nebula-${Date.now()}.png`,
        }
      );
    } catch (e) {
      console.error('Screenshot failed:', e);
      setUiVisible(true);
    }
  };

  if (!uiVisible) return null;

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.title}>星云工作室</h1>
        <p className={styles.subtitle}>3D 星云形态生成器</p>
      </div>

      <PresetSelector />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Settings size={16} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>形态参数</h2>
        </div>
        <Slider
          label="密度"
          value={density}
          min={0.1}
          max={1.0}
          step={0.01}
          onChange={setDensity}
        />
        <Slider
          label="湍流度"
          value={turbulence}
          min={0}
          max={100}
          step={1}
          onChange={setTurbulence}
          unit="%"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Palette size={16} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>颜色映射</h2>
        </div>
        <ColorPicker value={colorMode} onChange={setColorMode} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Sparkles size={16} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>动态效果</h2>
        </div>
        <p className={styles.hint}>
          星云内部粒子发射器模拟恒星形成区域的气体喷流，粒子寿命 2-5 秒
        </p>
      </div>

      <div className={styles.buttonSection}>
        <button className={styles.screenshotBtn} onClick={handleScreenshot}>
          <CameraIcon size={20} />
          <span>导出高清截图</span>
        </button>
        <p className={styles.resolutionHint}>1920 × 1080 PNG</p>
      </div>
    </div>
  );
}

export default ControlPanel;
