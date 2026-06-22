import { Footprints, RotateCcw, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../styles/ui.module.css';

export interface HUDPanelProps {
  levelId: number;
  totalLevels: number;
  levelName: string;
  steps: number;
  selectedMechanismType: string | null;
  selectedMechanismRotation: number;
  onReset: () => void;
  onNextLevel?: () => void;
  onAngleChange?: (deg: number) => void;
  isMobile: boolean;
  isPathBroken: boolean;
  isLevelComplete?: boolean;
}

const mechanismTypeLabels: Record<string, string> = {
  mirror: '反射镜',
  prism: '棱镜',
  splitter: '半透明挡板',
};

export function HUDPanel({
  levelId,
  totalLevels,
  levelName,
  steps,
  selectedMechanismType,
  selectedMechanismRotation,
  onReset,
  onNextLevel,
  onAngleChange,
  isMobile,
  isPathBroken,
  isLevelComplete,
}: HUDPanelProps) {
  const mechanismLabel = selectedMechanismType
    ? mechanismTypeLabels[selectedMechanismType] ?? selectedMechanismType
    : null;

  return (
    <div
      className={clsx(
        'glass-panel',
        styles.hudPanel,
        isPathBroken && 'path-broken'
      )}
    >
      <div className={styles.hudHeader}>
        <div className={styles.levelBadge}>
          关卡 {levelId} / {totalLevels} · {levelName}
        </div>
        <div className={styles.stepsText}>
          <Footprints size={16} />
          {steps}
        </div>
      </div>

      <div className={styles.hudContent}>
        <div className={styles.buttonRow}>
          <button className="btn" onClick={onReset}>
            <RotateCcw size={16} />
            重置
          </button>
          {isLevelComplete && onNextLevel && levelId < totalLevels && (
            <button className="btn btn-primary" onClick={onNextLevel}>
              下一关
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {selectedMechanismType && onAngleChange && !isMobile && (
          <div className={styles.angleSliderContainer}>
            <div className={styles.angleLabel}>
              <span>{mechanismLabel}</span>
              <span className={styles.angleValue}>{selectedMechanismRotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={selectedMechanismRotation}
              onChange={(e) => onAngleChange(Number(e.target.value))}
              className={styles.sliderInput}
            />
          </div>
        )}

        <div
          className={clsx(
            styles.controlsHint,
            isPathBroken && styles.controlsHintError
          )}
        >
          {isPathBroken ? (
            <>⚠ 路径中断 · 已自动恢复</>
          ) : isMobile ? (
            <>点击选中机关 · 底部拨盘调整角度</>
          ) : (
            <>点击选中机关 · 滚轮调整角度 · 右键/ESC取消</>
          )}
        </div>
      </div>
    </div>
  );
}

export default HUDPanel;
