import React from 'react';
import type { PartTemplate } from '../types';

interface Props {
  template: PartTemplate;
  size?: number;
}

export const PartIcon: React.FC<Props> = ({ template, size = 48 }) => {
  const scale = size / 80;
  const w = template.width * scale;
  const h = template.height * scale;
  const color = template.color;
  const id = template.id;

  let shape: React.ReactNode;
  if (id.includes('triangle')) {
    const points = `${w / 2},0 ${w},${h} 0,${h}`;
    shape = <polygon points={points} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />;
  } else if (id.includes('circle') && !id.includes('ring')) {
    const r = Math.min(w, h) / 2;
    shape = <circle cx={w / 2} cy={h / 2} r={r} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />;
  } else if (id.includes('ring')) {
    const rOuter = Math.min(w, h) / 2;
    const rInner = rOuter * 0.55;
    shape = (
      <g fillRule="evenodd">
        <circle cx={w / 2} cy={h / 2} r={rOuter} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        <circle cx={w / 2} cy={h / 2} r={rInner} fill="#F5F0EB" />
      </g>
    );
  } else {
    shape = (
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={5 * scale}
        ry={5 * scale}
        fill={color}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={1}
      />
    );
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {shape}
    </svg>
  );
};
