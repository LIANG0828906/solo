import type { ConcentrationTag } from '../types';

export const RATIO_LOW_THRESHOLD = 15;
export const RATIO_HIGH_THRESHOLD = 18;

export const TAG_COLORS: Record<ConcentrationTag, { bg: string; text: string; dot: string; bar: string }> = {
  浓萃: {
    bg: 'rgba(192, 57, 43, 0.12)',
    text: '#C0392B',
    dot: '#C0392B',
    bar: 'linear-gradient(90deg, #C0392B 0%, #E74C3C 100%)',
  },
  均衡: {
    bg: 'rgba(39, 174, 96, 0.12)',
    text: '#27AE60',
    dot: '#27AE60',
    bar: 'linear-gradient(90deg, #27AE60 0%, #2ECC71 100%)',
  },
  淡雅: {
    bg: 'rgba(52, 152, 219, 0.12)',
    text: '#3498DB',
    dot: '#3498DB',
    bar: 'linear-gradient(90deg, #3498DB 0%, #5DADE2 100%)',
  },
};

export const calcRatioValue = (coffeeWeight: number | '', waterWeight: number | ''): number | null => {
  const cw = Number(coffeeWeight);
  const ww = Number(waterWeight);
  if (!cw || !ww || cw <= 0) return null;
  return ww / cw;
};

export const formatRatio = (ratio: number | null): string => {
  if (ratio === null) return '1:--';
  return `1:${ratio.toFixed(1)}`;
};

export const getConcentrationTag = (ratio: number | null): ConcentrationTag | null => {
  if (ratio === null) return null;
  if (ratio < RATIO_LOW_THRESHOLD) return '浓萃';
  if (ratio > RATIO_HIGH_THRESHOLD) return '淡雅';
  return '均衡';
};

export const getRatioIndicatorInfo = (ratio: number | null) => {
  const tag = getConcentrationTag(ratio);
  if (!tag) {
    return {
      tag: null,
      color: '#C8BFB5',
      label: '待计算',
      dotColor: '#C8BFB5',
      barColor: 'linear-gradient(90deg, #C8BFB5 0%, #DCD3C9 100%)',
      bgColor: 'rgba(200, 191, 181, 0.12)',
      textColor: '#A67B5B',
    };
  }
  const colors = TAG_COLORS[tag];
  return {
    tag,
    color: colors.dot,
    label: tag,
    dotColor: colors.dot,
    barColor: colors.bar,
    bgColor: colors.bg,
    textColor: colors.text,
  };
};
