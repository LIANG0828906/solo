import React from 'react';

interface PixelIconProps {
  type: string;
  color: string;
  accentColor: string;
  size?: number;
  className?: string;
}

const PixelIcon: React.FC<PixelIconProps> = ({ type, color, accentColor, size = 32, className = '' }) => {
  const pixelSize = size / 8;
  
  const renderPixels = (pattern: string[]) => {
    const pixels: JSX.Element[] = [];
    pattern.forEach((row, rowIndex) => {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const char = row[colIndex];
        if (char === '1' || char === '2') {
          const pixelColor = char === '1' ? color : accentColor;
          pixels.push(
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                position: 'absolute',
                left: colIndex * pixelSize,
                top: rowIndex * pixelSize,
                width: pixelSize,
                height: pixelSize,
                backgroundColor: pixelColor,
              }}
            />
          );
        }
      }
    });
    return pixels;
  };
  
  const patterns: Record<string, string[]> = {
    stone: [
      '00111100',
      '01122110',
      '11222211',
      '12222221',
      '12222221',
      '11222211',
      '01122110',
      '00111100',
    ],
    wood: [
      '00111100',
      '01222210',
      '11211211',
      '12211221',
      '12211221',
      '11211211',
      '01222210',
      '00111100',
    ],
    iron: [
      '00111100',
      '01222210',
      '12212211',
      '12122221',
      '12222121',
      '11221221',
      '01222210',
      '00111100',
    ],
    crystal: [
      '00011000',
      '00122100',
      '01222210',
      '12211221',
      '12122121',
      '01222210',
      '00122100',
      '00011000',
    ],
    sword: [
      '00011000',
      '00122100',
      '00122100',
      '00122100',
      '00122100',
      '01211210',
      '01122110',
      '00022000',
    ],
    axe: [
      '01111100',
      '12222110',
      '12221110',
      '12211000',
      '01121000',
      '00021000',
      '00021000',
      '00011000',
    ],
    shield: [
      '01111110',
      '12222221',
      '12211221',
      '12211221',
      '12222221',
      '01222210',
      '00122100',
      '00011000',
    ],
    staff: [
      '00011000',
      '00122100',
      '01222210',
      '00122100',
      '00021000',
      '00021000',
      '00021000',
      '00011000',
    ],
    armor: [
      '01111110',
      '12211221',
      '12122121',
      '12222221',
      '12222221',
      '12222221',
      '01222210',
      '00111100',
    ],
    potion: [
      '00011000',
      '00022000',
      '00122100',
      '01222210',
      '12222221',
      '12222221',
      '01222210',
      '00111100',
    ],
    gem: [
      '00111100',
      '01222210',
      '12211221',
      '12122121',
      '12211221',
      '01222210',
      '00122100',
      '00011000',
    ],
    ingot: [
      '00000000',
      '01111110',
      '12222221',
      '12211221',
      '12222221',
      '01222210',
      '00111100',
      '00000000',
    ],
  };
  
  const pattern = patterns[type] || patterns.stone;
  
  return (
    <div
      className={`item-icon ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      {renderPixels(pattern)}
    </div>
  );
};

export default PixelIcon;
