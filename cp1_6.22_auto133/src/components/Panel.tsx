import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ComponentType, componentDefaultSize, RootState } from '@/store/store';
import {
  Square,
  RectangleHorizontal,
  AppWindow,
  PanelLeftClose,
  ToggleLeft,
  Loader2,
  Bell,
  MousePointer2,
} from 'lucide-react';

interface PanelItem {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const panelItems: PanelItem[] = [
  {
    type: 'primary-button',
    label: '主按钮',
    icon: <RectangleHorizontal size={24} />,
    iconBg: '#6366F1',
    iconColor: '#ffffff',
  },
  {
    type: 'secondary-button',
    label: '次要按钮',
    icon: <RectangleHorizontal size={24} />,
    iconBg: '#ffffff',
    iconColor: '#6366F1',
  },
  {
    type: 'card',
    label: '卡片',
    icon: <Square size={24} />,
    iconBg: '#EEF2FF',
    iconColor: '#6366F1',
  },
  {
    type: 'modal',
    label: '模态框',
    icon: <AppWindow size={24} />,
    iconBg: '#C7D2FE',
    iconColor: '#3730A3',
  },
  {
    type: 'accordion',
    label: '折叠面板',
    icon: <PanelLeftClose size={24} />,
    iconBg: '#E0E7FF',
    iconColor: '#4F46E5',
  },
  {
    type: 'switch',
    label: '开关',
    icon: <ToggleLeft size={24} />,
    iconBg: '#A5B4FC',
    iconColor: '#1E1B4B',
  },
  {
    type: 'spinner',
    label: '加载旋转器',
    icon: <Loader2 size={24} />,
    iconBg: '#818CF8',
    iconColor: '#ffffff',
  },
  {
    type: 'notification',
    label: '通知横幅',
    icon: <Bell size={24} />,
    iconBg: '#DDD6FE',
    iconColor: '#4C1D95',
  },
];

interface PanelProps {
  onCanvasDrop: (type: ComponentType, clientX: number, clientY: number) => void;
}

const Panel: React.FC<PanelProps> = ({ onCanvasDrop }) => {
  const isOpen = useSelector((s: RootState) => s.app.ui.leftPanelOpen);
  const [draggingType, setDraggingType] = useState<ComponentType | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (draggingType && ghostRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          if (ghostRef.current) {
            const size = componentDefaultSize[draggingType];
            ghostRef.current.style.left = `${e.clientX - size.width / 2}px`;
            ghostRef.current.style.top = `${e.clientY - size.height / 2}px`;
          }
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingType) {
        onCanvasDrop(draggingType, e.clientX, e.clientY);
        setDraggingType(null);
        if (ghostRef.current) {
          document.body.removeChild(ghostRef.current);
          ghostRef.current = null;
        }
      }
    };

    if (draggingType) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draggingType, onCanvasDrop]);

  const handleDragStart = (type: ComponentType, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingType(type);
    const ghost = document.createElement('div');
    const size = componentDefaultSize[type];
    ghost.className = `drag-ghost drag-preview-${type.replace('-', '_')}`;
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.65';
    ghost.style.left = `${e.clientX - size.width / 2}px`;
    ghost.style.top = `${e.clientY - size.height / 2}px`;
    ghost.style.width = `${size.width}px`;
    ghost.style.height = `${size.height}px`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  };

  return (
    <aside
      className="left-panel"
      style={{
        width: isOpen ? '220px' : '0px',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div className="panel-header">
        <MousePointer2 size={16} />
        <span>组件面板</span>
      </div>
      <div className="panel-grid">
        {panelItems.map((item) => (
          <div
            key={item.type}
            className={`panel-item preview-${item.type.replace('-', '_')}`}
            draggable
            onMouseDown={(e) => handleDragStart(item.type, e)}
            title={`拖拽 ${item.label} 到画布`}
          >
            <div
              className="panel-item-icon"
              style={{ background: item.iconBg, color: item.iconColor }}
            >
              {item.icon}
            </div>
            <span className="panel-item-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="panel-tip">
        拖拽组件到画布 <br /> 可悬停 / 点击 / 长按
      </div>
    </aside>
  );
};

export default Panel;
