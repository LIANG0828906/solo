import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import {
  ColumnConfig,
  FONT_OPTIONS,
  useControls,
} from '../panel/useControls';

interface ColumnProps {
  index: 0 | 1 | 2;
  config: ColumnConfig;
  text: string;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

const SingleColumn: React.FC<ColumnProps> = ({
  index,
  config,
  text,
  selected,
  locked,
  onClick,
  contentRef,
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fontFamilyLabel =
    FONT_OPTIONS.find((f) => f.value === config.fontFamily)?.label || 'Custom';

  useEffect(() => {
    setFontLoaded(false);
    const match = config.fontFamily.match(/'([^']+)'/);
    const fontName = match ? match[1] : null;
    if (!fontName) {
      setFontLoaded(true);
      return;
    }
    const observer = new FontFaceObserver(fontName);
    observer
      .load(null, 5000)
      .then(() => setFontLoaded(true))
      .catch(() => setFontLoaded(true));
  }, [config.fontFamily]);

  const contentStyle: React.CSSProperties = {
    fontFamily: config.fontFamily,
    fontSize: `${config.fontSize}px`,
    lineHeight: config.lineHeight,
    letterSpacing: `${config.letterSpacing}em`,
    color: config.color,
  };

  return (
    <div
      ref={wrapRef}
      className={`column ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
      onClick={onClick}
    >
      <div className="column-header">
        <span className="column-font-label">{fontFamilyLabel}</span>
        <span className={`column-badge ${locked ? 'locked' : ''}`}>
          {locked ? '基准 🔒' : `栏 ${index + 1}`}
        </span>
      </div>
      {fontLoaded ? (
        <div ref={contentRef} className="column-content" style={contentStyle}>
          {text}
        </div>
      ) : (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>加载字体中...</span>
        </div>
      )}
    </div>
  );
};

export interface ComparisonViewHandle {
  getColumnElements: () => [HTMLElement, HTMLElement, HTMLElement] | null;
}

interface ComparisonViewProps {}

export const ComparisonView = forwardRef<ComparisonViewHandle, ComparisonViewProps>(
  function ComparisonView(_props, ref) {
    const { text, columns, selectedColumn, setSelectedColumn } = useControls();

    const col0Ref = useRef<HTMLDivElement>(null);
    const col1Ref = useRef<HTMLDivElement>(null);
    const col2Ref = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getColumnElements: () => {
        if (col0Ref.current && col1Ref.current && col2Ref.current) {
          return [col0Ref.current, col1Ref.current, col2Ref.current];
        }
        return null;
      },
    }));

    const colRefs = [col0Ref, col1Ref, col2Ref];
    const lockedColumn = useControls.getState().lockedColumn;

    return (
      <div className="comparison-view">
        {columns.map((config, i) => {
          const idx = i as 0 | 1 | 2;
          return (
            <React.Fragment key={idx}>
              <SingleColumn
                index={idx}
                config={config}
                text={text}
                selected={selectedColumn === idx}
                locked={lockedColumn === idx}
                onClick={() => setSelectedColumn(idx)}
                contentRef={colRefs[idx]}
              />
              {i < 2 && <div className="column-divider" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

export default ComparisonView;
