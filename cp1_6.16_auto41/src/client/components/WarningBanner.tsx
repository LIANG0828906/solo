import { memo } from 'react';
import type { PetStats } from '../types';
import { STAT_NAMES } from '../pet';
import './WarningBanner.css';

interface WarningBannerProps {
  warnings: Array<keyof PetStats>;
  petName: string;
}

const WarningBanner = memo(function WarningBanner({ warnings, petName }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  const warningText = warnings.map(w => STAT_NAMES[w]).join('、');

  return (
    <div className="warning-banner animate-slide-down">
      <span className="warning-icon">⚠️</span>
      <span className="warning-text">
        {petName}的{warningText}状态不佳！
      </span>
    </div>
  );
});

export default WarningBanner;
