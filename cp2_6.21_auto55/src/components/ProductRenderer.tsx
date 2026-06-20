import React, { useMemo } from 'react';
import { ColorConfig, ProductType } from '../utils/colorUtils';

interface ProductRendererProps {
  colorConfig: ColorConfig;
  productType: ProductType;
  showHeatmap?: boolean;
  differences?: Record<string, number>;
  className?: string;
}

const ShoeSVG: React.FC<ColorConfig> = ({ body, trim, lining, stitching }) => (
  <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shoeShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </linearGradient>
    </defs>
    
    <ellipse cx="200" cy="230" rx="140" ry="15" fill="url(#shoeShadow)" />
    
    <path
      d="M 60 200 Q 50 180 80 160 L 120 100 Q 150 60 200 55 Q 250 50 300 70 L 340 100 Q 360 120 350 180 Q 345 200 320 205 L 80 205 Q 65 205 60 200 Z"
      fill={body}
      stroke={stitching}
      strokeWidth="2"
      strokeDasharray="4 3"
    />
    
    <path
      d="M 80 205 L 60 200 Q 50 180 80 160 L 120 100"
      fill="none"
      stroke={trim}
      strokeWidth="6"
      strokeLinecap="round"
    />
    
    <path
      d="M 200 55 Q 180 80 170 120 L 160 180 L 320 205 Q 340 200 345 180 Q 350 150 340 130 Q 320 100 280 90 Q 240 75 200 55 Z"
      fill={trim}
      opacity="0.9"
    />
    
    <path
      d="M 100 170 Q 130 140 170 130 L 170 190 Q 130 195 100 190 Z"
      fill={lining}
    />
    
    <ellipse cx="200" cy="75" rx="20" ry="8" fill={trim} opacity="0.7" />
    
    <path
      d="M 180 90 L 200 85 L 220 90 M 175 110 L 200 105 L 225 110 M 170 130 L 200 125 L 230 130"
      stroke={stitching}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    
    <path
      d="M 80 205 Q 90 220 130 222 L 300 222 Q 340 220 350 205"
      fill={trim}
    />
    
    <path
      d="M 100 210 L 320 210"
      stroke={stitching}
      strokeWidth="1"
      strokeDasharray="3 2"
      fill="none"
    />
  </svg>
);

const HeadphoneSVG: React.FC<ColorConfig> = ({ body, trim, lining, stitching }) => (
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hpShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </linearGradient>
    </defs>
    
    <ellipse cx="200" cy="280" rx="120" ry="12" fill="url(#hpShadow)" />
    
    <path
      d="M 80 200 Q 80 80 200 60 Q 320 80 320 200"
      fill="none"
      stroke={body}
      strokeWidth="24"
      strokeLinecap="round"
    />
    
    <path
      d="M 80 200 Q 80 80 200 60 Q 320 80 320 200"
      fill="none"
      stroke={trim}
      strokeWidth="20"
      strokeLinecap="round"
    />
    
    <g transform="translate(80, 200)">
      <ellipse cx="0" cy="0" rx="55" ry="75" fill={body} />
      <ellipse cx="0" cy="0" rx="45" ry="65" fill={trim} />
      <ellipse cx="0" cy="5" rx="35" ry="50" fill={lining} />
      
      <path
        d="M -35 -30 Q 0 -40 35 -30"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <path
        d="M -35 0 Q 0 -5 35 0"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <path
        d="M -35 30 Q 0 25 35 30"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
    </g>
    
    <g transform="translate(320, 200)">
      <ellipse cx="0" cy="0" rx="55" ry="75" fill={body} />
      <ellipse cx="0" cy="0" rx="45" ry="65" fill={trim} />
      <ellipse cx="0" cy="5" rx="35" ry="50" fill={lining} />
      
      <path
        d="M -35 -30 Q 0 -40 35 -30"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <path
        d="M -35 0 Q 0 -5 35 0"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <path
        d="M -35 30 Q 0 25 35 30"
        stroke={stitching}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
    </g>
    
    <ellipse cx="200" cy="60" rx="15" ry="8" fill={trim} opacity="0.8" />
  </svg>
);

const BackpackSVG: React.FC<ColorConfig> = ({ body, trim, lining, stitching }) => (
  <svg viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bpShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </linearGradient>
    </defs>
    
    <ellipse cx="175" cy="330" rx="100" ry="12" fill="url(#bpShadow)" />
    
    <path
      d="M 80 100 Q 60 100 50 120 L 50 280 Q 50 310 80 315 L 270 315 Q 300 310 300 280 L 300 120 Q 290 100 270 100 Z"
      fill={body}
    />
    
    <path
      d="M 80 100 Q 60 100 50 120 L 50 280 Q 50 310 80 315"
      fill="none"
      stroke={trim}
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M 270 100 Q 290 100 300 120 L 300 280 Q 300 310 270 315"
      fill="none"
      stroke={trim}
      strokeWidth="5"
      strokeLinecap="round"
    />
    
    <rect x="90" y="150" width="170" height="130" rx="10" fill={trim} opacity="0.8" />
    
    <rect x="100" y="160" width="150" height="110" rx="5" fill={lining} />
    
    <path
      d="M 100 160 L 250 160 M 100 200 L 250 200 M 100 240 L 250 240"
      stroke={stitching}
      strokeWidth="1"
      strokeDasharray="2 2"
    />
    
    <path
      d="M 110 100 Q 110 40 175 30 Q 240 40 240 100"
      fill="none"
      stroke={trim}
      strokeWidth="10"
      strokeLinecap="round"
    />
    
    <path
      d="M 110 100 Q 110 40 175 30 Q 240 40 240 100"
      fill="none"
      stroke={body}
      strokeWidth="6"
      strokeLinecap="round"
    />
    
    <rect x="155" y="110" width="40" height="25" rx="5" fill={trim} />
    
    <circle cx="175" cy="122" r="6" fill={body} />
    
    <path
      d="M 60 130 Q 20 150 25 220 Q 28 260 60 270"
      fill="none"
      stroke={trim}
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M 290 130 Q 330 150 325 220 Q 322 260 290 270"
      fill="none"
      stroke={trim}
      strokeWidth="8"
      strokeLinecap="round"
    />
    
    <path
      d="M 80 315 L 270 315"
      stroke={stitching}
      strokeWidth="1.5"
      strokeDasharray="4 3"
    />
  </svg>
);

const ProductRenderer: React.FC<ProductRendererProps> = ({
  colorConfig,
  productType,
  showHeatmap = false,
  differences,
  className = ''
}) => {
  const productSVG = useMemo(() => {
    switch (productType) {
      case 'shoe':
        return <ShoeSVG {...colorConfig} />;
      case 'headphone':
        return <HeadphoneSVG {...colorConfig} />;
      case 'backpack':
        return <BackpackSVG {...colorConfig} />;
      default:
        return <ShoeSVG {...colorConfig} />;
    }
  }, [productType, colorConfig]);

  const heatmapOverlay = useMemo(() => {
    if (!showHeatmap || !differences) return null;

    const getHeatColor = (deltaE: number): string => {
      const maxDelta = 30;
      const normalized = Math.min(deltaE / maxDelta, 1);
      
      if (normalized < 0.33) {
        const t = normalized / 0.33;
        return `rgba(0, 255, 255, ${0.1 + t * 0.2})`;
      } else if (normalized < 0.66) {
        const t = (normalized - 0.33) / 0.33;
        return `rgba(255, 255, 0, ${0.2 + t * 0.2})`;
      } else {
        const t = (normalized - 0.66) / 0.34;
        return `rgba(255, 0, 0, ${0.3 + t * 0.4})`;
      }
    };

    return (
      <div 
        className="heatmap-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          mixBlendMode: 'multiply' as const
        }}
      >
        {Object.entries(differences).map(([part, delta]) => (
          <div
            key={part}
            className={`heatmap-part heatmap-${part}`}
            style={{
              position: 'absolute',
              backgroundColor: getHeatColor(delta),
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </div>
    );
  }, [showHeatmap, differences]);

  return (
    <div className={`product-renderer ${className}`} style={{ position: 'relative' }}>
      <div className="product-svg-container" style={{ width: '100%', height: '100%' }}>
        {productSVG}
      </div>
      {heatmapOverlay}
    </div>
  );
};

export default ProductRenderer;
