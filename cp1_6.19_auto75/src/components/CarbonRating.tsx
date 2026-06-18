import { useMemo } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { getStarGradient } from '../utils/colors';

interface CarbonRatingProps {
  score: number;
  maxStars?: number;
  size?: number;
  showTooltip?: boolean;
}

export function CarbonRating({
  score,
  maxStars = 5,
  size = 16,
  showTooltip = true
}: CarbonRatingProps) {
  const normalizedScore = Math.max(0, Math.min(10, score));
  const starValue = (1 - normalizedScore / 10) * maxStars;
  const fullStars = Math.floor(starValue);
  const hasHalfStar = starValue - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  const gradient = useMemo(() => getStarGradient(normalizedScore / 2), [normalizedScore]);

  const getDescription = () => {
    if (starValue >= 4.5) return '极低碳足迹，环保典范';
    if (starValue >= 3.5) return '低碳足迹，环保表现优秀';
    if (starValue >= 2.5) return '中等碳足迹，符合行业标准';
    if (starValue >= 1.5) return '中高碳足迹，有改进空间';
    return '高碳足迹，环境影响较大';
  };

  const iconStyle = {
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <FaStar
        key={`full-${i}`}
        size={size}
        style={iconStyle}
      />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <FaStarHalfAlt
        key="half"
        size={size}
        style={iconStyle}
      />
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <FaRegStar
        key={`empty-${i}`}
        size={size}
        color="#ccc"
      />
    );
  }

  return (
    <div className="flex items-center gap-1" title={showTooltip ? getDescription() : undefined}>
      {stars}
      <span className="ml-1 text-xs text-gray-500">
        ({starValue.toFixed(1)})
      </span>
    </div>
  );
}
