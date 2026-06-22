import { Preset } from '../types';

export const presets: Preset[] = [
  {
    name: '日落',
    gradientConfig: {
      type: 'linear',
      angle: 135,
      colors: [
        { id: 'p1-1', color: '#ff6b6b', position: 0 },
        { id: 'p1-2', color: '#feca57', position: 50 },
        { id: 'p1-3', color: '#ff9ff3', position: 100 },
      ],
    },
  },
  {
    name: '海洋',
    gradientConfig: {
      type: 'linear',
      angle: 180,
      colors: [
        { id: 'p2-1', color: '#0077b6', position: 0 },
        { id: 'p2-2', color: '#00b4d8', position: 50 },
        { id: 'p2-3', color: '#90e0ef', position: 100 },
      ],
    },
  },
  {
    name: '极光',
    gradientConfig: {
      type: 'radial',
      shape: 'ellipse',
      centerX: 50,
      centerY: 50,
      colors: [
        { id: 'p3-1', color: '#00f5d4', position: 0 },
        { id: 'p3-2', color: '#00bbf9', position: 40 },
        { id: 'p3-3', color: '#9b5de5', position: 80 },
        { id: 'p3-4', color: '#f15bb5', position: 100 },
      ],
    },
  },
  {
    name: '薰衣草',
    gradientConfig: {
      type: 'linear',
      angle: 90,
      colors: [
        { id: 'p4-1', color: '#667eea', position: 0 },
        { id: 'p4-2', color: '#764ba2', position: 100 },
      ],
    },
  },
  {
    name: '火焰',
    gradientConfig: {
      type: 'conic',
      startAngle: 45,
      colors: [
        { id: 'p5-1', color: '#ff0844', position: 0 },
        { id: 'p5-2', color: '#ffb199', position: 50 },
        { id: 'p5-3', color: '#ff0844', position: 100 },
      ],
    },
  },
];
