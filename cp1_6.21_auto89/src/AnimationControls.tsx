import type { AnimationType } from './CharAnimator';

interface AnimationControlsProps {
  animationType: AnimationType;
  onAnimationTypeChange: (type: AnimationType) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  charDelay: number;
  onCharDelayChange: (delay: number) => void;
  onPlay: () => void;
  onReset: () => void;
  isPlaying: boolean;
}

const animationOptions: { value: AnimationType; label: string }[] = [
  { value: 'fadeIn', label: '淡入' },
  { value: 'bounce', label: '弹跳' },
  { value: 'rotate', label: '旋转' },
  { value: 'flip', label: '翻转' },
  { value: 'slideIn', label: '滑入' },
  { value: 'scale', label: '缩放' },
];

export default function AnimationControls({
  animationType,
  onAnimationTypeChange,
  duration,
  onDurationChange,
  charDelay,
  onCharDelayChange,
  onPlay,
  onReset,
  isPlaying,
}: AnimationControlsProps) {
  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '10px',
          }}
        >
          预设动画
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px',
          }}
        >
          {animationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onAnimationTypeChange(option.value)}
              style={{
                padding: '10px 8px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor:
                  animationType === option.value ? '#6C63FF' : '#F3F4F6',
                color: animationType === option.value ? '#FFFFFF' : '#4B5563',
                transform: animationType === option.value ? 'scale(1.02)' : 'scale(1)',
                boxShadow:
                  animationType === option.value
                    ? '0 2px 8px rgba(108, 99, 255, 0.3)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                if (animationType !== option.value) {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }
              }}
              onMouseLeave={(e) => {
                if (animationType !== option.value) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              动画持续时间
            </label>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#6C63FF',
                backgroundColor: '#EEF2FF',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {duration.toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={duration}
            onChange={(e) => onDurationChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #6C63FF 0%, #8B5CF6 ${((duration - 0.2) / 1.8) * 100}%, #E5E7EB ${((duration - 0.2) / 1.8) * 100}%, #E5E7EB 100%)`,
              appearance: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: linear-gradient(135deg, #6C63FF, #8B5CF6);
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(108, 99, 255, 0.4);
              transition: transform 0.2s ease;
            }
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: linear-gradient(135deg, #6C63FF, #8B5CF6);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(108, 99, 255, 0.4);
            }
          `}</style>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              字符间延迟
            </label>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#6C63FF',
                backgroundColor: '#EEF2FF',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {charDelay.toFixed(2)}s
            </span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.2"
            step="0.01"
            value={charDelay}
            onChange={(e) => onCharDelayChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #6C63FF 0%, #8B5CF6 ${((charDelay - 0.02) / 0.18) * 100}%, #E5E7EB ${((charDelay - 0.02) / 0.18) * 100}%, #E5E7EB 100%)`,
              appearance: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button
          onClick={onPlay}
          style={{
            width: '120px',
            height: '44px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '15px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            filter: 'hue-rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'hue-rotate(5deg)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'hue-rotate(0deg)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          播放
        </button>
        <button
          onClick={onReset}
          style={{
            width: '120px',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #D1D5DB',
            fontSize: '15px',
            fontWeight: 600,
            color: '#4B5563',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6C63FF';
            e.currentTarget.style.color = '#6C63FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.color = '#4B5563';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}
