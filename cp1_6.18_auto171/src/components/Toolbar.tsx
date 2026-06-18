import { MousePointer2, PenTool, Eraser, StickyNote, Image, Undo2, Redo2, Trash2 } from 'lucide-react';
import { useBoardStore } from '@/stores/boardStore';
import { PEN_COLORS, PEN_WIDTHS } from '@/data/boardData';
import type { PenColor, PenWidth } from '@/data/boardData';

const tools = [
  { id: 'select' as const, icon: MousePointer2, title: '选择' },
  { id: 'pen' as const, icon: PenTool, title: '画笔' },
  { id: 'eraser' as const, icon: Eraser, title: '橡皮擦' },
  { id: 'sticky' as const, icon: StickyNote, title: '便签' },
  { id: 'image' as const, icon: Image, title: '图片' },
];

export default function Toolbar() {
  const tool = useBoardStore((s) => s.tool);
  const setTool = useBoardStore((s) => s.setTool);
  const penColor = useBoardStore((s) => s.penColor);
  const setPenColor = useBoardStore((s) => s.setPenColor);
  const penWidth = useBoardStore((s) => s.penWidth);
  const setPenWidth = useBoardStore((s) => s.setPenWidth);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const undoStack = useBoardStore((s) => s.undoStack);
  const redoStack = useBoardStore((s) => s.redoStack);
  const showClearConfirm = useBoardStore((s) => s.showClearConfirm);
  const setShowClearConfirm = useBoardStore((s) => s.setShowClearConfirm);
  const showColorPicker = useBoardStore((s) => s.showColorPicker);
  const showWidthPicker = useBoardStore((s) => s.showWidthPicker);
  const setShowColorPicker = useBoardStore((s) => s.setShowColorPicker);
  const setShowWidthPicker = useBoardStore((s) => s.setShowWidthPicker);

  const handlePenClick = () => {
    if (tool === 'pen') {
      setShowColorPicker(!showColorPicker);
      setShowWidthPicker(false);
    } else {
      setTool('pen');
      setShowColorPicker(false);
      setShowWidthPicker(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-[60px] bg-[#2C2C2C] py-3 gap-2 relative z-10">
      {tools.map(({ id, icon: Icon, title }) => (
        <div key={id} className="relative">
          {id === 'pen' ? (
            <>
              <button
                onClick={handlePenClick}
                title={title}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out ${
                  tool === id ? 'bg-[#4A4A4A]' : 'bg-transparent hover:bg-[#3C3C3C]'
                }`}
              >
                <Icon size={20} className="text-white" />
              </button>
              {showColorPicker && (
                <div className="absolute left-full ml-2 top-0 bg-[#2C2C2C] rounded-lg p-2 flex flex-col gap-2 shadow-lg z-50">
                  <div className="flex gap-1.5">
                    {PEN_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setPenColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                          penColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-1 border-t border-[#4A4A4A]">
                    {PEN_WIDTHS.map((width) => (
                      <button
                        key={width}
                        onClick={() => setPenWidth(width)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${
                          penWidth === width ? 'bg-[#4A4A4A]' : 'bg-transparent hover:bg-[#3C3C3C]'
                        }`}
                      >
                        <div
                          className="rounded-full bg-white"
                          style={{ width: Math.min(width, 8), height: Math.min(width, 8) }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setTool(id)}
              title={title}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ease-out ${
                tool === id ? 'bg-[#4A4A4A]' : 'bg-transparent hover:bg-[#3C3C3C]'
              }`}
            >
              <Icon size={20} className="text-white" />
            </button>
          )}
        </div>
      ))}

      <div className="w-8 h-px bg-[#4A4A4A] mx-2 my-1" />

      <button
        onClick={undo}
        title="撤销"
        disabled={undoStack.length === 0}
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-transparent hover:bg-[#3C3C3C] transition-all duration-200 ease-out disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Undo2 size={20} className="text-white" />
      </button>
      <button
        onClick={redo}
        title="重做"
        disabled={redoStack.length === 0}
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-transparent hover:bg-[#3C3C3C] transition-all duration-200 ease-out disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Redo2 size={20} className="text-white" />
      </button>

      <div className="w-8 h-px bg-[#4A4A4A] mx-2 my-1" />

      <button
        onClick={() => setShowClearConfirm(true)}
        title="清空画布"
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500 hover:bg-red-600 transition-all duration-200 ease-out"
      >
        <Trash2 size={18} className="text-white" />
      </button>
    </div>
  );
}
