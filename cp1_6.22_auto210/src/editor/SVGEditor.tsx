import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PathPoint, DragState, DraggableType } from '../types';
import { PathManager } from './PathManager';
import { AnimationRenderer } from './AnimationRenderer';
import CloneLibrary from '../clonary/CloneLibrary';

const VIEWPORT_WIDTH = 600;
const VIEWPORT_HEIGHT = 500;
const START_COLOR = '#6366F1';
const END_COLOR = '#EC4899';

const SVGEditor: React.FC = () => {
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dragState = useRef<DragState | null>(null);
  const animationRenderer = useRef(new AnimationRenderer());
  const pathManager = useRef(new PathManager());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pathString = useMemo(() => {
    pathManager.current.setPoints(points);
    return pathManager.current.serialize();
  }, [points]);

  const currentStrokeColor = useMemo(() => {
    return animationRenderer.current.interpolateColor(START_COLOR, END_COLOR, animationProgress);
  }, [animationProgress]);

  useEffect(() => {
    if (pathRef.current) {
      animationRenderer.current.setPathElement(pathRef.current);
      animationRenderer.current.setConfig({ speed, loop });
    }
  }, [pathString, speed, loop]);

  useEffect(() => {
    animationRenderer.current.setOnProgress((p) => {
      setAnimationProgress(p);
    });
    animationRenderer.current.setOnComplete(() => {
      if (!loop) {
        setIsAnimating(false);
      }
    });
  }, [loop]);

  const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIEWPORT_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * VIEWPORT_HEIGHT;
    return {
      x: Math.max(0, Math.min(VIEWPORT_WIDTH, x)),
      y: Math.max(0, Math.min(VIEWPORT_HEIGHT, y))
    };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragState.current) return;
    if (isAnimating) return;

    const target = e.target as SVGElement;
    if (target.tagName !== 'svg' && !target.classList.contains('canvas-bg')) return;

    const pt = getSVGPoint(e);
    pathManager.current.setPoints(points);
    const newPoints = pathManager.current.addPoint(pt.x, pt.y);
    setPoints(newPoints);
    setSelectedIndex(newPoints.length - 1);
  }, [points, getSVGPoint, isAnimating]);

  const handleAnchorMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;

    const pt = getSVGPoint(e);
    const point = points[index];
    dragState.current = {
      type: 'anchor',
      pointIndex: index,
      offsetX: pt.x - point.x,
      offsetY: pt.y - point.y
    };
    setSelectedIndex(index);
  }, [points, getSVGPoint, isAnimating]);

  const handleHandleMouseDown = useCallback((index: number, type: 'handleIn' | 'handleOut', e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;

    const point = points[index];
    const handle = type === 'handleIn' ? point.handleIn : point.handleOut;
    if (!handle) return;

    const pt = getSVGPoint(e);
    dragState.current = {
      type: type as DraggableType,
      pointIndex: index,
      offsetX: pt.x - handle.x,
      offsetY: pt.y - handle.y
    };
    setSelectedIndex(index);
  }, [points, getSVGPoint, isAnimating]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * VIEWPORT_WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * VIEWPORT_HEIGHT;

      const { type, pointIndex, offsetX, offsetY } = dragState.current;
      const clampedX = Math.max(0, Math.min(VIEWPORT_WIDTH, x - offsetX));
      const clampedY = Math.max(0, Math.min(VIEWPORT_HEIGHT, y - offsetY));

      pathManager.current.setPoints(points);

      if (type === 'anchor') {
        const newPoints = pathManager.current.updatePoint(pointIndex, { x: clampedX, y: clampedY });
        setPoints(newPoints);
      } else if (type === 'handleIn') {
        const newPoints = pathManager.current.updatePoint(pointIndex, {
          handleIn: { x: clampedX, y: clampedY }
        });
        setPoints(newPoints);
      } else if (type === 'handleOut') {
        const newPoints = pathManager.current.updatePoint(pointIndex, {
          handleOut: { x: clampedX, y: clampedY }
        });
        setPoints(newPoints);
      }
    };

    const handleMouseUp = () => {
      dragState.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [points]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndex !== null && !isAnimating) {
        e.preventDefault();
        pathManager.current.setPoints(points);
        const newPoints = pathManager.current.removePoint(selectedIndex);
        setPoints(newPoints);
        setSelectedIndex(newPoints.length > 0 ? Math.min(selectedIndex, newPoints.length - 1) : null);
      }
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, points, isAnimating]);

  const handlePreviewAnimation = () => {
    if (points.length < 2) return;
    setAnimationProgress(0);
    animationRenderer.current.setConfig({ speed, loop });
    animationRenderer.current.start();
    setIsAnimating(true);
  };

  const handleStopAnimation = () => {
    animationRenderer.current.stop();
    animationRenderer.current.reset();
    setIsAnimating(false);
    setAnimationProgress(0);
  };

  const handleLoadPath = (loadedPoints: PathPoint[]) => {
    setPoints(loadedPoints);
    setSelectedIndex(null);
    handleStopAnimation();
  };

  const handleUploadSVG = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const svgText = event.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const pathElements = doc.querySelectorAll('path');

        if (pathElements.length > 0) {
          const d = pathElements[0].getAttribute('d') || '';
          pathManager.current.setPoints([]);
          const parsedPoints = pathManager.current.parsePath(d);
          if (parsedPoints.length > 0) {
            const bbox = new PathManager(parsedPoints).getBoundingBox();
            if (bbox) {
              const width = bbox.maxX - bbox.minX || 1;
              const height = bbox.maxY - bbox.minY || 1;
              const scale = Math.min((VIEWPORT_WIDTH - 40) / width, (VIEWPORT_HEIGHT - 40) / height);
              const offsetX = (VIEWPORT_WIDTH - width * scale) / 2 - bbox.minX * scale;
              const offsetY = (VIEWPORT_HEIGHT - height * scale) / 2 - bbox.minY * scale;

              const transformed = parsedPoints.map(p => ({
                x: p.x * scale + offsetX,
                y: p.y * scale + offsetY,
                handleIn: p.handleIn ? { x: p.handleIn.x * scale + offsetX, y: p.handleIn.y * scale + offsetY } : undefined,
                handleOut: p.handleOut ? { x: p.handleOut.x * scale + offsetX, y: p.handleOut.y * scale + offsetY } : undefined
              }));
              setPoints(transformed);
            } else {
              setPoints(parsedPoints);
            }
            setSelectedIndex(null);
            handleStopAnimation();
          }
        }
      } catch (err) {
        console.error('Failed to parse SVG:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const appStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  };

  const toolbarStyle: React.CSSProperties = {
    height: 48,
    backgroundColor: '#E2E8F0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 12,
    borderBottom: '1px solid #CBD5E1'
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: 13,
    backgroundColor: '#94A3B8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  };

  const primaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: '#6366F1'
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 13,
    borderRadius: 6,
    border: '1px solid #94A3B8',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    cursor: 'pointer',
    outline: 'none'
  };

  const canvasWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'auto'
  };

  const svgStyle: React.CSSProperties = {
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)',
    cursor: isAnimating ? 'default' : 'crosshair',
    userSelect: 'none'
  };

  const checkboxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#475569',
    cursor: 'pointer'
  };

  const hintStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 12,
    color: '#94A3B8',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '6px 12px',
    borderRadius: 4,
    pointerEvents: 'none'
  };

  return (
    <div style={appStyle}>
      <CloneLibrary onLoadPath={handleLoadPath} currentPoints={points} />

      <div style={mainStyle}>
        <div style={toolbarStyle}>
          <button
            style={btnStyle}
            onClick={handleUploadSVG}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#94A3B8';
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
          >
            上传SVG
          </button>

          {!isAnimating ? (
            <button
              style={primaryBtnStyle}
              onClick={handlePreviewAnimation}
              disabled={points.length < 2}
              onMouseEnter={(e) => {
                if (points.length >= 2) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = points.length >= 2 ? '#6366F1' : '#94A3B8';
              }}
              onMouseDown={(e) => {
                if (points.length >= 2) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                if (points.length >= 2) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }
              }}
            >
              预览动画
            </button>
          ) : (
            <button
              style={{ ...primaryBtnStyle, backgroundColor: '#EC4899' }}
              onClick={handleStopAnimation}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#DB2777';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EC4899';
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }}
            >
              停止动画
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#475569' }}>速度:</span>
            <select
              style={selectStyle}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </div>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            循环播放
          </label>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 12, color: '#64748B' }}>
            锚点数: {points.length}
          </span>
        </div>

        <div style={canvasWrapperStyle}>
          <div style={{ position: 'relative' }}>
            <svg
              ref={svgRef}
              width={VIEWPORT_WIDTH}
              height={VIEWPORT_HEIGHT}
              viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
              style={svgStyle}
              onClick={handleCanvasClick}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect
                className="canvas-bg"
                width={VIEWPORT_WIDTH}
                height={VIEWPORT_HEIGHT}
                fill="url(#grid)"
              />

              {pathString && (
                <path
                  ref={pathRef}
                  d={pathString}
                  stroke={isAnimating ? currentStrokeColor : '#6366F1'}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {!isAnimating && points.map((point, index) => (
                <g key={index}>
                  {point.handleIn && index > 0 && (
                    <>
                      <line
                        x1={point.x}
                        y1={point.y}
                        x2={point.handleIn.x}
                        y2={point.handleIn.y}
                        stroke="#9CA3AF"
                        strokeWidth={1}
                        strokeDasharray="4,2"
                      />
                      <circle
                        cx={point.handleIn.x}
                        cy={point.handleIn.y}
                        r={4}
                        fill="#A855F7"
                        stroke="#FFFFFF"
                        strokeWidth={1}
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => handleHandleMouseDown(index, 'handleIn', e)}
                      />
                    </>
                  )}

                  {point.handleOut && index < points.length - 1 && (
                    <>
                      <line
                        x1={point.x}
                        y1={point.y}
                        x2={point.handleOut.x}
                        y2={point.handleOut.y}
                        stroke="#9CA3AF"
                        strokeWidth={1}
                        strokeDasharray="4,2"
                      />
                      <circle
                        cx={point.handleOut.x}
                        cy={point.handleOut.y}
                        r={4}
                        fill="#A855F7"
                        stroke="#FFFFFF"
                        strokeWidth={1}
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => handleHandleMouseDown(index, 'handleOut', e)}
                      />
                    </>
                  )}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={selectedIndex === index ? 8 : 6}
                    fill={selectedIndex === index ? '#4F46E5' : '#6366F1'}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => handleAnchorMouseDown(index, e)}
                  />
                </g>
              ))}
            </svg>

            {points.length === 0 && !isAnimating && (
              <div style={hintStyle}>
                点击画布添加锚点开始绘制路径
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default SVGEditor;
