import React from 'react';

interface TemplateThumbnailProps {
  templateId: string;
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({
  templateId,
  width = 120,
  height = 80,
  primaryColor = '#2196f3',
  secondaryColor = '#6c63ff',
}) => {
  const renderThumbnail = () => {
    switch (templateId) {
      case 'template-two-column':
        return <TwoColumnThumbnail width={width} height={height} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'template-timeline':
        return <TimelineThumbnail width={width} height={height} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'template-flow':
        return <FlowThumbnail width={width} height={height} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'template-cards':
        return <CardsThumbnail width={width} height={height} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'template-person':
        return <PersonThumbnail width={width} height={height} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      default:
        return <DefaultThumbnail width={width} height={height} primaryColor={primaryColor} />;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
    >
      {renderThumbnail()}
    </svg>
  );
};

const TwoColumnThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ width, height, primaryColor, secondaryColor }) => {
  const gap = 6;
  const colWidth = (width - 16 - gap) / 2;
  const colHeight = height - 24;
  const titleWidth = width * 0.5;

  return (
    <>
      <rect x={8} y={6} width={titleWidth} height={8} rx={2} fill={primaryColor} opacity={0.8} />
      <rect
        x={8}
        y={18}
        width={colWidth}
        height={colHeight}
        rx={4}
        fill={primaryColor}
        opacity={0.25}
        stroke={primaryColor}
        strokeWidth={1.5}
      />
      <rect
        x={8 + colWidth + gap}
        y={18}
        width={colWidth}
        height={colHeight}
        rx={4}
        fill={secondaryColor}
        opacity={0.25}
        stroke={secondaryColor}
        strokeWidth={1.5}
      />
      <line x1={8 + colWidth / 2} y1={28} x2={8 + colWidth / 2} y2={40} stroke="#fff" strokeWidth={1.5} opacity={0.6} />
      <rect x={8 + 6} y={30} width={colWidth - 12} height={3} rx={1.5} fill={primaryColor} opacity={0.6} />
      <rect x={8 + 6} y={38} width={colWidth - 16} height={3} rx={1.5} fill={primaryColor} opacity={0.4} />
      <rect x={8 + 6} y={46} width={colWidth - 20} height={3} rx={1.5} fill={primaryColor} opacity={0.3} />
      <rect x={8 + colWidth + gap + 6} y={30} width={colWidth - 12} height={3} rx={1.5} fill={secondaryColor} opacity={0.6} />
      <rect x={8 + colWidth + gap + 6} y={38} width={colWidth - 16} height={3} rx={1.5} fill={secondaryColor} opacity={0.4} />
      <rect x={8 + colWidth + gap + 6} y={46} width={colWidth - 20} height={3} rx={1.5} fill={secondaryColor} opacity={0.3} />
    </>
  );
};

const TimelineThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ width, height, primaryColor, secondaryColor }) => {
  const lineY = height / 2 + 4;
  const startX = 12;
  const endX = width - 12;
  const nodeCount = 4;
  const spacing = (endX - startX) / (nodeCount - 1);
  const colors = [primaryColor, '#00a1d6', secondaryColor, '#ffb300'];

  return (
    <>
      <rect x={width / 2 - 20} y={6} width={40} height={7} rx={2} fill={primaryColor} opacity={0.8} />
      <line
        x1={startX}
        y1={lineY}
        x2={endX}
        y2={lineY}
        stroke={primaryColor}
        strokeWidth={2}
        opacity={0.4}
      />
      {Array.from({ length: nodeCount }).map((_, i) => (
        <g key={i}>
          <circle
            cx={startX + i * spacing}
            cy={lineY}
            r={5}
            fill="#fff"
            stroke={colors[i % colors.length]}
            strokeWidth={2}
          />
          <rect
            x={startX + i * spacing - 8}
            y={lineY - 18}
            width={16}
            height={6}
            rx={2}
            fill={colors[i % colors.length]}
            opacity={0.7}
          />
          <rect
            x={startX + i * spacing - 10}
            y={lineY + 10}
            width={20}
            height={4}
            rx={2}
            fill="#999"
            opacity={0.4}
          />
        </g>
      ))}
    </>
  );
};

const FlowThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ width, height, primaryColor, secondaryColor }) => {
  const centerX = width / 2;
  const boxWidth = 40;
  const boxHeight = 12;
  const startY = 10;
  const spacing = 16;
  const colors = [primaryColor, '#00a1d6', secondaryColor, '#f50057'];

  return (
    <>
      <rect x={centerX - boxWidth / 2} y={startY} width={boxWidth} height={boxHeight} rx={3} fill={colors[0]} />
      <rect x={centerX - 3} y={startY + boxHeight + 2} width={6} height={spacing - boxHeight - 4} rx={2} fill="#ccc" opacity={0.6} />
      <rect x={centerX - boxWidth / 2} y={startY + spacing} width={boxWidth} height={boxHeight} rx={3} fill={colors[1]} />
      <rect x={centerX - 3} y={startY + spacing + boxHeight + 2} width={6} height={spacing - boxHeight - 4} rx={2} fill="#ccc" opacity={0.6} />
      <rect x={centerX - boxWidth / 2} y={startY + spacing * 2} width={boxWidth} height={boxHeight} rx={3} fill={colors[2]} />
      <rect x={centerX - 3} y={startY + spacing * 2 + boxHeight + 2} width={6} height={spacing - boxHeight - 4} rx={2} fill="#ccc" opacity={0.6} />
      <rect x={centerX - boxWidth / 2} y={startY + spacing * 3} width={boxWidth} height={boxHeight} rx={3} fill={colors[3]} />
      <rect x={centerX - 25} y={startY + 4} width={16} height={4} rx={1} fill="#fff" opacity={0.8} />
      <rect x={centerX - 25} y={startY + spacing + 4} width={16} height={4} rx={1} fill="#fff" opacity={0.8} />
      <rect x={centerX - 25} y={startY + spacing * 2 + 4} width={16} height={4} rx={1} fill="#fff" opacity={0.8} />
      <rect x={centerX - 25} y={startY + spacing * 3 + 4} width={16} height={4} rx={1} fill="#fff" opacity={0.8} />
    </>
  );
};

const CardsThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ width, height, primaryColor, secondaryColor }) => {
  const cardWidth = 24;
  const cardHeight = 28;
  const gap = 6;
  const startX = (width - cardWidth * 4 - gap * 3) / 2;
  const startY = 14;
  const colors = [primaryColor, '#00a1d6', secondaryColor, '#f50057'];

  return (
    <>
      <rect x={width / 2 - 18} y={5} width={36} height={6} rx={2} fill={primaryColor} opacity={0.8} />
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={i}>
          <rect
            x={startX + i * (cardWidth + gap)}
            y={startY}
            width={cardWidth}
            height={cardHeight}
            rx={3}
            fill={colors[i % colors.length]}
            opacity={0.2}
            stroke={colors[i % colors.length]}
            strokeWidth={1}
          />
          <rect
            x={startX + i * (cardWidth + gap) + 4}
            y={startY + 6}
            width={cardWidth - 8}
            height={3}
            rx={1.5}
            fill={colors[i % colors.length]}
            opacity={0.5}
          />
          <rect
            x={startX + i * (cardWidth + gap) + 4}
            y={startY + 14}
            width={cardWidth - 8}
            height={4}
            rx={2}
            fill={colors[i % colors.length]}
            opacity={0.9}
          />
          <rect
            x={startX + i * (cardWidth + gap) + 4}
            y={startY + 20}
            width={cardWidth - 12}
            height={2}
            rx={1}
            fill="#999"
            opacity={0.4}
          />
        </g>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={`row2-${i}`}>
          <rect
            x={startX + i * (cardWidth + gap)}
            y={startY + cardHeight + gap}
            width={cardWidth}
            height={cardHeight}
            rx={3}
            fill={colors[(i + 2) % colors.length]}
            opacity={0.2}
            stroke={colors[(i + 2) % colors.length]}
            strokeWidth={1}
          />
          <rect
            x={startX + i * (cardWidth + gap) + 4}
            y={startY + cardHeight + gap + 6}
            width={cardWidth - 8}
            height={3}
            rx={1.5}
            fill={colors[(i + 2) % colors.length]}
            opacity={0.5}
          />
          <rect
            x={startX + i * (cardWidth + gap) + 4}
            y={startY + cardHeight + gap + 14}
            width={cardWidth - 8}
            height={4}
            rx={2}
            fill={colors[(i + 2) % colors.length]}
            opacity={0.9}
          />
        </g>
      ))}
    </>
  );
};

const PersonThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
}> = ({ width, height, primaryColor, secondaryColor }) => {
  const avatarSize = 22;
  const startX = 10;
  const spacing = (width - 20 - avatarSize * 3) / 2;
  const colors = [primaryColor, '#00a1d6', secondaryColor];

  return (
    <>
      <rect x={width / 2 - 16} y={5} width={32} height={6} rx={2} fill={primaryColor} opacity={0.8} />
      {Array.from({ length: 3 }).map((_, i) => (
        <g key={i}>
          <circle
            cx={startX + avatarSize / 2 + i * (avatarSize + spacing)}
            cy={18 + avatarSize / 2}
            r={avatarSize / 2}
            fill={colors[i % colors.length]}
            opacity={0.25}
            stroke={colors[i % colors.length]}
            strokeWidth={1.5}
          />
          <circle
            cx={startX + avatarSize / 2 + i * (avatarSize + spacing)}
            cy={14 + avatarSize / 2 - 2}
            r={4}
            fill="#fff"
            opacity={0.8}
          />
          <rect
            x={startX + avatarSize / 2 + i * (avatarSize + spacing) - 8}
            y={18 + avatarSize + 2}
            width={16}
            height={5}
            rx={2}
            fill={colors[i % colors.length]}
            opacity={0.7}
          />
          <rect
            x={startX + avatarSize / 2 + i * (avatarSize + spacing) - 10}
            y={18 + avatarSize + 9}
            width={20}
            height={3}
            rx={1.5}
            fill="#999"
            opacity={0.35}
          />
          <rect
            x={startX + avatarSize / 2 + i * (avatarSize + spacing) - 8}
            y={18 + avatarSize + 14}
            width={16}
            height={3}
            rx={1.5}
            fill="#999"
            opacity={0.25}
          />
        </g>
      ))}
    </>
  );
};

const DefaultThumbnail: React.FC<{
  width: number;
  height: number;
  primaryColor: string;
}> = ({ width, height, primaryColor }) => {
  return (
    <rect
      x={4}
      y={4}
      width={width - 8}
      height={height - 8}
      rx={4}
      fill={primaryColor}
      opacity={0.2}
      stroke={primaryColor}
      strokeWidth={1.5}
      strokeDasharray="4 3"
    />
  );
};
