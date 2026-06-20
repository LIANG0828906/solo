import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Icon from './Icon';

const FolderItem: React.FC = () => {
  const currentFolderId = useStore((state) => state.currentFolderId);
  const openFolder = useStore((state) => state.openFolder);
  const icons = useStore((state) => state.icons);
  const folders = useStore((state) => state.folders);
  const updateFolder = useStore((state) => state.updateFolder);

  if (!currentFolderId) return null;

  const folder = folders.find((f) => f.id === currentFolderId);
  if (!folder) return null;

  const folderIcons = icons.filter((icon) => icon.parentId === currentFolderId);

  const handleBack = () => {
    openFolder(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFolder(currentFolderId, { name: e.target.value });
  };

  return (
    <>
      <div className="dialog-overlay" onClick={handleBack} />
      <div className="folder-view">
        <div className="folder-view-header">
          <div className="folder-back" onClick={handleBack}>
            <ArrowLeft size={20} />
          </div>
          <input
            className="folder-name-input"
            value={folder.name}
            onChange={handleNameChange}
            autoFocus
          />
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {folderIcons.length} 个项目
          </div>
        </div>
        <div className="folder-view-content">
          {folderIcons.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-secondary)',
              }}
            >
              文件夹为空，拖拽图标到此处添加
            </div>
          ) : (
            folderIcons.map((icon) => (
              <Icon
                key={icon.id}
                icon={icon}
                showBadge={icon.type === 'folder' && icon.metadata?.folderId !== undefined}
                badgeCount={
                  icon.type === 'folder' && icon.metadata?.folderId
                    ? folders.find((f) => f.id === icon.metadata?.folderId)?.iconIds.length || 0
                    : 0
                }
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default FolderItem;
