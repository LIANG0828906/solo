import React, { useMemo, useCallback } from 'react';
import { useScaleStore } from '../store/scaleStore';

const PREVIEW_TEXT =
  'The quick brown fox jumps over the lazy dog 0123456789';

export const PreviewCanvas: React.FC = () => {
  const { selectedLevel, gridBase } = useScaleStore(
    useCallback((state) => {
      const selectedLevel =
        state.levels.find((l) => l.id === state.selectedLevelId) || null;
      return { selectedLevel, gridBase: state.gridBase };
    }, [])
  );

  const gridStyle = useMemo(() => {
    if (!gridBase) return {};
    return {
      backgroundSize: `${gridBase}px ${gridBase}px`,
    };
  }, [gridBase]);

  const textStyle = useMemo(() => {
    if (!selectedLevel) return {};
    return {
      fontFamily: `'${selectedLevel.fontFamily}', sans-serif`,
      fontSize: `${selectedLevel.fontSize}px`,
      lineHeight: selectedLevel.lineHeight,
      fontWeight: selectedLevel.fontWeight,
      letterSpacing: `${selectedLevel.letterSpacing}em`,
    };
  }, [selectedLevel]);

  return (
    <div
      className={`preview-canvas ${gridBase ? 'with-grid' : ''}`}
      style={gridStyle}
    >
      {selectedLevel && (
        <>
          <p
            key={selectedLevel.id}
            className="preview-text"
            style={textStyle}
          >
            {PREVIEW_TEXT}
          </p>
          <div className="preview-info" key={`info-${selectedLevel.id}`}>
            字号: {selectedLevel.fontSize}px · 行高:{' '}
            {selectedLevel.lineHeight.toFixed(1)}
          </div>
        </>
      )}
    </div>
  );
};
