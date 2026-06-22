import { useComponentStore } from '@/store/componentStore';
import { motion } from 'framer-motion';
import { X, FlipHorizontal2, FlipVertical2, Save } from 'lucide-react';

const presetColors = [
  '#FFD5B8', '#F5C5A3', '#D4A98C', '#A0785A',
  '#5B8DEF', '#FF6B6B', '#B388FF', '#4ECDC4',
  '#2C3E50', '#3D5A80', '#FF69B4', '#333333',
];

export function EditModal() {
  const editingComponent = useComponentStore((s) => s.editingComponent);
  const closeEditModal = useComponentStore((s) => s.closeEditModal);
  const updateEditingColor = useComponentStore((s) => s.updateEditingColor);
  const updateEditingRotation = useComponentStore((s) => s.updateEditingRotation);
  const toggleEditingFlipH = useComponentStore((s) => s.toggleEditingFlipH);
  const toggleEditingFlipV = useComponentStore((s) => s.toggleEditingFlipV);
  const saveEditingToLibrary = useComponentStore((s) => s.saveEditingToLibrary);
  const applyEditingToCanvas = useComponentStore((s) => s.applyEditingToCanvas);

  if (!editingComponent) return null;

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateEditingRotation(Number(e.target.value));
    applyEditingToCanvas();
  };

  const handleColorClick = (color: string) => {
    updateEditingColor(color);
    applyEditingToCanvas();
  };

  const handleSave = () => {
    saveEditingToLibrary();
    closeEditModal();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeEditModal}
      />

      <motion.div
        className="relative w-[400px] max-w-[90vw] p-6"
        style={{
          background: '#282830',
          borderRadius: '16px',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white text-base font-semibold">编辑组件</h3>
          <button
            onClick={closeEditModal}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5">
          <label className="text-[#aaa] text-xs mb-2 block">颜色选择</label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className="w-5 h-5 rounded transition-all duration-150 hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderRadius: '4px',
                  border:
                    editingComponent.color === color
                      ? '2px solid #FF6B6B'
                      : '2px solid transparent',
                  outline:
                    editingComponent.color === color
                      ? '1px solid rgba(255,107,107,0.4)'
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-[#aaa] text-xs mb-2 block">
            旋转角度：{editingComponent.rotation}°
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            step={5}
            value={editingComponent.rotation}
            onChange={handleRotationChange}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF6B6B ${((editingComponent.rotation + 180) / 360) * 100}%, #444 ${((editingComponent.rotation + 180) / 360) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-[#666] mt-1">
            <span>-180°</span>
            <span>0°</span>
            <span>180°</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[#aaa] text-xs mb-2 block">翻转</label>
          <div className="flex gap-3">
            <button
              onClick={() => {
                toggleEditingFlipH();
                applyEditingToCanvas();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white/80 transition-all duration-200"
              style={{
                background: editingComponent.flipH ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.05)',
                border: editingComponent.flipH ? '1px solid #FF6B6B' : '1px solid #444',
              }}
            >
              <FlipHorizontal2 size={14} />
              水平翻转
            </button>
            <button
              onClick={() => {
                toggleEditingFlipV();
                applyEditingToCanvas();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-white/80 transition-all duration-200"
              style={{
                background: editingComponent.flipV ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.05)',
                border: editingComponent.flipV ? '1px solid #FF6B6B' : '1px solid #444',
              }}
            >
              <FlipVertical2 size={14} />
              垂直翻转
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={closeEditModal}
            className="flex-1 py-2.5 rounded-md text-sm text-white/70 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] transition-colors duration-200"
          >
            关闭
          </button>
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-md text-sm text-white transition-colors duration-200"
            style={{ background: '#FF6B6B' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#E55A5A';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#FF6B6B';
            }}
          >
            <Save size={14} />
            保存到组件库
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
