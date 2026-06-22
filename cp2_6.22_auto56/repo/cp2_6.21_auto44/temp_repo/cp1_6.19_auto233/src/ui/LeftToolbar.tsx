import { motion } from 'framer-motion';
import { Building2, Plus, MousePointer2, Layers } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PRESET_BLOCKS } from '@/types';

export const LeftToolbar = () => {
  const { isPlacingMode, setPlacingMode, activePreset, loadPreset } = useAppStore();

  const handlePresetClick = (presetId: string) => {
    loadPreset(presetId);
  };

  return (
    <motion.div
      className="left-toolbar panel"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="control-group">
        <div className="section-title">编辑工具</div>
        <button
          className={`btn ${!isPlacingMode ? 'active' : ''}`}
          onClick={() => setPlacingMode(false)}
        >
          <div className="tool-icon">
            <MousePointer2 size={18} />
          </div>
          <span className="btn-text">选择模式</span>
        </button>
        <button
          className={`btn ${isPlacingMode ? 'active' : ''}`}
          onClick={() => setPlacingMode(true)}
        >
          <div className="tool-icon">
            <Plus size={18} />
          </div>
          <span className="btn-text">放置建筑</span>
        </button>
      </div>

      <div className="control-group">
        <div className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} />
            预设街区
          </div>
        </div>
        {PRESET_BLOCKS.map((preset) => (
          <button
            key={preset.id}
            className={`btn preset-btn ${activePreset === preset.id ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset.id)}
          >
            <Building2 size={16} />
            <span className="btn-text">{preset.name}</span>
          </button>
        ))}
      </div>

      <div className="control-group">
        <div className="section-title">操作说明</div>
        <div className="info-text">
          • 鼠标左键：选择建筑<br />
          • 鼠标滚轮：缩放视图<br />
          • 鼠标右键拖动：旋转视角<br />
          • 放置模式下点击地面：添加建筑<br />
          • 点击建筑立面：查看日照详情
        </div>
      </div>

      <div className="control-group">
        <div className="section-title">图例</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                background: '#1A1A40',
                borderRadius: '3px',
              }}
            />
            <span className="info-text">0小时 日照</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                background: 'linear-gradient(to right, #1A1A40, #FFD700)',
                borderRadius: '3px',
              }}
            />
            <span className="info-text">→ 渐变色</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                background: '#FFD700',
                borderRadius: '3px',
              }}
            />
            <span className="info-text">12小时 日照</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
