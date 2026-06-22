import React from 'react';

interface ToneMarkerProps {
  tones: string[];
}

const ToneMarker: React.FC<ToneMarkerProps> = ({ tones }) => {
  return (
    <div className="flex items-center gap-1 mt-1">
      {tones.map((tone, index) => (
        <span
          key={index}
          className={`tone-dot ${tone === '平' ? 'tone-level' : 'tone-oblique'}`}
          title={tone === '平' ? '平声' : '仄声'}
        />
      ))}
    </div>
  );
};

export default React.memo(ToneMarker);
