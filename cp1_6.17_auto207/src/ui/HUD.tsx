import { useGameStore } from '../store/gameStore';
import type { GradeType, HitResult } from '../types';

interface HUDProps {
  canvasWidth: number;
}

export function HUD({ canvasWidth }: HUDProps) {
  const {
    score,
    syncRate,
    currentLevel,
    beatHighlight,
    showGrade,
    currentGrade,
    playerActionResult,
    combo
  } = useGameStore();

  const getSyncColor = (): string => {
    if (syncRate >= 90) return '#6BCB77';
    if (syncRate >= 70) return '#FFD93D';
    return '#FF6B6B';
  };

  const getGradeColor = (grade: GradeType | null): string => {
    switch (grade) {
      case 'S': return '#6BCB77';
      case 'A': return '#FFD93D';
      case 'B': return '#FF9F43';
      case 'C': return '#FF6B6B';
      default: return '#FFFFFF';
    }
  };

  const getHitText = (result: HitResult): string => {
    switch (result) {
      case 'perfect': return 'PERFECT!';
      case 'good': return 'GOOD';
      case 'miss': return 'MISS';
      default: return '';
    }
  };

  const getHitColor = (result: HitResult): string => {
    switch (result) {
      case 'perfect': return '#6BCB77';
      case 'good': return '#FFD93D';
      case 'miss': return '#FF6B6B';
      default: return '#FFFFFF';
    }
  };

  const beatBarWidth = Math.min(320, canvasWidth - 40);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: canvasWidth,
      height: '100%',
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 10,
        borderBottom: '1px solid rgba(83, 82, 237, 0.3)'
      }}>
        <div style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {currentLevel?.name || 'Pixel Runner'}
        </div>

        <div style={{
          position: 'relative',
          width: 60,
          height: 60
        }}>
          <svg width={60} height={60} style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle
              cx={30}
              cy={30}
              r={26}
              fill="rgba(0, 0, 0, 0.27)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={4}
            />
            <circle
              cx={30}
              cy={30}
              r={26}
              fill="none"
              stroke={getSyncColor()}
              strokeWidth={4}
              strokeDasharray={`${(syncRate / 100) * 163.4} 163.4`}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              style={{ transition: 'stroke 300ms ease-out, stroke-dasharray 300ms ease-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#FFFFFF',
            fontSize: 18,
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            textShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}>
            {score}
          </div>
        </div>

        <div style={{
          color: '#FFD700',
          fontSize: 16,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
          minWidth: 60,
          textAlign: 'right'
        }}>
          {score}
        </div>
      </div>

      {combo > 2 && (
        <div style={{
          position: 'absolute',
          top: 70,
          right: 20,
          color: '#FFD93D',
          fontSize: 20,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255, 217, 61, 0.8)',
          animation: 'pulse 200ms ease-out'
        }}>
          {combo} COMBO
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        transition: 'opacity 200ms ease-out',
        opacity: playerActionResult ? 1 : 0
      }}>
        <div style={{
          color: getHitColor(playerActionResult),
          fontSize: 28,
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          textShadow: `0 0 12px ${getHitColor(playerActionResult)}`
        }}>
          {getHitText(playerActionResult)}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        width: beatBarWidth,
        height: 6,
        background: '#2A2A3A',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 212, 255, 0.2)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: beatHighlight ? 20 : 0,
          height: 6,
          background: '#FFD93D',
          borderRadius: 3,
          boxShadow: '0 0 8px #FFD93D',
          transition: 'width 200ms ease-out, opacity 200ms ease-out',
          opacity: beatHighlight ? 1 : 0
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          height: 6,
          background: 'rgba(255, 255, 255, 0.3)'
        }} />
      </div>

      {showGrade && currentGrade && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'gradeAppear 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
          <div style={{
            fontSize: 120,
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            color: getGradeColor(currentGrade),
            textShadow: `0 0 30px ${getGradeColor(currentGrade)}, 0 0 60px ${getGradeColor(currentGrade)}`,
            WebkitTextStroke: '2px rgba(255,255,255,0.3)'
          }}>
            {currentGrade}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes gradeAppear {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          60% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(0.95); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
