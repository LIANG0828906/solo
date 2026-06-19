import React, { useCallback, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Folder, FileText, Link, Image, Music, Video, Code, File } from 'lucide-react';
import type { DesktopIcon } from '@/types';
import { ICON_COLORS } from '@/types';
import { useStore } from '@/store/useStore';

interface IconProps {
  icon: DesktopIcon;
  isDragging?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  isMobile?: boolean;
}

const getIconComponent = (type: string, name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif') || lowerName.endsWith('.svg')) {
    return <Image size={28} />;
  }
  if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav')) {
    return <Music size={28} />;
  }
  if (lowerName.endsWith('.mp4') || lowerName.endsWith('.avi')) {
    return <Video size={28} />;
  }
  if (lowerName.endsWith('.js') || lowerName.endsWith('.ts') || lowerName.endsWith('.py') || lowerName.endsWith('.java')) {
    return <Code size={28} />;
  }
  
  switch (type) {
    case 'folder':
      return <Folder size={28} />;
    case 'document':
      return <FileText size={28} />;
    case 'link':
      return <Link size={28} />;
    case 'note':
      return <File size={28} />;
    default:
      return <File size={28} />;
  }
};

const Icon: React.FC<IconProps> = ({ icon, isDragging = false, showBadge = false, badgeCount = 0, isMobile = false }) => {
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: icon.id,
    disabled: useStore.getState().locked,
  });

  const selectedIconId = useStore((state) => state.selectedIconId);
  const highlightedIconId = useStore((state) => state.highlightedIconId);
  const locked = useStore((state) => state.locked);
  const selectIcon = useStore((state) => state.selectIcon);
  const setContextMenu = useStore((state) => state.setContextMenu);
  const openFolder = useStore((state) => state.openFolder);
  const highlightIcon = useStore((state) => state.highlightIcon);

  const style: React.CSSProperties = isMobile ? {} : {
    transform: CSS.Translate.toString(transform),
    left: icon.x,
    top: icon.y,
    opacity: isDragging ? 0.3 : 1,
    transition: isDragging ? 'opacity 200ms ease' : 'left 250ms cubic-bezier(0.25, 0.1, 0.25, 1), top 250ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 200ms ease',
  };

  const handleClick = useCallback(() => {
    if (locked) return;
    
    clickCountRef.current += 1;
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    selectIcon(icon.id);
    highlightIcon(icon.id);
    
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCountRef.current === 1) {
        selectIcon(icon.id);
      } else if (clickCountRef.current >= 2) {
        if (icon.type === 'folder' && icon.metadata?.folderId) {
          openFolder(icon.metadata.folderId);
        }
      }
      clickCountRef.current = 0;
    }, 250);
  }, [icon, locked, selectIcon, openFolder, highlightIcon]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (locked) return;
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      iconId: icon.id,
    });
  }, [icon.id, locked, setContextMenu]);

  const isSelected = selectedIconId === icon.id;
  const isHighlighted = highlightedIconId === icon.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`desktop-icon ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      data-icon-id={icon.id}
      data-id={icon.id}
      data-type={icon.type}
      data-label={icon.label}
      {...attributes}
      {...listeners}
    >
      {showBadge && badgeCount > 0 && (
        <div className="folder-badge">{badgeCount}</div>
      )}
      <div
        className="desktop-icon-content"
        style={{ backgroundColor: icon.color || ICON_COLORS[icon.type] }}
      >
        {getIconComponent(icon.type, icon.name)}
      </div>
      <div className="desktop-icon-label" title={icon.label}>
        {icon.label}
      </div>
    </div>
  );
};

export default React.memo(Icon);
