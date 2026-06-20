import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimelineStore } from '@/store/timelineStore';
import { Save, Trash2, ChevronRight, X } from 'lucide-react';
import '@/styles/PropertyPanel.css';

export const PropertyPanel = () => {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    deleteNode,
    selectNode,
    currentTheme,
  } = useTimelineStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (selectedNode) {
      setFormData({
        title: selectedNode.title,
        date: selectedNode.date,
        description: selectedNode.description,
        imageUrl: selectedNode.imageUrl || '',
      });
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNodeId) return;
    updateNode(selectedNodeId, {
      ...formData,
      imageUrl: formData.imageUrl || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedNodeId) return;
    if (window.confirm('确定要删除这个事件吗？')) {
      deleteNode(selectedNodeId);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      className={`property-panel theme-${currentTheme}`}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <h2>属性面板</h2>
        {selectedNode && (
          <button
            className="close-btn"
            onClick={() => selectNode(null)}
            title="关闭"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div
            key="form"
            className="panel-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="输入事件标题"
              />
            </div>

            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入事件详细描述"
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>图片 URL（可选）</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {formData.imageUrl && (
              <div className="image-preview">
                <img
                  src={formData.imageUrl}
                  alt="预览"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="panel-actions">
              <motion.button
                className="save-btn"
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save size={16} />
                <span>保存</span>
              </motion.button>

              <motion.button
                className="delete-btn"
                onClick={handleDelete}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 size={16} />
                <span>删除</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="panel-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronRight size={32} className="empty-icon" />
            <p>点击左侧时间线中的事件节点</p>
            <p className="empty-sub">即可在此编辑详细信息</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
