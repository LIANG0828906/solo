import React, { useState, useRef, useEffect, useCallback } from 'react';
import MorphEngine, { Point, FontOutline, EasingFunction } from './MorphEngine';
import BezierEditor from './BezierEditor';

const BUILTIN_FONTS = [
  { value: 'serif', label: '衬线字体 (Serif)' },
  { value: 'sans-serif', label: '无衬线字体 (Sans-serif)' },
  { value: 'monospace', label: '等宽字体 (Monospace)' },
  { value: 'cursive', label: '手写字体 (Cursive)' },
  { value: 'fantasy', label: '装饰字体 (Fantasy)' }
];

const DEFAULT_CONTROL_POINTS: [Point, Point] = [
  { x: 0.42, y: 0 },
  { x: 0.58, y: 1 }
];

const App: React.FC = () => {
  const [startFont, setStartFont] = useState<string>('serif');
  const [endFont, setEndFont] = useState<string>('sans-serif');
  const [text, setText] = useState<string>('Hello');
  const [controlPoints, setControlPoints] = useState<[Point, Point]>(DEFAULT_CONTROL_POINTS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [controlPointCount, setControlPointCount] = useState<number>(50);
  const [customFonts, setCustomFonts] = useState<Map<string, string>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [leftWidth, setLeftWidth] = useState<number>(25);
  const [middleWidth, setMiddleWidth] = useState<number>(60);
  const [rightWidth, setRightWidth] = useState<number>(15);
  const [draggingDivider, setDraggingDivider] = useState<'left' | 'right' | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const extractionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const directionRef = useRef<number>(1);
  const pauseTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startOutlineRef = useRef<FontOutline | null>(null);
  const endOutlineRef = useRef<FontOutline | null>(null);
  const easingFnRef = useRef<EasingFunction | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    extractionCanvasRef.current = canvas;

    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      console.log('[FontMorph] WebGL2 is supported, using hardware acceleration');
    } else {
      console.log('[FontMorph] WebGL2 not supported, falling back to Canvas2D');
    }
  }, []);

  useEffect(() => {
    easingFnRef.current = MorphEngine.createEasingFromBezier(
      controlPoints[0].x, controlPoints[0].y,
      controlPoints[1].x, controlPoints[1].y
    );
  }, [controlPoints]);

  useEffect(() => {
    MorphEngine.setControlPoints(controlPointCount);
  }, [controlPointCount]);

  const extractOutlines = useCallback(() => {
    const canvas = extractionCanvasRef.current;
    if (!canvas) return;

    const startFontFamily = customFonts.get(startFont) || startFont;
    const endFontFamily = customFonts.get(endFont) || endFont;
    const fontSize = 120;

    startOutlineRef.current = MorphEngine.extractOutline(text, startFontFamily, fontSize, canvas);
    endOutlineRef.current = MorphEngine.extractOutline(text, endFontFamily, fontSize, canvas);
  }, [text, startFont, endFont, customFonts]);

  const render = useCallback((progress: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!startOutlineRef.current || !endOutlineRef.current) {
      extractOutlines();
      return;
    }

    const baseEasing = easingFnRef.current || MorphEngine.linearEase;
    const easedProgress = MorphEngine.elasticEaseInOut(baseEasing(progress));

    const morphed = MorphEngine.morph(
      startOutlineRef.current,
      endOutlineRef.current,
      easedProgress
    );

    const scale = Math.min(
      (rect.width - 80) / Math.max(morphed.width, 1),
      (rect.height - 80) / Math.max(morphed.height, 1)
    );

    const offsetX = (rect.width - morphed.width * scale) / 2;
    const offsetY = (rect.height - morphed.height * scale) / 2;

    ctx.fillStyle = '#4FC3F7';
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 2;

    for (const glyph of morphed.glyphs) {
      if (glyph.points.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(
        offsetX + glyph.points[0].x * scale,
        offsetY + glyph.points[0].y * scale
      );

      for (let i = 1; i < glyph.points.length; i++) {
        ctx.lineTo(
          offsetX + glyph.points[i].x * scale,
          offsetY + glyph.points[i].y * scale
        );
      }

      if (glyph.closed) {
        ctx.closePath();
      }

      ctx.fill();
      ctx.stroke();
    }
  }, [extractOutlines]);

  useEffect(() => {
    extractOutlines();
  }, [extractOutlines]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
      isPausedRef.current = false;
      pauseTimeRef.current = 0;

      const animate = (timestamp: number) => {
        if (isPausedRef.current) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const ANIMATION_DURATION = 3000;
        const PAUSE_DURATION = 500;

        let elapsed = timestamp - startTimeRef.current;

        if (pauseTimeRef.current > 0) {
          startTimeRef.current = timestamp - pauseTimeRef.current;
          elapsed = pauseTimeRef.current;
          pauseTimeRef.current = 0;
        }

        const cycleDuration = ANIMATION_DURATION * 2 + PAUSE_DURATION * 2;
        const cyclePosition = elapsed % cycleDuration;

        let progress: number;
        let direction: number;

        if (cyclePosition < ANIMATION_DURATION) {
          progress = cyclePosition / ANIMATION_DURATION;
          direction = 1;
        } else if (cyclePosition < ANIMATION_DURATION + PAUSE_DURATION) {
          progress = 1;
          direction = 1;
        } else if (cyclePosition < ANIMATION_DURATION * 2 + PAUSE_DURATION) {
          progress = 1 - (cyclePosition - ANIMATION_DURATION - PAUSE_DURATION) / ANIMATION_DURATION;
          direction = -1;
        } else {
          progress = 0;
          direction = -1;
        }

        progressRef.current = progress;
        directionRef.current = direction;
        render(progress);

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        pauseTimeRef.current = (performance.now() - startTimeRef.current);
        isPausedRef.current = true;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, render]);

  useEffect(() => {
    if (!isPlaying) {
      render(progressRef.current);
    }
  }, [isPlaying, render]);

  useEffect(() => {
    const handleResize = () => {
      if (!isPlaying) {
        render(progressRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPlaying, render]);

  const handleDividerMouseDown = (divider: 'left' | 'right') => {
    setDraggingDivider(divider);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingDivider || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const totalWidth = rect.width;
    const mouseX = e.clientX - rect.left;
    const percentage = (mouseX / totalWidth) * 100;

    if (draggingDivider === 'left') {
      const newLeft = Math.max(15, Math.min(percentage - 1, 40));
      const remaining = 100 - newLeft;
      const newRight = Math.max(10, Math.min(rightWidth, remaining - 45));
      const newMiddle = 100 - newLeft - newRight;

      if (newMiddle >= 45) {
        setLeftWidth(newLeft);
        setMiddleWidth(newMiddle);
        setRightWidth(newRight);
      }
    } else if (draggingDivider === 'right') {
      const newRight = Math.max(10, Math.min(100 - percentage - 1, 30));
      const remaining = 100 - newRight;
      const newLeft = Math.max(15, Math.min(leftWidth, remaining - 45));
      const newMiddle = 100 - newLeft - newRight;

      if (newMiddle >= 45) {
        setLeftWidth(newLeft);
        setMiddleWidth(newMiddle);
        setRightWidth(newRight);
      }
    }
  }, [draggingDivider, leftWidth, rightWidth]);

  const handleMouseUp = useCallback(() => {
    setDraggingDivider(null);
  }, []);

  useEffect(() => {
    if (draggingDivider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingDivider, handleMouseMove, handleMouseUp]);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('字体文件大小不能超过5MB');
      return;
    }

    const fontName = `custom_${type}_${Date.now()}`;
    setUploadProgress(prev => new Map(prev).set(fontName, 0));

    try {
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(prev => new Map(prev).set(fontName, 50));

      const fontFace = new FontFace(fontName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      setCustomFonts(prev => new Map(prev).set(type === 'start' ? startFont : endFont, fontName));
      setUploadProgress(prev => new Map(prev).set(fontName, 100));

      setTimeout(() => {
        setUploadProgress(prev => {
          const next = new Map(prev);
          next.delete(fontName);
          return next;
        });
      }, 1000);

      extractOutlines();
    } catch (error) {
      console.error('字体加载失败:', error);
      alert('字体加载失败，请确保是有效的woff2格式文件');
      setUploadProgress(prev => {
        const next = new Map(prev);
        next.delete(fontName);
        return next;
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value.slice(0, 20);
    setText(newText);
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      text,
      startFont,
      endFont,
      controlPoints,
      controlPointCount,
      animationDuration: 3000,
      pauseDuration: 500,
      easing: {
        type: 'cubic-bezier',
        values: [controlPoints[0].x, controlPoints[0].y, controlPoints[1].x, controlPoints[1].y]
      },
      keyframes: [] as Array<{ progress: number; easingValue: number }>
    };

    const easing = MorphEngine.createEasingFromBezier(
      controlPoints[0].x, controlPoints[0].y,
      controlPoints[1].x, controlPoints[1].y
    );

    for (let i = 0; i <= 60; i++) {
      const progress = i / 60;
      exportData.keyframes.push({
        progress,
        easingValue: MorphEngine.elasticEaseInOut(easing(progress))
      });
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fontMorph_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetBezier = () => {
    setControlPoints(DEFAULT_CONTROL_POINTS);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const fontOptions = (_current: string) => [
    ...BUILTIN_FONTS,
    ...Array.from(customFonts.entries())
      .filter(([key]) => key === startFont || key === endFont)
      .map(([key]) => ({ value: key, label: `自定义: ${key}` }))
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: 64,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E0E0E0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 18
          }}>
            F
          </div>
          <h1 style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#2C3E50',
            margin: 0
          }}>
            字体变形动画生成器
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handlePlayToggle}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              background: isPlaying
                ? '#E53935'
                : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 100
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 24px',
              border: '1px solid #DEE2E6',
              borderRadius: 8,
              backgroundColor: '#F8F9FA',
              color: '#495057',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E9ECEF';
              e.currentTarget.style.borderColor = '#ADB5BD';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8F9FA';
              e.currentTarget.style.borderColor = '#DEE2E6';
            }}
          >
            ⬇ 导出 JSON
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${leftWidth}%`,
          backgroundColor: '#F8F9FA',
          borderRight: '1px solid #DEE2E6',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#2C3E50',
            margin: '0 0 20px 0',
            paddingBottom: 12,
            borderBottom: '1px solid #DEE2E6'
          }}>
            字体与参数设置
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#495057',
                marginBottom: 8
              }}>
                起始字体
              </label>
              <select
                value={startFont}
                onChange={(e) => setStartFont(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #DEE2E6',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: '#FFFFFF',
                  color: '#495057',
                  cursor: 'pointer',
                  fontFamily: startFont === 'serif' ? 'serif' :
                              startFont === 'sans-serif' ? 'sans-serif' :
                              startFont === 'monospace' ? 'monospace' :
                              startFont === 'cursive' ? 'cursive' :
                              startFont === 'fantasy' ? 'fantasy' : 'inherit'
                }}
              >
                {fontOptions(startFont).map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept=".woff2"
                  onChange={(e) => handleFontUpload(e, 'start')}
                  style={{ display: 'none' }}
                  id="startFontUpload"
                />
                <label
                  htmlFor="startFontUpload"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    border: '1px dashed #ADB5BD',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#6C757D',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E9ECEF';
                    e.currentTarget.style.borderColor = '#6C757D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#ADB5BD';
                  }}
                >
                  + 上传自定义字体 (woff2, ≤5MB)
                </label>
                {Array.from(uploadProgress.entries()).map(([name, progress]) => (
                  name.startsWith('custom_start') && (
                    <div key={name} style={{ marginTop: 8 }}>
                      <div style={{
                        height: 4,
                        backgroundColor: '#DEE2E6',
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          backgroundColor: '#4FC3F7',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#6C757D', marginTop: 4 }}>
                        {progress < 100 ? `加载中... ${progress}%` : '加载完成 ✓'}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#495057',
                marginBottom: 8
              }}>
                结束字体
              </label>
              <select
                value={endFont}
                onChange={(e) => setEndFont(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #DEE2E6',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: '#FFFFFF',
                  color: '#495057',
                  cursor: 'pointer',
                  fontFamily: endFont === 'serif' ? 'serif' :
                              endFont === 'sans-serif' ? 'sans-serif' :
                              endFont === 'monospace' ? 'monospace' :
                              endFont === 'cursive' ? 'cursive' :
                              endFont === 'fantasy' ? 'fantasy' : 'inherit'
                }}
              >
                {fontOptions(endFont).map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept=".woff2"
                  onChange={(e) => handleFontUpload(e, 'end')}
                  style={{ display: 'none' }}
                  id="endFontUpload"
                />
                <label
                  htmlFor="endFontUpload"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    border: '1px dashed #ADB5BD',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#6C757D',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E9ECEF';
                    e.currentTarget.style.borderColor = '#6C757D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#ADB5BD';
                  }}
                >
                  + 上传自定义字体 (woff2, ≤5MB)
                </label>
                {Array.from(uploadProgress.entries()).map(([name, progress]) => (
                  name.startsWith('custom_end') && (
                    <div key={name} style={{ marginTop: 8 }}>
                      <div style={{
                        height: 4,
                        backgroundColor: '#DEE2E6',
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          backgroundColor: '#4FC3F7',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#6C757D', marginTop: 4 }}>
                        {progress < 100 ? `加载中... ${progress}%` : '加载完成 ✓'}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#495057',
                marginBottom: 8
              }}>
                预览文字 ({text.length}/20)
              </label>
              <input
                type="text"
                value={text}
                onChange={handleTextChange}
                maxLength={20}
                placeholder="输入要变形的文字..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #DEE2E6',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: '#FFFFFF',
                  color: '#495057',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4FC3F7';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#DEE2E6';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#495057',
                marginBottom: 8
              }}>
                轮廓控制点数量: {controlPointCount}
              </label>
              <input
                type="range"
                min={10}
                max={200}
                value={controlPointCount}
                onChange={(e) => setControlPointCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  background: '#DEE2E6',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#ADB5BD',
                marginTop: 4
              }}>
                <span>10 (简洁)</span>
                <span>200 (精细)</span>
              </div>
            </div>

            <div style={{
              padding: 12,
              backgroundColor: '#E3F2FD',
              borderRadius: 6,
              fontSize: 12,
              color: '#1565C0'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 使用提示</div>
              <div>选择两种不同风格的字体，调整贝塞尔曲线控制点来改变动画节奏，点击播放按钮预览变形效果。</div>
            </div>
          </div>
        </div>

        <div
          style={{
            width: 2,
            backgroundColor: draggingDivider === 'left' ? '#4FC3F7' : '#2C3E50',
            cursor: draggingDivider === 'left' ? 'col-resize' : 'col-resize',
            transition: 'background-color 0.2s',
            flexShrink: 0,
            zIndex: 10
          }}
          onMouseDown={() => handleDividerMouseDown('left')}
          onMouseEnter={(e) => {
            if (!draggingDivider) {
              e.currentTarget.style.backgroundColor = '#4FC3F7';
            }
          }}
          onMouseLeave={(e) => {
            if (!draggingDivider) {
              e.currentTarget.style.backgroundColor = '#2C3E50';
            }
          }}
        />

        <div style={{
          width: `${middleWidth}%`,
          backgroundColor: '#1E1E1E',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: 12,
            backgroundColor: '#1E1E1E',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <canvas
              ref={previewCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
            {!isPlaying && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 16px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: 20,
                fontSize: 12,
                color: '#FFFFFF',
                pointerEvents: 'none'
              }}>
                点击播放按钮开始动画
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            width: 2,
            backgroundColor: draggingDivider === 'right' ? '#4FC3F7' : '#2C3E50',
            cursor: draggingDivider === 'right' ? 'col-resize' : 'col-resize',
            transition: 'background-color 0.2s',
            flexShrink: 0,
            zIndex: 10
          }}
          onMouseDown={() => handleDividerMouseDown('right')}
          onMouseEnter={(e) => {
            if (!draggingDivider) {
              e.currentTarget.style.backgroundColor = '#4FC3F7';
            }
          }}
          onMouseLeave={(e) => {
            if (!draggingDivider) {
              e.currentTarget.style.backgroundColor = '#2C3E50';
            }
          }}
        />

        <div style={{
          width: `${rightWidth}%`,
          backgroundColor: '#F8F9FA',
          borderLeft: '1px solid #DEE2E6',
          overflowY: 'auto'
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#2C3E50',
            margin: '20px 16px 0 16px',
            paddingBottom: 12,
            borderBottom: '1px solid #DEE2E6'
          }}>
            动画曲线编辑
          </h2>
          <BezierEditor
            controlPoints={controlPoints}
            onChange={setControlPoints}
            onReset={handleResetBezier}
          />
          <div style={{
            padding: '0 16px 16px 16px',
            fontSize: 12,
            color: '#6C757D',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 600, color: '#495057', marginBottom: 8 }}>
              曲线说明
            </div>
            <div>拖拽两个蓝色控制点来调整动画的时间曲线。X轴代表时间进度(0-1)，Y轴代表变形进度(0-1)。</div>
            <div style={{ marginTop: 8 }}>
              <strong>默认值:</strong> ease-in-out (0.42, 0) → (0.58, 1)
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>附加效果:</strong> 0.2s 弹性缓入缓出
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
