import React from 'react';
import useDiceAnimation from '@/hooks/useAnimation';

interface DiceRollProps {
  onRoll: () => void;
  isRolling: boolean;
  diceValue: number | null;
  disabled: boolean;
}

const renderDots = (faceValue: number): React.ReactNode => {
  const dotStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: 'black',
  };

  const faceStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 8,
    boxSizing: 'border-box',
  };

  switch (faceValue) {
    case 1:
      return (
        <div style={{ ...faceStyle, justifyContent: 'center', alignItems: 'center' }}>
          <div style={dotStyle} />
        </div>
      );
    case 2:
      return (
        <div style={{ ...faceStyle, justifyContent: 'space-between' }}>
          <div style={{ ...dotStyle, alignSelf: 'flex-start' }} />
          <div style={{ ...dotStyle, alignSelf: 'flex-end' }} />
        </div>
      );
    case 3:
      return (
        <div style={{ ...faceStyle, justifyContent: 'space-between' }}>
          <div style={{ ...dotStyle, alignSelf: 'flex-start' }} />
          <div style={{ ...dotStyle, alignSelf: 'center' }} />
          <div style={{ ...dotStyle, alignSelf: 'flex-end' }} />
        </div>
      );
    case 4:
      return (
        <div style={{ ...faceStyle, justifyContent: 'space-between', alignContent: 'space-between' }}>
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
        </div>
      );
    case 5:
      return (
        <div style={{ ...faceStyle, justifyContent: 'space-between', alignContent: 'space-between' }}>
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={dotStyle} />
          </div>
          <div style={dotStyle} />
          <div style={dotStyle} />
        </div>
      );
    case 6:
      return (
        <div style={{ ...faceStyle, justifyContent: 'space-between', alignContent: 'space-between' }}>
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
          <div style={dotStyle} />
        </div>
      );
    default:
      return null;
  }
};

const DiceRoll: React.FC<DiceRollProps> = ({ onRoll, isRolling, diceValue, disabled }) => {
  const { rotationX, rotationY, squeezeScale } = useDiceAnimation(isRolling, onRoll);

  const handleClick = () => {
    if (!disabled && !isRolling) {
      onRoll();
    }
  };

  const containerStyle: React.CSSProperties = {
    perspective: 600,
    width: 60,
    height: 60,
    margin: 'auto',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.3s, transform 0.2s',
    ...(disabled ? {} : { transform: 'scale(1)' }),
  };

  const hoverStyle: React.CSSProperties = disabled
    ? {}
    : {
        transform: 'scale(1.05)',
      };

  const [isHovered, setIsHovered] = React.useState(false);

  const cubeWrapperStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    width: 60,
    height: 60,
    position: 'relative',
    transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${squeezeScale})`,
    transition: isRolling ? 'none' : 'transform 0.5s ease-out',
  };

  const faceBaseStyle: React.CSSProperties = {
    width: 60,
    height: 60,
    position: 'absolute',
    borderRadius: 8,
    border: '2px solid #ccc',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  };

  const faces = [
    { value: 1, transform: 'translateZ(30px)' },
    { value: 6, transform: 'rotateY(180deg) translateZ(30px)' },
    { value: 3, transform: 'rotateY(90deg) translateZ(30px)' },
    { value: 4, transform: 'rotateY(-90deg) translateZ(30px)' },
    { value: 2, transform: 'rotateX(90deg) translateZ(30px)' },
    { value: 5, transform: 'rotateX(-90deg) translateZ(30px)' },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          ...containerStyle,
          ...(isHovered && !disabled ? hoverStyle : {}),
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={cubeWrapperStyle}>
          {faces.map((face, index) => (
            <div key={index} style={{ ...faceBaseStyle, transform: face.transform }}>
              {renderDots(face.value)}
            </div>
          ))}
        </div>
      </div>
      {diceValue !== null && !isRolling && (
        <div style={{ color: 'white', fontSize: 14, marginTop: 8 }}>
          点数: {diceValue}
        </div>
      )}
    </div>
  );
};

export default DiceRoll;
