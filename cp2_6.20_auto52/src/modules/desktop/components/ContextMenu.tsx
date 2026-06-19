import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Edit3, Trash2, Move, ExternalLink } from 'lucide-react';
import { useStore } from '@/store/useStore';

const ContextMenu: React.FC = () => {
  const contextMenu = useStore((state) => state.contextMenu);
  const setContextMenu = useStore((state) => state.setContextMenu);
  const icons = useStore((state) => state.icons);
  const folders = useStore((state) => state.folders);
  const deleteIcon = useStore((state) => state.deleteIcon);
  const moveIconToFolder = useStore((state) => state.moveIconToFolder);
  const renameIcon = useStore((state) => state.renameIcon);
  const openFolder = useStore((state) => state.openFolder);

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        setShowMoveMenu(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setShowMoveMenu(false);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu, setContextMenu]);

  if (!contextMenu?.visible || !contextMenu.iconId) return null;

  const icon = icons.find((i) => i.id === contextMenu.iconId);
  if (!icon) return null;

  const availableFolders = folders.filter(
    (f) => !f.iconIds.includes(icon.id) && icon.metadata?.folderId !== f.id
  );

  const handleOpen = () => {
    if (icon.type === 'folder' && icon.metadata?.folderId) {
      openFolder(icon.metadata.folderId);
    }
    setContextMenu(null);
  };

  const handleRename = () => {
    setRenameValue(icon.name);
    setShowRenameDialog(true);
    setContextMenu(null);
  };

  const handleConfirmRename = () => {
    if (renameValue.trim()) {
      renameIcon(icon.id, renameValue.trim());
    }
    setShowRenameDialog(false);
  };

  const handleDelete = () => {
    deleteIcon(icon.id);
    setContextMenu(null);
  };

  const handleMoveToFolder = (folderId: string) => {
    moveIconToFolder(icon.id, folderId);
    setContextMenu(null);
    setShowMoveMenu(false);
  };

  const menuStyle: React.CSSProperties = {
    left: contextMenu.x,
    top: contextMenu.y,
  };

  return (
    <>
      <div
        ref={menuRef}
        className="context-menu context-menu-animated"
        style={menuStyle}
      >
        {icon.type === 'folder' && icon.metadata?.folderId && (
          <>
            <div className="context-menu-item" onClick={handleOpen}>
              <FolderOpen size={16} />
              <span>打开</span>
            </div>
            <div className="context-menu-separator" />
          </>
        )}
        <div className="context-menu-item" onClick={handleRename}>
          <Edit3 size={16} />
          <span>重命名</span>
        </div>
        {availableFolders.length > 0 && (
          <div
            className="context-menu-item"
            onClick={() => setShowMoveMenu(!showMoveMenu)}
          >
            <Move size={16} />
            <span>移动到文件夹</span>
          </div>
        )}
        <div className="context-menu-item" onClick={() => window.open('#', '_blank')}>
          <ExternalLink size={16} />
          <span>打开</span>
        </div>
        <div className="context-menu-separator" />
        <div className="context-menu-item danger" onClick={handleDelete}>
          <Trash2 size={16} />
          <span>删除</span>
        </div>

        {showMoveMenu && availableFolders.length > 0 && (
          <div
            className="context-menu context-menu-animated"
            style={{
              left: contextMenu.x + 180,
              top: contextMenu.y,
            }}
          >
            {availableFolders.map((folder) => (
              <div
                key={folder.id}
                className="context-menu-item"
                onClick={() => handleMoveToFolder(folder.id)}
              >
                <FolderOpen size={16} />
                <span>{folder.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRenameDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowRenameDialog(false)} />
          <div className="rename-dialog">
            <h3>重命名</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename();
                if (e.key === 'Escape') setShowRenameDialog(false);
              }}
              autoFocus
            />
            <div className="rename-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRenameDialog(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirmRename}>
                确定
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ContextMenu;
