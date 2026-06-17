interface DecorationIllustrationProps {
  type: string;
  color: string;
  width?: number;
  height?: number;
}

export function DecorationIllustration({ type, color, width = 420, height = 140 }: DecorationIllustrationProps) {
  const renderDecoration = () => {
    const id = `deco-${type}-${color.replace('#', '')}`;
    
    switch (type) {
      case 'willow':
        return (
          <>
            <defs>
              <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={color} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {[...Array(5)].map((_, i) => (
              <g key={i} transform={`translate(${60 + i * 80}, 0)`}>
                <path
                  d={`M15 0 Q 10 ${40 + i * 15} 20 ${70 + i * 10}`}
                  stroke={color}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.7 - i * 0.1}
                />
                <ellipse cx="18" cy={75 + i * 10} rx="4" ry="8" fill={color} opacity={0.5 - i * 0.08} />
              </g>
            ))}
          </>
        );
      case 'lotus':
        return (
          <>
            <ellipse cx={width / 2} cy="110" rx="120" ry="20" fill={color} opacity="0.2" />
            {[...Array(7)].map((_, i) => {
              const angle = -60 + i * 20;
              const rad = (angle * Math.PI) / 180;
              const x = width / 2 + Math.sin(rad) * 50;
              const y = 80 - Math.cos(rad) * 40;
              return (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx="15"
                  ry="35"
                  fill={color}
                  opacity={0.4 + Math.abs(angle) / 100}
                  transform={`rotate(${angle}, ${x}, ${y + 30})`}
                />
              );
            })}
            <circle cx={width / 2} cy="95" r="12" fill="#FFD54F" opacity="0.8" />
          </>
        );
      case 'flower':
        return (
          <>
            {[...Array(6)].map((_, i) => {
              const cx = 60 + (i % 3) * 140;
              const cy = 30 + Math.floor(i / 3) * 50;
              const size = 25 + (i % 3) * 8;
              return (
                <g key={i} opacity={0.6 - i * 0.08}>
                  {[...Array(5)].map((_, j) => {
                    const angle = (j * 72 - 90) * Math.PI / 180;
                    const px = cx + Math.cos(angle) * size * 0.5;
                    const py = cy + Math.sin(angle) * size * 0.5;
                    return <circle key={j} cx={px} cy={py} r={size * 0.45} fill={color} opacity="0.5" />;
                  })}
                  <circle cx={cx} cy={cy} r={size * 0.3} fill="#FFD54F" opacity="0.8" />
                </g>
              );
            })}
          </>
        );
      case 'sun':
        return (
          <>
            <defs>
              <radialGradient id={id}>
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </radialGradient>
            </defs>
            <circle cx={width / 2} cy="60" r="50" fill={`url(#${id})`} />
            <circle cx={width / 2} cy="60" r="25" fill={color} opacity="0.7" />
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              const x1 = width / 2 + Math.cos(angle) * 32;
              const y1 = 60 + Math.sin(angle) * 32;
              const x2 = width / 2 + Math.cos(angle) * 45;
              const y2 = 60 + Math.sin(angle) * 45;
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              );
            })}
          </>
        );
      case 'moon':
        return (
          <>
            <defs>
              <radialGradient id={id}>
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </radialGradient>
            </defs>
            <circle cx={width * 0.7} cy="50" r="55" fill={`url(#${id})`} />
            <path
              d={`M${width * 0.7 + 15} 20 A 40 40 0 1 0 ${width * 0.7 + 15} 90 A 30 35 0 1 1 ${width * 0.7 + 15} 20 Z`}
              fill={color}
              opacity="0.7"
            />
            {[...Array(15)].map((_, i) => (
              <circle
                key={i}
                cx={20 + (i * 27) % width}
                cy={15 + (i * 13) % 80}
                r={1 + (i % 3)}
                fill="#FFF7ED"
                opacity={0.6 - (i % 5) * 0.1}
              />
            ))}
          </>
        );
      case 'snow':
        return (
          <>
            {[...Array(30)].map((_, i) => {
              const x = 10 + (i * 14) % width;
              const y = 5 + (i * 23) % (height - 10);
              const size = 3 + (i % 4) * 2;
              const opacity = 0.4 + (i % 3) * 0.2;
              return (
                <g key={i} opacity={opacity}>
                  <line x1={x} y1={y - size} x2={x} y2={y + size} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={x - size} y1={y} x2={x + size} y2={y} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={x - size * 0.7} y1={y - size * 0.7} x2={x + size * 0.7} y2={y + size * 0.7} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={x - size * 0.7} y1={y + size * 0.7} x2={x + size * 0.7} y2={y - size * 0.7} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                </g>
              );
            })}
          </>
        );
      case 'flame':
        return (
          <>
            <defs>
              <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FFB74D" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFD54F" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {[...Array(5)].map((_, i) => (
              <path
                key={i}
                d={`M${width / 2 - 30 + i * 15} ${height - 10} 
                    Q ${width / 2 - 40 + i * 15} ${height - 50} ${width / 2 - 20 + i * 15} ${height - 80 - i * 10}
                    Q ${width / 2 - 10 + i * 15} ${height - 50} ${width / 2 + i * 15} ${height - 10}
                    Z`}
                fill={`url(#${id})`}
                opacity={0.8 - i * 0.15}
              />
            ))}
          </>
        );
      default:
        return (
          <>
            <defs>
              <radialGradient id={id}>
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </radialGradient>
            </defs>
            <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2.5} fill={`url(#${id})`} />
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const r = 35;
              return (
                <circle
                  key={i}
                  cx={width / 2 + Math.cos(angle) * r}
                  cy={height / 2 + Math.sin(angle) * r}
                  r="8"
                  fill={color}
                  opacity="0.3"
                />
              );
            })}
          </>
        );
    }
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
      {renderDecoration()}
    </svg>
  );
}
