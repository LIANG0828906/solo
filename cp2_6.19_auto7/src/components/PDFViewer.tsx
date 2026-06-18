import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { fabric } from 'fabric';
import { AnnotationType, Annotation, CommentThread, PenAnnotation, RectAnnotation, TextAnnotation } from '../utils/annotationManager';
import { annotationManager } from '../utils/annotationManager';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  currentPage: number;
  currentTool: AnnotationType;
  currentColor: string;
  highlightedThreadId: string | null;
  onPageChange: (page: number) => void;
  onNumPages: (numPages: number) => void;
  onAnchorClick: (threadId: string) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  annotationId: string | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  currentPage,
  currentTool,
  currentColor,
  highlightedThreadId,
  onPageChange,
  onNumPages,
  onAnchorClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [pdfFile, setPdfFile] = useState<string>('/sample.pdf');
  const [isDrawing, setIsDrawing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    annotationId: null,
  });
  const drawingPathRef = useRef<fabric.Path | null>(null);
  const drawingRectRef = useRef<fabric.Rect | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [, forceUpdate] = useState(0);

  const annotations = useMemo(() => annotationManager.getAnnotationsByPage(currentPage), [currentPage]);
  const threads = useMemo(() => annotationManager.getThreadsByPage(currentPage), [currentPage]);

  useEffect(() => {
    const unsubscribe = annotationManager.subscribe(() => {
      forceUpdate((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      onNumPages(numPages);
    },
    [onNumPages]
  );

  const handlePageLoadSuccess = useCallback((page: { width: number; height: number }) => {
    setPageWidth(page.width * 1.5);
    setPageHeight(page.height * 1.5);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !pageWidth || !pageHeight) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: pageWidth,
      height: pageHeight,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: 'transparent',
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [pageWidth, pageHeight]);

  const renderAnnotations = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricObjects = canvas.getObjects() as fabric.Object[];
    const existingIds = new Set(fabricObjects.map((obj: fabric.Object) => (obj as any).annotationId));

    annotations.forEach((annotation) => {
      if (existingIds.has(annotation.id)) return;

      let fabricObj: fabric.Object | null = null;

      if (annotation.type === 'pen') {
        const points = annotation.points;
        if (points.length < 2) return;

        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }

        fabricObj = new fabric.Path(pathData, {
          stroke: annotation.color,
          strokeWidth: (annotation as PenAnnotation).strokeWidth,
          fill: 'transparent',
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
      } else if (annotation.type === 'rect' || annotation.type === 'highlight') {
        const rectAnn = annotation as RectAnnotation;
        fabricObj = new fabric.Rect({
          left: rectAnn.x,
          top: rectAnn.y,
          width: rectAnn.width,
          height: rectAnn.height,
          fill: annotation.type === 'highlight' ? 'rgba(255, 235, 59, 0.4)' : 'transparent',
          stroke: annotation.color,
          strokeWidth: rectAnn.strokeWidth,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
      } else if (annotation.type === 'text') {
        const textAnn = annotation as TextAnnotation;
        fabricObj = new fabric.IText(textAnn.text, {
          left: textAnn.x,
          top: textAnn.y,
          fontSize: textAnn.fontSize,
          fill: annotation.color,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          editable: true,
        });
      }

      if (fabricObj) {
        (fabricObj as any).annotationId = annotation.id;
        (fabricObj as any).annotationType = annotation.type;
        canvas.add(fabricObj);
      }
    });

    canvas.renderAll();
  }, [annotations]);

  const renderAnchors = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects() as fabric.Object[];
    objects.forEach((obj: fabric.Object) => {
      if ((obj as any).isAnchor) {
        canvas.remove(obj);
      }
    });

    threads.forEach((thread, index) => {
      const anchor = new fabric.Circle({
        left: thread.anchorX - 12,
        top: thread.anchorY - 12,
        radius: 12,
        fill: '#f44336',
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'pointer',
      });

      const text = new fabric.Text(String(index + 1), {
        left: thread.anchorX - 12,
        top: thread.anchorY - 12,
        fontSize: 12,
        fill: '#ffffff',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        hasControls: false,
        hasBorders: false,
      });

      const group = new fabric.Group([anchor, text], {
        left: thread.anchorX - 12,
        top: thread.anchorY - 12,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'pointer',
      });

      (group as any).isAnchor = true;
      (group as any).threadId = thread.id;

      if (highlightedThreadId === thread.id) {
        group.set({
          scaleX: 1.3,
          scaleY: 1.3,
        });
      }

      canvas.add(group);
    });

    canvas.renderAll();
  }, [threads, highlightedThreadId]);

  useEffect(() => {
    if (fabricCanvasRef.current && pageWidth > 0) {
      renderAnnotations();
    }
  }, [annotations, renderAnnotations, pageWidth]);

  useEffect(() => {
    if (fabricCanvasRef.current && pageWidth > 0) {
      renderAnchors();
    }
  }, [threads, highlightedThreadId, renderAnchors, pageWidth]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const cursorMap: Record<AnnotationType, string> = {
      pen: 'crosshair',
      rect: 'crosshair',
      text: 'text',
      highlight: 'crosshair',
    };

    canvas.defaultCursor = cursorMap[currentTool];
    canvas.hoverCursor = cursorMap[currentTool];
  }, [currentTool]);

  const getMousePos = useCallback((e: fabric.IEvent): { x: number; y: number } => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const pointer = canvas.getPointer(e.e);
    return { x: pointer.x, y: pointer.y };
  }, []);

  const handleMouseDown = useCallback(
    (e: fabric.IEvent) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const target = e.target;

      if (target && (target as any).isAnchor) {
        const threadId = (target as any).threadId;
        if (threadId) {
          onAnchorClick(threadId);
        }
        return;
      }

      if (e.button === 3) {
        e.e.preventDefault();
        if (target) {
          const annotationId = (target as any).annotationId;
          if (annotationId) {
            const rect = canvas.lowerCanvasEl.getBoundingClientRect();
            setContextMenu({
              visible: true,
              x: e.e.clientX - rect.left,
              y: e.e.clientY - rect.top,
              annotationId: annotationId,
            });
          }
        }
        return;
      }

      if (e.button !== 0) return;
      if (target) return;

      const pos = getMousePos(e);
      setIsDrawing(true);
      startPosRef.current = pos;

      if (currentTool === 'pen') {
        const path = new fabric.Path(`M ${pos.x} ${pos.y}`, {
          stroke: currentColor,
          strokeWidth: 3,
          fill: 'transparent',
          selectable: false,
          hasControls: false,
          hasBorders: false,
          evented: false,
        });
        drawingPathRef.current = path;
        canvas.add(path);
      } else if (currentTool === 'rect' || currentTool === 'highlight') {
        const rect = new fabric.Rect({
          left: pos.x,
          top: pos.y,
          width: 0,
          height: 0,
          fill: currentTool === 'highlight' ? 'rgba(255, 235, 59, 0.4)' : 'transparent',
          stroke: currentTool === 'highlight' ? 'transparent' : currentColor,
          strokeWidth: 2,
          selectable: false,
          hasControls: false,
          hasBorders: false,
          evented: false,
        });
        drawingRectRef.current = rect;
        canvas.add(rect);
      } else if (currentTool === 'text') {
        const text = new fabric.IText('双击编辑文字', {
          left: pos.x,
          top: pos.y,
          fontSize: 18,
          fill: currentColor,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });
        const annotationId = `temp-${Date.now()}`;
        (text as any).annotationId = annotationId;
        (text as any).annotationType = 'text';

        annotationManager.addAnnotation({
          page: currentPage,
          type: 'text',
          color: currentColor,
          x: pos.x,
          y: pos.y,
          text: '双击编辑文字',
          fontSize: 18,
        } as TextAnnotation);

        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        setIsDrawing(false);
      }

      canvas.selection = false;
    },
    [currentTool, currentColor, currentPage, getMousePos, onAnchorClick]
  );

  const handleMouseMove = useCallback(
    (e: fabric.IEvent) => {
      if (!isDrawing) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas || !startPosRef.current) return;

      const pos = getMousePos(e);
      const start = startPosRef.current;

      if (currentTool === 'pen' && drawingPathRef.current) {
        const path = drawingPathRef.current;
        const currentPath = path.path || [];
        currentPath.push(new fabric.Point(pos.x, pos.y) as any);
        path.set({ path: currentPath });
      } else if ((currentTool === 'rect' || currentTool === 'highlight') && drawingRectRef.current) {
        const rect = drawingRectRef.current;
        const width = pos.x - start.x;
        const height = pos.y - start.y;

        rect.set({
          left: width >= 0 ? start.x : pos.x,
          top: height >= 0 ? start.y : pos.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      }

      canvas.renderAll();
    },
    [isDrawing, currentTool, getMousePos]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsDrawing(false);

    if (currentTool === 'pen' && drawingPathRef.current) {
      const path = drawingPathRef.current;
      const points = (path.path as any[]).map((p: any) => ({
        x: p.x ?? p[1],
        y: p.y ?? p[2],
      }));

      if (points.length >= 2) {
        annotationManager.addAnnotation({
          page: currentPage,
          type: 'pen',
          color: currentColor,
          points,
          strokeWidth: 3,
        } as PenAnnotation);
      }

      canvas.remove(path);
      drawingPathRef.current = null;
    } else if ((currentTool === 'rect' || currentTool === 'highlight') && drawingRectRef.current) {
      const rect = drawingRectRef.current;
      const width = rect.width || 0;
      const height = rect.height || 0;

      if (width > 5 && height > 5) {
        annotationManager.addAnnotation({
          page: currentPage,
          type: currentTool,
          color: currentColor,
          x: rect.left || 0,
          y: rect.top || 0,
          width,
          height,
          strokeWidth: 2,
        } as RectAnnotation);
      }

      canvas.remove(rect);
      drawingRectRef.current = null;
    }

    startPosRef.current = null;
    canvas.selection = true;
    renderAnnotations();
    renderAnchors();
  }, [isDrawing, currentTool, currentColor, currentPage, renderAnnotations, renderAnchors]);

  const handleObjectModified = useCallback(
    (e: fabric.IEvent) => {
      const target = e.target;
      if (!target) return;

      const annotationId = (target as any).annotationId;
      if (!annotationId) return;

      const annotation = annotationManager.getAnnotation(annotationId);
      if (!annotation) return;

      if (annotation.type === 'pen') {
        const scaleX = target.scaleX || 1;
        const scaleY = target.scaleY || 1;
        const left = target.left || 0;
        const top = target.top || 0;

        const newPoints = annotation.points.map((p) => ({
          x: left + p.x * scaleX,
          y: top + p.y * scaleY,
        }));

        annotationManager.updateAnnotation(annotationId, {
          points: newPoints,
        } as Partial<PenAnnotation>);

        target.set({ scaleX: 1, scaleY: 1 });
        const pathData = `M ${newPoints[0].x} ${newPoints[0].y}` +
          newPoints.slice(1).map((p) => ` L ${p.x} ${p.y}`).join('');
        (target as fabric.Path).set({ path: pathData } as any);
      } else if (annotation.type === 'rect' || annotation.type === 'highlight') {
        const scaleX = target.scaleX || 1;
        const scaleY = target.scaleY || 1;
        const width = (annotation as RectAnnotation).width * scaleX;
        const height = (annotation as RectAnnotation).height * scaleY;

        annotationManager.updateAnnotation(annotationId, {
          x: target.left || 0,
          y: target.top || 0,
          width: Math.abs(width),
          height: Math.abs(height),
        } as Partial<RectAnnotation>);

        target.set({
          scaleX: 1,
          scaleY: 1,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (annotation.type === 'text') {
        annotationManager.updateAnnotation(annotationId, {
          x: target.left || 0,
          y: target.top || 0,
          text: (target as fabric.IText).text || '',
          fontSize: (target as fabric.IText).fontSize || 18,
        } as Partial<TextAnnotation>);
      }
    },
    []
  );

  const handleDoubleClick = useCallback(
    (e: fabric.IEvent) => {
      const target = e.target;
      if (!target) return;

      const annotationId = (target as any).annotationId;
      if (!annotationId) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      target.animate(
        { opacity: 0, scaleX: 0, scaleY: 0 },
        {
          duration: 300,
          easing: (t: number, b: number, c: number, d: number) => {
            return c * (t /= d) * t + b;
          },
          onComplete: () => {
            annotationManager.deleteAnnotation(annotationId);
            renderAnnotations();
            renderAnchors();
          },
        }
      );
    },
    [renderAnnotations, renderAnchors]
  );

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleObjectModified, handleDoubleClick]);

  const handleContextClose = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, annotationId: null });
  }, []);

  const handleAddComment = useCallback(() => {
    if (!contextMenu.annotationId) return;

    const annotation = annotationManager.getAnnotation(contextMenu.annotationId);
    if (!annotation) return;

    let anchorX = 0;
    let anchorY = 0;

    if (annotation.type === 'pen') {
      const points = annotation.points;
      anchorX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      anchorY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    } else if (annotation.type === 'rect' || annotation.type === 'highlight') {
      anchorX = annotation.x + annotation.width / 2;
      anchorY = annotation.y + annotation.height / 2;
    } else if (annotation.type === 'text') {
      anchorX = annotation.x;
      anchorY = annotation.y;
    }

    const thread = annotationManager.addThread({
      annotationId: annotation.id,
      page: currentPage,
      anchorX,
      anchorY,
    });

    onAnchorClick(thread.id);
    handleContextClose();
  }, [contextMenu.annotationId, currentPage, onAnchorClick, handleContextClose]);

  const handleDuplicate = useCallback(() => {
    if (!contextMenu.annotationId) return;
    annotationManager.duplicateAnnotation(contextMenu.annotationId);
    handleContextClose();
  }, [contextMenu.annotationId, handleContextClose]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleContextClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible, handleContextClose]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY > 0) {
        annotationManager.getAnnotationsByPage(currentPage + 1);
      }
    },
    [currentPage]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastDelta = 0;
    let timeoutId: number | null = null;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;

      if (Math.abs(delta) > 30) {
        if (delta > 0 && delta !== lastDelta) {
          onPageChange(Math.min(currentPage + 1, 999));
        } else if (delta < 0 && delta !== lastDelta) {
          onPageChange(Math.max(currentPage - 1, 1));
        }
        lastDelta = delta;
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        lastDelta = 0;
      }, 200);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [currentPage, onPageChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfFile(url);
    }
  }, []);

  return (
    <div ref={containerRef} style={styles.container} onWheel={handleWheel}>
      <div style={styles.uploadBar}>
        <label style={styles.uploadLabel}>
          <span style={styles.uploadIcon}>📄</span>
          上传 PDF
          <input type="file" accept=".pdf" style={styles.uploadInput} onChange={handleFileChange} />
        </label>
      </div>

      <div style={styles.pdfWrapper}>
        <Document
          file={pdfFile}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<div style={styles.loading}>加载中...</div>}
          error={<div style={styles.error}>加载失败，请确保 /sample.pdf 文件存在</div>}
        >
          <div style={styles.pageContainer}>
            <Page
              pageNumber={currentPage}
              scale={1.5}
              onLoadSuccess={handlePageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            {canvasRef.current && (
              <canvas
                ref={canvasRef}
                style={{
                  ...styles.canvas,
                  width: pageWidth,
                  height: pageHeight,
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}

            {contextMenu.visible && (
              <div
                style={{
                  ...styles.contextMenu,
                  left: contextMenu.x,
                  top: contextMenu.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={styles.contextMenuItem} onClick={handleAddComment}>
                  <span>💬</span> 添加批注
                </div>
                <div style={styles.contextMenuItem} onClick={handleDuplicate}>
                  <span>📋</span> 复制标注
                </div>
              </div>
            )}
          </div>
        </Document>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'auto',
    position: 'relative',
  },
  uploadBar: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  uploadLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#333',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.15s ease-out',
  },
  uploadIcon: {
    fontSize: '16px',
  },
  uploadInput: {
    display: 'none',
  },
  pdfWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 20px 20px',
    position: 'relative',
  },
  pageContainer: {
    position: 'relative',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#ffffff',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'auto',
  },
  loading: {
    padding: '40px',
    color: '#666',
  },
  error: {
    padding: '40px',
    color: '#f44336',
  },
  contextMenu: {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '4px 0',
    minWidth: '120px',
    animation: 'fadeInScale 0.15s ease-out',
  },
  contextMenuItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.1s ease-out',
  },
};

export default PDFViewer;
