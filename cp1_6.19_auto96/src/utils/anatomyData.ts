export type JointKey = 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle';

export interface JointRange {
  min: number;
  max: number;
  safeMin: number;
  safeMax: number;
}

export interface JointConfig {
  key: JointKey;
  name: string;
  color: string;
  rotationAxis: 'x' | 'y' | 'z';
  range: JointRange;
  initialAngle: number;
  description: string;
}

export const JOINTS: JointConfig[] = [
  {
    key: 'shoulder',
    name: '肩关节',
    color: '#FF9800',
    rotationAxis: 'z',
    range: { min: 0, max: 180, safeMin: 0, safeMax: 160 },
    initialAngle: 30,
    description: '前屈/后伸'
  },
  {
    key: 'elbow',
    name: '肘关节',
    color: '#2196F3',
    rotationAxis: 'z',
    range: { min: 0, max: 145, safeMin: 10, safeMax: 135 },
    initialAngle: 90,
    description: '屈曲/伸展'
  },
  {
    key: 'wrist',
    name: '腕关节',
    color: '#4CAF50',
    rotationAxis: 'x',
    range: { min: -70, max: 70, safeMin: -60, safeMax: 60 },
    initialAngle: 0,
    description: '掌屈/背伸'
  },
  {
    key: 'hip',
    name: '髋关节',
    color: '#9C27B0',
    rotationAxis: 'z',
    range: { min: -20, max: 120, safeMin: -10, safeMax: 110 },
    initialAngle: 0,
    description: '前屈/后伸'
  },
  {
    key: 'knee',
    name: '膝关节',
    color: '#E91E63',
    rotationAxis: 'z',
    range: { min: 0, max: 135, safeMin: 5, safeMax: 125 },
    initialAngle: 10,
    description: '屈曲/伸展'
  },
  {
    key: 'ankle',
    name: '踝关节',
    color: '#00BCD4',
    rotationAxis: 'x',
    range: { min: -45, max: 30, safeMin: -35, safeMax: 20 },
    initialAngle: 0,
    description: '背伸/跖屈'
  }
];

export const getJointConfig = (key: JointKey): JointConfig => {
  return JOINTS.find((j) => j.key === key) || JOINTS[0];
};

export const isAngleSafe = (angle: number, range: JointRange): boolean => {
  return angle >= range.safeMin && angle <= range.safeMax;
};

export const calculateRiskScore = (
  angles: Record<JointKey, number>
): number => {
  let totalRisk = 0;
  JOINTS.forEach((joint) => {
    const angle = angles[joint.key];
    const { range } = joint;
    if (angle < range.safeMin) {
      const excess = range.safeMin - angle;
      const rangeSpan = range.safeMin - range.min || 1;
      totalRisk += (excess / rangeSpan) * 100;
    } else if (angle > range.safeMax) {
      const excess = angle - range.safeMax;
      const rangeSpan = range.max - range.safeMax || 1;
      totalRisk += (excess / rangeSpan) * 100;
    }
  });
  return Math.min(100, Math.round(totalRisk / JOINTS.length));
};

export const getRiskLevel = (score: number): { text: string; color: string } => {
  if (score <= 30) {
    return { text: '低风险', color: '#4CAF50' };
  } else if (score <= 60) {
    return { text: '中风险，建议咨询医生', color: '#FF9800' };
  } else {
    return { text: '高风险，请立即停止并联系专业人士', color: '#FF4444' };
  }
};

export const normalizeAngle = (
  angle: number,
  range: JointRange
): number => {
  return (angle - range.min) / (range.max - range.min);
};
