import { useState, useCallback } from 'react';
import CharAnimator, { type AnimationType } from './CharAnimator';
import AnimationControls from './AnimationControls';

const MAX_CHAR_LENGTH = 50;

export default function App() {
  const [text, setText] = useState<string>('Hello World');
  const [animationType, setAnimationType] = useState<AnimationType>('fadeIn');
  const [duration, setDuration] = useState<number>(0.5);
  const [charDelay, setCharDelay] = useState<number>(0.06);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);

  const chars = text.split('');
  const isOverLimit = text.length > MAX_CHAR_LENGTH;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleAnimationTypeChange = useCallback((type: AnimationType) => {
    setAnimationType(type);
    setAnimationKey((prev) => prev + 1);
    setIsPlaying(true);
  }, []);

  const handlePlay = useCallback(() => {
    setAnimationKey((prev) => prev + 1);
    setIsPlaying(true);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setAnimationKey((prev) => prev + 1);
  }, []);

  const handleDurationChange = useCallback((value: number) => {
    setDuration(value);
  }, []);

  const handleCharDelayChange = useCallback((value: number) => {
    setCharDelay(value);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        padding: '40px 20px',
        minWidth: '1024px',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1
          style={{
            textAlign: 'center',
            fontSize: '32px',
            fontWeight: 700,
            color: '#1F2937',
            marginBottom: '8px',
          }}
        >
          文字动画排版工具
        </h1>
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '32px',
          }}
        >
          输入英文文本，选择动画效果，打造精美的动态排版
        </p>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '10px',
              }}
            >
              输入文本
            </label>
            <div style={{ width: '70%', margin: '0 auto' }}>
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                placeholder="请输入英文单词或短句..."
                maxLength={100}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isOverLimit ? '#FF4444' : '#D1D5DB'}`,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!isOverLimit) {
                    e.target.style.borderColor = '#6C63FF';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isOverLimit ? '#FF4444' : '#D1D5DB';
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {isOverLimit ? (
                  <span style={{ fontSize: '13px', color: '#FF4444' }}>
                    字符数已超过限制（最多{MAX_CHAR_LENGTH}个字符）
                  </span>
                ) : (
                  <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    最多{MAX_CHAR_LENGTH}个字符
                  </span>
                )}
                <span style={{ fontSize: '13px', color: isOverLimit ? '#FF4444' : '#6B7280' }}>
                  {text.length}/{MAX_CHAR_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '100%',
              height: '280px',
              backgroundColor: '#F5F5F5',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '20px',
              boxSizing: 'border-box',
              perspective: '1000px',
            }}
          >
            {text.length > 0 && !isOverLimit ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                {chars.map((char, index) => (
                  <CharAnimator
                    key={`${animationKey}-${index}`}
                    char={char}
                    animationType={animationType}
                    delay={index * charDelay}
                    duration={duration}
                    isPlaying={isPlaying}
                    animationKey={animationKey}
                  />
                ))}
              </div>
            ) : isOverLimit ? (
              <span style={{ fontSize: '16px', color: '#FF4444' }}>
                请减少字符数以继续预览
              </span>
            ) : (
              <span style={{ fontSize: '16px', color: '#9CA3AF' }}>
                请输入文字开始预览
              </span>
            )}
          </div>
        </div>

        <AnimationControls
          animationType={animationType}
          onAnimationTypeChange={handleAnimationTypeChange}
          duration={duration}
          onDurationChange={handleDurationChange}
          charDelay={charDelay}
          onCharDelayChange={handleCharDelayChange}
          onPlay={handlePlay}
          onReset={handleReset}
          isPlaying={isPlaying}
        />
      </div>
    </div>
  );
}
