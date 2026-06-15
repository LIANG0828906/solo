import { useRef, useEffect, useCallback, useState } from 'react';
import type { Note, DiffNote } from '@/types';

/**
 * 五线谱Canvas编辑组件
 * - HTML Canvas绘制，深色背景
 * - 亮黄色五线谱，白色音符圆点
 * - 支持鼠标点击添加、右键删除音符
 * - 新增音符闪烁高亮，差异显示背景色
 */
interface SheetCanvasProps {
  notes: Note[];
  diffs: DiffNote[];
  flashIds: Set<string>;
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onDeleteNote: (noteId: string) => void;
}

/** 画布常量配置 */
const STAFF_CONFIG = {
  staffLineColor: '#ffd700',
  noteColor: '#ffffff',
  noteFlashColor: 'rgba(255, 255, 128, 0.6)',
  diffAddColor: 'rgba(74, 222, 128, 0.35)',
  diffRemoveColor: 'rgba(248, 113, 113, 0.35)',
  bgColor: '#1a1a2e',
  measureBgColor: '#16213e',
  topPadding: 50,
  bottomPadding: 30,
  leftPadding: 60,
  rightPadding: 20,
  lineSpacing: 12,
  noteRadius: 7,
  beatWidth: 60,
  beatsPerMeasure: 4,
  measuresPerPage: 4,
};

export function SheetCanvas({
  notes,
  diffs,
  flashIds,
  onAddNote,
  onDeleteNote,
}: SheetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 300 });

  /** 计算画布尺寸 */
  const measureWidth = STAFF_CONFIG.beatWidth * STAFF_CONFIG.beatsPerMeasure;
  const staffHeight = STAFF_CONFIG.lineSpacing * 4;
  const totalHeight = STAFF_CONFIG.topPadding + staffHeight + STAFF_CONFIG.bottomPadding;

  /** 响应式调整画布尺寸 */
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(rect.width, 600),
          height: Math.max(totalHeight, 250),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [totalHeight]);

  /** 获取差异背景颜色 */
  const getDiffColor = useCallback(
    (noteId: string): string | null => {
      const diff = diffs.find((d) => d.note.id === noteId);
      if (!diff) return null;
      return diff.type === 'added' ? STAFF_CONFIG.diffAddColor : STAFF_CONFIG.diffRemoveColor;
    },
    [diffs]
  );

  /** 绘制五线谱 */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 清空画布
    ctx.fillStyle = STAFF_CONFIG.bgColor;
    ctx.fillRect(0, 0, width, height);

    const visibleMeasures = Math.ceil((width - STAFF_CONFIG.leftPadding) / measureWidth) + 1;
    const startMeasure = Math.floor(scrollOffset / measureWidth);

    // 绘制小节背景和计数器
    for (let i = 0; i < visibleMeasures; i++) {
      const measureIndex = startMeasure + i;
      const x = STAFF_CONFIG.leftPadding + measureIndex * measureWidth - scrollOffset;

      if (x < -measureWidth || x > width) continue;

      // 交替背景色
      ctx.fillStyle = measureIndex % 2 === 0 ? STAFF_CONFIG.bgColor : STAFF_CONFIG.measureBgColor;
      ctx.fillRect(x, 0, measureWidth, height);

      // 小节计数器
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${measureIndex + 1}`, x + measureWidth / 2, 28);

      // 小节分隔线
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, STAFF_CONFIG.topPadding);
      ctx.lineTo(x, STAFF_CONFIG.topPadding + staffHeight);
      ctx.stroke();
    }

    // 绘制五条谱线
    ctx.strokeStyle = STAFF_CONFIG.staffLineColor;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const y = STAFF_CONFIG.topPadding + i * STAFF_CONFIG.lineSpacing;
      ctx.beginPath();
      ctx.moveTo(STAFF_CONFIG.leftPadding - scrollOffset, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制高音谱号（简化版G谱号）
    ctx.fillStyle = STAFF_CONFIG.staffLineColor;
    ctx.font = 'bold 40px serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄞', 15, STAFF_CONFIG.topPadding + staffHeight / 2);

    // 绘制拍子线
    for (let i = 0; i < visibleMeasures; i++) {
      const measureIndex = startMeasure + i;
      const measureX = STAFF_CONFIG.leftPadding + measureIndex * measureWidth - scrollOffset;

      for (let beat = 0; beat < STAFF_CONFIG.beatsPerMeasure; beat++) {
        const x = measureX + beat * STAFF_CONFIG.beatWidth;
        if (x < STAFF_CONFIG.leftPadding || x > width) continue;

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, STAFF_CONFIG.topPadding);
        ctx.lineTo(x, STAFF_CONFIG.topPadding + staffHeight);
        ctx.stroke();
      }
    }

    // 绘制音符
    notes.forEach((note) => {
      const measureX = STAFF_CONFIG.leftPadding + note.measure * measureWidth - scrollOffset;
      const x = measureX + note.beat * STAFF_CONFIG.beatWidth + STAFF_CONFIG.beatWidth / 2;
      const y = STAFF_CONFIG.topPadding + (4 - note.pitch) * (STAFF_CONFIG.lineSpacing / 2);

      if (x < -20 || x > width + 20) return;

      // 差异背景色
      const diffColor = getDiffColor(note.id);
      if (diffColor) {
        ctx.fillStyle = diffColor;
        ctx.beginPath();
        ctx.arc(x, y, STAFF_CONFIG.noteRadius + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 闪烁高亮
      if (flashIds.has(note.id)) {
        ctx.fillStyle = STAFF_CONFIG.noteFlashColor;
        ctx.beginPath();
        ctx.arc(x, y, STAFF_CONFIG.noteRadius + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 音符主体
      ctx.fillStyle = STAFF_CONFIG.noteColor;
      ctx.beginPath();
      ctx.arc(x, y, STAFF_CONFIG.noteRadius, 0, Math.PI * 2);
      ctx.fill();

      // 音符外发光
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = STAFF_CONFIG.noteColor;
      ctx.beginPath();
      ctx.arc(x, y, STAFF_CONFIG.noteRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [canvasSize, scrollOffset, notes, flashIds, getDiffColor, measureWidth, staffHeight]);

  /** 重绘画布 */
  useEffect(() => {
    draw();
  }, [draw]);

  /** 根据坐标计算音符位置 */
  const getNotePosition = useCallback(
    (clientX: number, clientY: number): { measure: number; beat: number; pitch: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const adjustedX = x + scrollOffset - STAFF_CONFIG.leftPadding;
      if (adjustedX < 0) return null;

      const measure = Math.floor(adjustedX / measureWidth);
      const measureOffset = adjustedX - measure * measureWidth;
      const beat = Math.floor(measureOffset / STAFF_CONFIG.beatWidth);

      if (beat < 0 || beat >= STAFF_CONFIG.beatsPerMeasure) return null;

      const staffTop = STAFF_CONFIG.topPadding;
      const staffBottom = staffTop + staffHeight;
      if (y < staffTop - 20 || y > staffBottom + 20) return null;

      const pitch = Math.round(4 - (y - staffTop) / (STAFF_CONFIG.lineSpacing / 2));
      const clampedPitch = Math.max(0, Math.min(8, pitch));

      return { measure, beat, pitch: clampedPitch };
    },
    [scrollOffset, measureWidth, staffHeight]
  );

  /** 查找点击位置的音符 */
  const findNoteAtPosition = useCallback(
    (clientX: number, clientY: number): Note | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      for (const note of notes) {
        const measureX = STAFF_CONFIG.leftPadding + note.measure * measureWidth - scrollOffset;
        const noteX = measureX + note.beat * STAFF_CONFIG.beatWidth + STAFF_CONFIG.beatWidth / 2;
        const noteY = STAFF_CONFIG.topPadding + (4 - note.pitch) * (STAFF_CONFIG.lineSpacing / 2);

        const dx = clickX - noteX;
        const dy = clickY - noteY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= STAFF_CONFIG.noteRadius + 5) {
          return note;
        }
      }
      return null;
    },
    [notes, scrollOffset, measureWidth]
  );

  /** 鼠标左键点击添加音符 */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const position = getNotePosition(e.clientX, e.clientY);
      if (!position) return;

      onAddNote({
        measure: position.measure,
        beat: position.beat,
        pitch: position.pitch,
        duration: 1,
        instrument: 'guitar',
      });
    },
    [getNotePosition, onAddNote]
  );

  /** 右键点击删除音符 */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const note = findNoteAtPosition(e.clientX, e.clientY);
      if (note) {
        onDeleteNote(note.id);
      }
    },
    [findNoteAtPosition, onDeleteNote]
  );

  /** 水平滚动处理 */
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setScrollOffset((prev) => Math.max(0, prev + e.deltaY));
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ backgroundColor: STAFF_CONFIG.bgColor }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="block cursor-crosshair"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
}

export default SheetCanvas;
