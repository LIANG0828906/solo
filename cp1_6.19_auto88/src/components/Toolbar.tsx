import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiTrash2, FiDownload, FiMenu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import type { Project } from '@/types';
import { validateImageFile } from '@/utils/export';

interface ToolbarProps {
  currentProject: Project | undefined;
  onAddImage: (file: File) => void;
  onClearBoard: () => void;
  onExport: () => void;
  onToggleMenu?: () => void;
  isMobile?: boolean;
}

export const Toolbar = ({
  currentProject,
  onAddImage,
  onClearBoard,
  onExport,
  onToggleMenu,
  isMobile = false,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || '图片格式不正确');
        } else {
          onAddImage(file);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onAddImage]
  );

  const handleAddImageClick = useCallback(() => {
    if (!currentProject) {
      toast.error('请先选择一个项目');
      return;
    }
    if (currentProject.cards.length >= 50) {
      toast.error('灵感板最多支持 50 张卡片');
      return;
    }
    fileInputRef.current?.click();
  }, [currentProject]);

  const handleClearClick = useCallback(() => {
    if (!currentProject || currentProject.cards.length === 0) {
      toast.error('灵感板是空的');
      return;
    }
    onClearBoard();
  }, [currentProject, onClearBoard]);

  const handleExportClick = useCallback(() => {
    if (!currentProject) {
      toast.error('请先选择一个项目');
      return;
    }
    if (currentProject.cards.length === 0) {
      toast.error('灵感板是空的，无法导出');
      return;
    }
    onExport();
    toast.success('导出成功！', { duration: 500 });
  }, [currentProject, onExport]);

  return (
    <motion.header
      className="toolbar"
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="toolbar-content">
        <div className="toolbar-left">
          {isMobile && (
            <motion.button
              className="toolbar-menu-btn"
              whileTap={{ scale: 0.9 }}
              onClick={onToggleMenu}
            >
              <FiMenu />
            </motion.button>
          )}
          <h1 className="toolbar-title">
            {currentProject ? currentProject.name : '灵感板'}
          </h1>
        </div>
        <div className="toolbar-actions">
          <motion.button
            className="toolbar-btn toolbar-btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddImageClick}
            disabled={!currentProject}
          >
            <FiImage className="btn-icon" />
            <span>添加图片</span>
          </motion.button>
          <motion.button
            className="toolbar-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClearClick}
            disabled={!currentProject || currentProject.cards.length === 0}
          >
            <FiTrash2 className="btn-icon" />
            <span>清空面板</span>
          </motion.button>
          <motion.button
            className="toolbar-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportClick}
            disabled={!currentProject || currentProject.cards.length === 0}
          >
            <FiDownload className="btn-icon" />
            <span>导出</span>
          </motion.button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </motion.header>
  );
};
