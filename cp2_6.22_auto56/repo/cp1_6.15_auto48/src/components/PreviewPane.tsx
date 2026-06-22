import React, { useMemo } from 'react';
import type { GradientScheme } from '@/utils/history';
import { generateColorStops } from '@/utils/history';

interface PreviewPaneProps {
  scheme: GradientScheme;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ scheme }) => {
  const gradientStyle = useMemo(() => {
    const stops = generateColorStops(scheme.startColor, scheme.endColor, scheme.steps);
    switch (scheme.gradientType) {
      case 'linear':
        return { background: `linear-gradient(${scheme.direction}deg, ${stops})` };
      case 'radial':
        return { background: `radial-gradient(circle, ${stops})` };
      case 'conic':
        return { background: `conic-gradient(from ${scheme.direction}deg, ${stops})` };
      default:
        return { background: `linear-gradient(135deg, ${stops})` };
    }
  }, [scheme.startColor, scheme.endColor, scheme.gradientType, scheme.direction, scheme.steps]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[300px]">
      <div
        className="w-full aspect-[4/3] sm:aspect-auto sm:w-full sm:h-full max-h-[520px] rounded-3xl gradient-preview-transition shadow-2xl border border-white/20"
        style={gradientStyle}
      >
        <div className="w-full h-full rounded-3xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="glass-card px-4 py-2 rounded-xl text-sm font-body text-gray-700">
            {scheme.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewPane;
