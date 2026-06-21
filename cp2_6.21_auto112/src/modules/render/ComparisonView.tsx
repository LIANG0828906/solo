import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import FontFaceObserver from 'fontfaceobserver';
import {
  ColumnConfig,
  FONT_OPTIONS,
  getDiffPercent,
  useControls,
} from '../panel/useControls';

interface ColumnProps {
  index: 0 | 1 | 2;
  config: ColumnConfig;
  baseConfig: ColumnConfig | null;
  text: string;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

const SingleColumn: React.FC<ColumnProps> = ({
  index,
  config,
  baseConfig,
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

  const diffPercent = useMemo(() => {
    if (locked) return '基准';
    if (!baseConfig) return null;
    const diff = getDiffPercent(config.fontSize, baseConfig.fontSize);
    return diff ?? '0%';
  }, [locked, baseConfig, config.fontSize]);

  const diffClass = useMemo(() => {
    if (locked) return 'diff-tag baseline';
    if (!diffPercent) return '';
    if (diffPercent === '0%') return '';
    if (diffPercent.startsWith('+')) return 'diff-tag positive';
    if (diffPercent.startsWith('-')) return 'diff-tag negative';
    return '';
  }, [locked, diffPercent]);

  return (
    <div
      ref={wrapRef}
      className={`column ${selected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
      onClick={onClick}
    >
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-font-label">{fontFamilyLabel}</span>
          {diffPercent && (
            <span className={diffClass}>{diffPercent}</span>
          )}
        </div>
        <span className={`column-badge ${locked ? 'locked' : ''}`}>
          {`栏 ${index + 1}`}
        </span>
      </div>
      {fontLoaded ? (
        <div className="column-content-box">
          <div ref={contentRef} className="column-content" style={contentStyle}>
            {text}
          </div>
        </div>
      ) : (
        <div className="column-content-box">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>加载字体中...</span>
          </div>
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
    const text = useControls((s) => s.text);
    const columns = useControls((s) => s.columns);
    const selectedColumn = useControls((s) => s.selectedColumn);
    const lockedColumn = useControls((s) => s.lockedColumn);
    const setSelectedColumn = useControls((s) => s.setSelectedColumn);

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
    const baseConfig = useMemo(
      () => (lockedColumn !== null ? columns[lockedColumn] : null),
      [lockedColumn, columns]
    );

    return (
      <div className="comparison-view">
        {columns.map((config, i) => {
          const idx = i as 0 | 1 | 2;
          return (
            <React.Fragment key={idx}>
              <SingleColumn
                index={idx}
                config={config}
                baseConfig={lockedColumn === idx ? null : baseConfig}
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
