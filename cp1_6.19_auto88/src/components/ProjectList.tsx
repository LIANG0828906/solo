import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiFolder, FiMenu } from 'react-icons/fi';
import type { Project } from '@/types';
import { formatDate } from '@/utils/export';

interface ProjectListProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ProjectList = ({
  projects,
  currentProjectId,
  onSelectProject,
  onAddProject,
  isMobile = false,
  isOpen = true,
  onClose,
}: ProjectListProps) => {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const isValidName = newProjectName.length >= 3 && newProjectName.length <= 20;

  const handleSubmit = useCallback(() => {
    if (isValidName) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
    }
  }, [isValidName, newProjectName, onAddProject]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setShowNewProject(false);
        setNewProjectName('');
      }
    },
    [handleSubmit]
  );

  const handleProjectClick = useCallback(
    (id: string) => {
      onSelectProject(id);
      if (isMobile && onClose) {
        onClose();
      }
    },
    [onSelectProject, isMobile, onClose]
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && !isOpen && (
          <motion.button
            className="mobile-menu-toggle"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onClose}
          >
            <FiMenu />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        className={`project-list ${isMobile ? 'mobile-drawer' : ''}`}
        initial={isMobile ? { x: -280 } : false}
        animate={isMobile ? { x: isOpen ? 0 : -280 } : { x: 0 }}
        transition={{
          type: 'tween',
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="project-list-header">
          <h2 className="project-list-title">
            <FiFolder className="title-icon" />
            我的项目
          </h2>
          <motion.button
            className="add-project-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewProject(true)}
          >
            <FiPlus />
          </motion.button>
        </div>

        <div className="projects-scroll-container">
          {projects.length === 0 ? (
            <div className="empty-projects">
              <p>还没有项目</p>
              <p className="empty-hint">点击上方 + 按钮创建第一个项目</p>
            </div>
          ) : (
            <ul className="projects-list">
              <AnimatePresence initial={false}>
                {projects.map((project, index) => (
                  <motion.li
                    key={project.id}
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index === 0 ? 0 : 0,
                      ease: 'easeOut',
                    }}
                  >
                    <motion.button
                      className={`project-card ${
                        currentProjectId === project.id ? 'active' : ''
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleProjectClick(project.id)}
                      style={{
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div
                        className="project-thumbnail"
                        style={{ background: project.thumbnail }}
                      />
                      <div className="project-info">
                        <h3 className="project-name">{project.name}</h3>
                        <p className="project-date">{formatDate(project.createdAt)}</p>
                        <p className="project-count">{project.cards.length} 张卡片</p>
                      </div>
                    </motion.button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.aside>

      <AnimatePresence>
        {showNewProject && (
          <>
            <motion.div
              className="modal-overlay new-project-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowNewProject(false);
                setNewProjectName('');
              }}
            />
            <motion.div
              className="new-project-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="new-project-content">
                <h3>创建新项目</h3>
                <div className="input-group">
                  <input
                    type="text"
                    className="project-name-input"
                    placeholder="输入项目名称（3-20字符）"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    maxLength={20}
                  />
                  {!isValidName && newProjectName.length > 0 && (
                    <span className="input-error">
                      项目名称需要 3-20 个字符
                    </span>
                  )}
                </div>
                <div className="new-project-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowNewProject(false);
                      setNewProjectName('');
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!isValidName}
                    onClick={handleSubmit}
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
