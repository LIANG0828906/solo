import { useEffect, useState } from 'react';
import type { HSLColor } from '@/modules/colorEngine/colorSpace';
import { hslToHex } from '@/modules/colorEngine/colorSpace';

interface ColorBlockProps {
  targetColor: HSLColor;
  userColor: HSLColor | null;
  deltaE: number | null;
  feedback: 'perfect' | 'close' | 'tryAgain' | null;
  index: number;
  isActive: boolean;
}

export default function ColorBlock({ targetColor, userColor, deltaE, feedback, index, isActive }: ColorBlockProps) {
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (feedback === 'perfect') {
      setAnimClass('animate-gold-pulse');
      const timer = setTimeout(() => setAnimClass(''), 500);
      return () => clearTimeout(timer);
    } else if (feedback === 'close') {
      setAnimClass('animate-blue-pulse');
    } else {
      setAnimClass('');
    }
  }, [feedback]);

  const targetHex = hslToHex(targetColor.h, targetColor.s, targetColor.l);
  const userHex = userColor ? hslToHex(userColor.h, userColor.s, userColor.l) : '#e0dcd4';

  const getBorderStyle = () => {
    if (feedback === 'tryAgain') return '2px dashed #FF6B6B';
    if (isActive && !userColor) return '2px solid #4ECDC4';
    return '2px solid transparent';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ fontSize: 12, color: '#999' }}>#{index + 1}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div
          className={animClass}
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            background: targetHex,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            border: '2px solid transparent',
          }}
        />
        <div style={{ fontSize: 18, color: '#bbb' }}>→</div>
        <div
          className={animClass}
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            background: userHex,
            boxShadow: feedback === 'close'
              ? '0 0 15px 5px rgba(100,149,237,0.4)'
              : 'inset 0 1px 3px rgba(0,0,0,0.1)',
            border: getBorderStyle(),
          }}
        />
      </div>
      {deltaE !== null && (
        <div style={{
          fontSize: 11,
          color: feedback === 'perfect' ? '#d4a017' : feedback === 'close' ? '#6495ed' : '#FF6B6B',
        }}>
          {feedback === 'perfect' ? '完美匹配' : feedback === 'close' ? '接近' : '继续努力'}
          <span style={{ marginLeft: 4, opacity: 0.7 }}>ΔE={deltaE.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
