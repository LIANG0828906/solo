import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { Lock, Unlock, Cloud, CloudOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { snapToGrid, GRID_SIZE } from '@/utils/drag';
import Icon from './Icon';
import ContextMenu from './ContextMenu';
import FolderItem from './FolderItem';
import StickyNote from '../../notes/StickyNote';
import SearchBar from '../../search/SearchBar';
import Sidebar from '../../sidebar/Sidebar';
import OrganizerPanel from '../../organizer/OrganizerPanel';
import type { DesktopIcon as DesktopIconType } from '@/types';

const Desktop: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPlaceholder, setDropPlaceholder] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const icons = useStore((state) => state.icons);
  const folders = useStore((state) => state.folders);
  const notes = useStore((state) => state.notes);
  const locked = useStore((state) => state.locked);
  const toggleLock = useStore((state) => state.toggleLock);
  const moveIcon = useStore((state) => state.moveIcon);
  const moveIconToFolder = useStore((state) => state.moveIconToFolder);
  const selectIcon = useStore((state) => state.selectIcon);
  const setContextMenu = useStore((state) => state.setContextMenu);
  const currentFolderId = useStore((state) => state.currentFolderId);
  const initializeLayout = useStore((state) => state.initializeLayout);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    initializeLayout();
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initializeLayout]);

  const desktopIcons = icons.filter((icon) => icon.parentId === null);

  const activeIcon = activeId
    ? icons.find((i) => i.id === activeId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (locked) return;
    const { active } = event;
    setActiveId(active.id as string);
    selectIcon(active.id as string);
  }, [locked, selectIcon]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (locked || !containerRef.current) return;

      const { active, over } = event;
      const activeId = active.id as string;
      const activeIcon = icons.find((i) => i.id === activeId);
      if (!activeIcon) return;

      if (event.delta.x !== undefined && event.delta.y !== undefined) {
        const currentX = activeIcon.x + (event.activatorEvent as MouseEvent).movementX;
        const currentY = activeIcon.y + (event.activatorEvent as MouseEvent).movementY;
        
        const snapped = snapToGrid(
          currentX,
          currentY,
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        setDropPlaceholder({
          x: snapped.x,
          y: snapped.y,
          width: activeIcon.width,
          height: activeIcon.height,
        });
      }

      if (over && over.id !== activeId) {
        const overIcon = icons.find((i) => i.id === over.id);
        if (overIcon?.type === 'folder' && overIcon.metadata?.folderId) {
          if (activeIcon.type !== 'folder') {
            setDropPlaceholder(null);
          }
        }
      }
    },
    [locked, icons]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (locked || !containerRef.current) return;

      const { active, over } = event;
      const activeId = active.id as string;
      const activeIcon = icons.find((i) => i.id === activeId);

      if (!activeIcon) {
        setActiveId(null);
        setDropPlaceholder(null);
        return;
      }

      if (over && over.id !== activeId) {
        const overIcon = icons.find((i) => i.id === over.id);
        if (overIcon?.type === 'folder' && overIcon.metadata?.folderId) {
          if (activeIcon.type !== 'folder') {
            moveIconToFolder(activeId, overIcon.metadata.folderId);
            setActiveId(null);
            setDropPlaceholder(null);
            return;
          }
        }
      }

      const rect = containerRef.current.getBoundingClientRect();
      const x =
        (event.activatorEvent as MouseEvent).clientX -
        rect.left -
        activeIcon.width / 2;
      const y =
        (event.activatorEvent as MouseEvent).clientY -
        rect.top -
        activeIcon.height / 2;

      const snapped = snapToGrid(
        x,
        y,
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );

      moveIcon(activeId, snapped.x, snapped.y);

      setActiveId(null);
      setDropPlaceholder(null);
    },
    [locked, icons, moveIcon, moveIconToFolder]
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) {
        selectIcon(null);
        setContextMenu(null);
      }
    },
    [selectIcon, setContextMenu]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (locked) return;
      if (e.target === containerRef.current) {
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          iconId: null,
        });
      }
    },
    [locked, setContextMenu]
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className={`desktop-container ${isMobile ? 'desktop-mobile' : ''}`}
        onClick={handleContainerClick}
        onContextMenu={handleContextMenu}
      >
        <div className="top-bar">
          <SearchBar />
          <div
            className={`top-bar-action ${locked ? 'locked' : ''}`}
            onClick={toggleLock}
            title={locked ? '解锁布局' : '锁定布局'}
          >
            {locked ? <Lock size={20} /> : <Unlock size={20} />}
          </div>
          <div
            className="top-bar-action"
            title="同步到云端"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            <CloudOff size={20} />
          </div>
        </div>

        <div className={isMobile ? 'desktop-icons-list' : 'desktop-icons-grid'}>
          {desktopIcons.map((icon) => {
            const isFolder = icon.type === 'folder' && icon.metadata?.folderId;
            const folder = isFolder
              ? folders.find((f) => f.id === icon.metadata?.folderId)
              : null;

            return (
              <Icon
                key={icon.id}
                icon={icon}
                isDragging={activeId === icon.id}
                showBadge={isFolder}
                badgeCount={folder?.iconIds.length || 0}
                isMobile={isMobile}
              />
            );
          })}
        </div>

        {notes.map((note) => (
          <StickyNote key={note.id} note={note} />
        ))}

        {dropPlaceholder && !isMobile && (
          <div
            className="drop-placeholder"
            style={{
              left: dropPlaceholder.x,
              top: dropPlaceholder.y,
              width: dropPlaceholder.width,
              height: dropPlaceholder.height,
            }}
          />
        )}

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}>
          {activeIcon && (
            <div
              className="drag-overlay-item"
              style={{
                width: activeIcon.width,
                height: activeIcon.height,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'scale(1.1)',
                opacity: 0.9,
                cursor: 'grabbing',
                animation: 'drag-overlay-pop 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 600,
                  marginBottom: 8,
                  backgroundColor: activeIcon.color,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                }}
              >
                {activeIcon.name.charAt(0).toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                }}
              >
                {activeIcon.label}
              </div>
            </div>
          )}
        </DragOverlay>

        <Sidebar />
        <ContextMenu />
        <OrganizerPanel />
        {currentFolderId && <FolderItem />}

        <style>{`
          @keyframes drag-overlay-pop {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.15);
            }
            100% {
              transform: scale(1.1);
            }
          }
          
          .desktop-icons-grid {
            position: relative;
            width: 100%;
            height: 100%;
          }
          
          .desktop-icons-list {
            position: relative;
            width: 100%;
            padding: 80px 16px 16px;
            overflow-y: auto;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .desktop-mobile .desktop-icon {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            height: 70px !important;
            flex-direction: row !important;
            padding: 0 16px;
            justify-content: flex-start;
            gap: 16px;
            border-radius: 12px;
            margin-bottom: 0;
            background: var(--glass-bg);
            backdrop-filter: var(--backdrop-blur);
            -webkit-backdrop-filter: var(--backdrop-blur);
            box-shadow: var(--shadow-sm);
          }
          
          .desktop-mobile .desktop-icon-content {
            width: 48px !important;
            height: 48px !important;
            margin-bottom: 0 !important;
            font-size: 20px !important;
            border-radius: 12px !important;
            flex-shrink: 0;
          }
          
          .desktop-mobile .desktop-icon-label {
            font-size: 15px;
            text-align: left;
            max-width: none;
            flex: 1;
          }
          
          .desktop-mobile .folder-badge {
            position: relative;
            top: auto;
            right: auto;
            margin-left: auto;
          }
        `}</style>
      </div>
    </DndContext>
  );
};

export default Desktop;
