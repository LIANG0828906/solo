import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDefectStore } from '@/utils/defectStore';
import type { Annotation, AnnotationTool, DefectCategory, DefectSeverity } from '@/utils/types';
import { DEFECT_CATEGORIES, DEFECT_SEVERITIES } from '@/utils/types';
import { Upload, Square, Circle, Pencil, Trash2, GripVertical, X, Save, ImageIcon } from 'lucide-react';

export default function InspectionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [brushPoints, setBrushPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggingAnnotationId, setDraggingAnnotationId] = useState<string | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [panelDragOffset, setPanelDragOffset] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    annotations,
    selectedAnnotationId,
    currentTool,
    panelOpen,
    panelPosition,
    editingAnnotation,
    imageUrl,
    imageName,
    setCurrentTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setPanelOpen,
    setPanelPosition,
    setEditingAnnotation,
    setImageUrl,
    getNextLabelNumber,
    submitDefects,
    clearAnnotations,
  } = useDefectStore();

  const [formCategory, setFormCategory] = useState<DefectCategory>('裂痕');
  const [formSeverity, setFormSeverity] = useState<DefectSeverity>('轻微');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (CANVAS_WIDTH - w) / 2;
        const y = (CANVAS_HEIGHT - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        drawAnnotations(ctx);
        if (isDrawing) drawCurrentShape(ctx);
      };
      img.src = imageUrl;
      if (img.complete) {
        const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (CANVAS_WIDTH - w) / 2;
        const y = (CANVAS_HEIGHT - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        drawAnnotations(ctx);
        if (isDrawing) drawCurrentShape(ctx);
      }
    } else {
      drawAnnotations(ctx);
      if (isDrawing) drawCurrentShape(ctx);
    }
  }, [annotations, selectedAnnotationId, isDrawing, startPos, currentPos, currentTool, brushPoints, imageUrl]);

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations.forEach((ann) => {
      const isSelected = ann.id === selectedAnnotationId;

      ctx.save();
      ctx.fillStyle = '#ef444433';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = isSelected ? 3 : 2;
      if (isSelected) ctx.setLineDash([6, 4]);

      if (ann.tool === 'rectangle' && ann.width !== undefined && ann.height !== undefined) {
        ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      } else if (ann.tool === 'circle' && ann.radius !== undefined) {
        ctx.beginPath();
        ctx.arc(ann.x, ann.y, ann.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      } else if (ann.tool === 'brush' && ann.points && ann.points.length > 0) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }

      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      const labelX = ann.tool === 'circle' ? ann.x - 4 : ann.x;
      const labelY = ann.tool === 'circle' ? ann.y - (ann.radius || 0) - 22 : ann.y - 22;

      const labelText = ann.labelNumber.toString();
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const labelW = textWidth + 12;
      const labelH = 20;

      ctx.beginPath();
      const r = 4;
      ctx.roundRect(labelX, labelY, labelW, labelH, r);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelX + 6, labelY + labelH / 2);

      ctx.restore();
    });
  };

  const drawCurrentShape = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef444433';
    ctx.lineWidth = 2;

    if (currentTool === 'rectangle') {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
    } else if (currentTool === 'circle') {
      const dx = currentPos.x - startPos.x;
      const dy = currentPos.y - startPos.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    } else if (currentTool === 'brush' && brushPoints.length > 0) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(brushPoints[0].x, brushPoints[0].y);
      for (let i = 1; i < brushPoints.length; i++) {
        ctx.lineTo(brushPoints[i].x, brushPoints[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const hitTestAnnotation = (x: number, y: number): Annotation | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];
      if (ann.tool === 'rectangle' && ann.width !== undefined && ann.height !== undefined) {
        if (x >= ann.x && x <= ann.x + ann.width && y >= ann.y && y <= ann.y + ann.height) {
          return ann;
        }
      } else if (ann.tool === 'circle' && ann.radius !== undefined) {
        const dx = x - ann.x;
        const dy = y - ann.y;
        if (dx * dx + dy * dy <= ann.radius * ann.radius) {
          return ann;
        }
      } else if (ann.tool === 'brush' && ann.points) {
        for (const p of ann.points) {
          const dx = x - p.x;
          const dy = y - p.y;
          if (dx * dx + dy * dy <= 25) return ann;
        }
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    const hitAnnotation = hitTestAnnotation(pos.x, pos.y);

    if (hitAnnotation) {
      selectAnnotation(hitAnnotation.id);
      setEditingAnnotation(hitAnnotation);
      setPanelOpen(true);
      setIsDragging(true);
      setDraggingAnnotationId(hitAnnotation.id);
      setDragOffset({
        x: pos.x - hitAnnotation.x,
        y: pos.y - hitAnnotation.y,
      });
      return;
    }

    if (!imageUrl) return;

    selectAnnotation(null);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);

    if (currentTool === 'brush') {
      setBrushPoints([pos]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (isDragging && draggingAnnotationId) {
      const ann = annotations.find((a) => a.id === draggingAnnotationId);
      if (!ann) return;

      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;

      if (ann.tool === 'brush' && ann.points) {
        const dx = newX - ann.x;
        const dy = newY - ann.y;
        const newPoints = ann.points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
        updateAnnotation(draggingAnnotationId, {
          x: newX,
          y: newY,
          points: newPoints,
        });
      } else {
        updateAnnotation(draggingAnnotationId, { x: newX, y: newY });
      }
      return;
    }

    if (!isDrawing) return;
    setCurrentPos(pos);

    if (currentTool === 'brush') {
      setBrushPoints((prev) => [...prev, pos]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggingAnnotationId(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const labelNumber = getNextLabelNumber();

    if (currentTool === 'rectangle') {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);

      if (w < 5 || h < 5) return;

      const annotation: Annotation = {
        id: uuidv4(),
        tool: 'rectangle',
        x,
        y,
        width: w,
        height: h,
        category: formCategory,
        severity: formSeverity,
        labelNumber,
        createdAt: new Date().toISOString(),
      };
      addAnnotation(annotation);
      setEditingAnnotation(annotation);
      setPanelOpen(true);
    } else if (currentTool === 'circle') {
      const dx = currentPos.x - startPos.x;
      const dy = currentPos.y - startPos.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      if (radius < 5) return;

      const annotation: Annotation = {
        id: uuidv4(),
        tool: 'circle',
        x: startPos.x,
        y: startPos.y,
        radius,
        category: formCategory,
        severity: formSeverity,
        labelNumber,
        createdAt: new Date().toISOString(),
      };
      addAnnotation(annotation);
      setEditingAnnotation(annotation);
      setPanelOpen(true);
    } else if (currentTool === 'brush' && brushPoints.length > 2) {
      const minX = Math.min(...brushPoints.map((p) => p.x));
      const minY = Math.min(...brushPoints.map((p) => p.y));

      const annotation: Annotation = {
        id: uuidv4(),
        tool: 'brush',
        x: minX,
        y: minY,
        points: brushPoints,
        category: formCategory,
        severity: formSeverity,
        labelNumber,
        createdAt: new Date().toISOString(),
      };
      addAnnotation(annotation);
      setEditingAnnotation(annotation);
      setPanelOpen(true);
    }

    setBrushPoints([]);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png)/)) {
      alert('仅支持 JPG 和 PNG 格式的图片');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url, file.name);
      clearAnnotations();
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handlePanelMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.panel-handle')) {
      setIsPanelDragging(true);
      setPanelDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanelDragging) {
        setPanelPosition({
          x: e.clientX - panelDragOffset.x,
          y: e.clientY - panelDragOffset.y,
        });
      }
    };
    const handleMouseUp = () => {
      setIsPanelDragging(false);
    };

    if (isPanelDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanelDragging, panelDragOffset, setPanelPosition]);

  const handleFormSubmit = () => {
    if (!editingAnnotation) return;
    updateAnnotation(editingAnnotation.id, {
      category: formCategory,
      severity: formSeverity,
    });
    setPanelOpen(false);
    setEditingAnnotation(null);
  };

  const handleDelete = () => {
    if (!selectedAnnotationId) return;
    deleteAnnotation(selectedAnnotationId);
    setPanelOpen(false);
    setEditingAnnotation(null);
  };

  const handleSubmitAll = async () => {
    if (!imageUrl || annotations.length === 0) return;
    const success = await submitDefects(imageName, imageUrl);
    if (success) {
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);
    }
  };

  useEffect(() => {
    if (editingAnnotation) {
      setFormCategory(editingAnnotation.category);
      setFormSeverity(editingAnnotation.severity);
    }
  }, [editingAnnotation]);

  const tools: { tool: AnnotationTool; label: string; icon: React.ReactNode }[] = [
    { tool: 'rectangle', label: '矩形', icon: <Square size={16} /> },
    { tool: 'circle', label: '圆形', icon: <Circle size={16} /> },
    { tool: 'brush', label: '画笔', icon: <Pencil size={16} /> },
  ];

  return (
    <div className="relative w-full h-full">
      <div className="flex gap-4 mb-4">
        <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
          {tools.map((t) => (
            <button
              key={t.tool}
              onClick={() => setCurrentTool(t.tool)}
              className={`flex items-center gap-2 px-4 h-9 rounded-md text-sm font-medium transition-colors ${
                currentTool === t.tool
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              style={{ height: '36px', borderRadius: '8px' }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium transition-colors"
            style={{ height: '36px' }}
          >
            <ImageIcon size={16} />
            上传图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <button
            onClick={handleSubmitAll}
            disabled={!imageUrl || annotations.length === 0}
            className="flex items-center gap-2 px-4 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: '36px' }}
          >
            <Save size={16} />
            提交记录
          </button>
        </div>

        {annotations.length > 0 && (
          <div className="flex items-center px-3 bg-white rounded-lg shadow-sm text-sm text-gray-600">
            已标注: <span className="font-semibold text-red-500 ml-1">{annotations.length}</span> 个缺陷
          </div>
        )}

        {submitSuccess && (
          <div className="flex items-center px-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-pulse">
            ✓ 提交成功
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative">
        {!imageUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: '150px',
              border: `2px ${isDragOver ? 'solid' : 'dashed'} ${isDragOver ? '#3b82f6' : '#94a3b8'}`,
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
            }}
          >
            <Upload size={32} className={isDragOver ? 'text-blue-500' : 'text-gray-400'} />
            <p className={`mt-2 text-sm ${isDragOver ? 'text-blue-500' : 'text-gray-500'}`}>
              拖拽图片到此处上传
            </p>
            <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="rounded-lg shadow-md cursor-crosshair"
            style={{ backgroundColor: '#f8fafc', cursor: isDragging ? 'move' : 'crosshair' }}
          />
        )}

        {panelOpen && editingAnnotation && (
          <div
            onMouseDown={handlePanelMouseDown}
            className="absolute shadow-lg rounded-lg overflow-hidden"
            style={{
              width: '280px',
              backgroundColor: '#ffffff',
              left: `${panelPosition.x}px`,
              top: `${panelPosition.y}px`,
              zIndex: 100,
              userSelect: 'none',
            }}
          >
            <div
              className="panel-handle flex items-center justify-between px-3 py-2 cursor-move"
              style={{ backgroundColor: '#f1f5f9' }}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">缺陷信息 #{editingAnnotation.labelNumber}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  setEditingAnnotation(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">缺陷类别</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DefectCategory)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    height: '40px',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                  }}
                >
                  {DEFECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">严重等级</label>
                <div className="flex gap-2">
                  {DEFECT_SEVERITIES.map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFormSeverity(sev)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formSeverity === sev
                          ? sev === '严重'
                            ? 'bg-red-500 text-white'
                            : sev === '一般'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ height: '36px', borderRadius: '8px' }}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                  style={{ height: '36px' }}
                >
                  <Trash2 size={14} />
                  删除
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="flex-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                  style={{ height: '36px' }}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {annotations.length > 0 && (
        <div className="mt-4 w-full max-w-[800px]">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">标注列表</h3>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', height: '48px' }}>
                  <th className="text-left px-4 font-semibold text-gray-700">编号</th>
                  <th className="text-left px-4 font-semibold text-gray-700">工具</th>
                  <th className="text-left px-4 font-semibold text-gray-700">类别</th>
                  <th className="text-left px-4 font-semibold text-gray-700">等级</th>
                  <th className="text-right px-4 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {annotations.map((ann, idx) => (
                  <tr
                    key={ann.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      height: '48px',
                    }}
                    className={selectedAnnotationId === ann.id ? 'bg-blue-50' : ''}
                    onClick={() => {
                      selectAnnotation(ann.id);
                      setEditingAnnotation(ann);
                      setPanelOpen(true);
                    }}
                  >
                    <td className="px-4 text-gray-700">#{ann.labelNumber}</td>
                    <td className="px-4 text-gray-600">
                      {ann.tool === 'rectangle' ? '矩形' : ann.tool === 'circle' ? '圆形' : '画笔'}
                    </td>
                    <td className="px-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor:
                            ann.category === '裂痕' ? '#ef4444' :
                            ann.category === '划痕' ? '#f97316' :
                            ann.category === '色差' ? '#eab308' :
                            ann.category === '污渍' ? '#22c55e' : '#a855f7'
                        }}
                      >
                        {ann.category}
                      </span>
                    </td>
                    <td className="px-4 text-gray-600">{ann.severity}</td>
                    <td className="px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnnotation(ann.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
