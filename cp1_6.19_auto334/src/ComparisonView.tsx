import { SceneCanvas } from './Scene3D';
import { useAppStore, comparisonDefaultParams } from './store';

interface ComparisonViewProps {
  glRef: React.MutableRefObject<THREE.WebGLRenderer | null>;
}

export default function ComparisonView({ glRef }: ComparisonViewProps) {
  const { capturedParams, geometryType } = useAppStore();

  if (!capturedParams) return null;

  return (
    <div style={styles.container}>
      <div style={styles.viewContainer}>
        <div style={styles.viewLabel}>当前参数</div>
        <SceneCanvas
          glRef={glRef}
          overrideMaterial={capturedParams}
          overrideGeometry={geometryType}
        />
      </div>
      <div style={styles.divider} />
      <div style={styles.viewContainer}>
        <div style={styles.viewLabelRight}>默认材质</div>
        <SceneCanvas
          overrideMaterial={comparisonDefaultParams}
          overrideGeometry={geometryType}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    animation: 'slideIn 0.5s ease',
  },
  viewContainer: {
    flex: 1,
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
  },
  divider: {
    width: '2px',
    background: 'linear-gradient(to bottom, transparent, #64B5F6, transparent)',
    flexShrink: 0,
  },
  viewLabel: {
    position: 'absolute',
    top: '60px',
    left: '20px',
    background: 'rgba(30, 30, 40, 0.8)',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#64B5F6',
    fontWeight: 600,
    zIndex: 10,
    border: '1px solid rgba(100, 181, 246, 0.3)',
  },
  viewLabelRight: {
    position: 'absolute',
    top: '60px',
    right: '20px',
    background: 'rgba(30, 30, 40, 0.8)',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#808080',
    fontWeight: 600,
    zIndex: 10,
    border: '1px solid rgba(100, 181, 246, 0.2)',
  },
};


