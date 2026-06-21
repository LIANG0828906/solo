import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutItem,
  ComponentType,
  addComponent,
  moveComponent,
  logEvent,
  EventType,
  AppDispatch,
  RootState,
} from '@/store/store';
import {
  getAnimationFor,
  BASE_TRANSITION,
  AnimationStyle,
} from '@/animationEngine';
import { X, Bell, ChevronDown } from 'lucide-react';

interface CanvasProps {
  canvasRef: React.MutableRefObject<HTMLDivElement | null>;
}

interface ActiveAnimation {
  [componentId: string]: {
    style: AnimationStyle;
    expiresAt: number;
  };
}

interface LongPressState {
  componentId: string | null;
  timer: ReturnType<typeof setTimeout> | null;
}

const renderComponentInner = (type: ComponentType, interactive: boolean) => {
  switch (type) {
    case 'primary-button':
      return <button className="cc-btn cc-btn-primary">确认操作</button>;
    case 'secondary-button':
      return <button className="cc-btn cc-btn-secondary">取消返回</button>;
    case 'card':
      return (
        <div className="cc-card">
          <div className="cc-card-title">产品卡片标题</div>
          <div className="cc-card-body">
            这里是卡片内容描述区域，可包含文字、图片等元素。
          </div>
          <div className="cc-card-footer">
            <button className="cc-card-btn">查看详情</button>
          </div>
        </div>
      );
    case 'modal':
      return (
        <div className="cc-modal">
          <div className="cc-modal-header">
            <span>模态框标题</span>
            {interactive && (
              <button className="cc-modal-close" tabIndex={-1}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="cc-modal-body">这是模态框内容区域的占位文本。</div>
          <div className="cc-modal-footer">
            <button className="cc-btn cc-btn-secondary">取消</button>
            <button className="cc-btn cc-btn-primary">确定</button>
          </div>
        </div>
      );
    case 'accordion':
      return (
        <div className="cc-accordion">
          <div className="cc-accordion-header">
            <span>折叠面板标题</span>
            <ChevronDown size={16} className="cc-accordion-arrow" />
          </div>
          <div className="cc-accordion-body">
            展开后的内容区域，包含详情说明文字。
          </div>
        </div>
      );
    case 'switch':
      return (
        <label className="cc-switch">
          <input type="checkbox" tabIndex={-1} />
          <span className="cc-switch-slider" />
        </label>
      );
    case 'spinner':
      return (
        <div className="cc-spinner">
          <div className="cc-spinner-ring" />
        </div>
      );
    case 'notification':
      return (
        <div className="cc-notification">
          <Bell size={16} className="cc-notification-icon" />
          <div className="cc-notification-body">
            <div className="cc-notification-title">系统通知</div>
            <div className="cc-notification-msg">您有新的消息待处理</div>
          </div>
        </div>
      );
    default:
      return <div>{type}</div>;
  }
};

const Canvas: React.FC<CanvasProps> = ({ canvasRef }) => {
  const dispatch = useDispatch<AppDispatch>();
  const layout = useSelector((s: RootState) => s.app.layout);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);
  const mouseMoveRaf = useRef<{ id: string; x: number; y: number } | null>(null);

  const [activeAnimations, setActiveAnimations] = useState<ActiveAnimation>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const longPressRef = useRef<LongPressState>({ componentId: null, timer: null });
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [prevLayout, setPrevLayout] = useState<LayoutItem[]>([]);

  useEffect(() => {
    const newlyAdded = layout.filter(
      (item) => !prevLayout.find((p) => p.id === item.id),
    );
    if (newlyAdded.length > 0) {
      setPrevLayout(layout);
    } else {
      const removedIds = prevLayout
        .filter((p) => !layout.find((l) => l.id === p.id))
        .map((p) => p.id);
      if (removedIds.length > 0) {
        setFadingOut(new Set(removedIds));
        const t = setTimeout(() => {
          setFadingOut(new Set());
          setPrevLayout(layout);
        }, 520);
        return () => clearTimeout(t);
      }
      setPrevLayout(layout);
    }
  }, [layout]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveAnimations((prev) => {
        let changed = false;
        const next: ActiveAnimation = {};
        for (const id in prev) {
          if (prev[id].expiresAt > now) {
            next[id] = prev[id];
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const triggerAnimation = useCallback(
    (item: LayoutItem, eventType: EventType) => {
      dispatch(
        logEvent({
          componentId: item.id,
          componentType: item.type,
          eventType,
        }),
      );
      const anim = getAnimationFor(item.type, eventType);
      if (!anim || Object.keys(anim).length === 0) return;
      const duration = 500;
      setActiveAnimations((prev) => ({
        ...prev,
        [item.id]: { style: anim, expiresAt: Date.now() + duration },
      }));
    },
    [dispatch],
  );

  const handleMouseDown = useCallback(
    (item: LayoutItem, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      dragOffset.current = {
        dx: e.clientX - rect.left - item.x,
        dy: e.clientY - rect.top - item.y,
      };
      setDraggingId(item.id);

      longPressRef.current.componentId = item.id;
      if (longPressRef.current.timer) clearTimeout(longPressRef.current.timer);
      longPressRef.current.timer = setTimeout(() => {
        if (longPressRef.current.componentId === item.id && draggingId === item.id) {
          triggerAnimation(item, 'onLongPress');
        }
      }, 1000);
    },
    [canvasRef, draggingId, triggerAnimation],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left - dragOffset.current.dx;
      let y = e.clientY - rect.top - dragOffset.current.dy;
      x = Math.max(0, Math.min(x, rect.width - 10));
      y = Math.max(0, Math.min(y, rect.height - 10));
      if (longPressRef.current.timer && (Math.abs(e.movementX) > 4 || Math.abs(e.movementY) > 4)) {
        clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
      }
      mouseMoveRaf.current = { id: draggingId, x, y };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (mouseMoveRaf.current) {
          dispatch(
            moveComponent({
              id: mouseMoveRaf.current.id,
              x: mouseMoveRaf.current.x,
              y: mouseMoveRaf.current.y,
            }),
          );
          mouseMoveRaf.current = null;
        }
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingId) return;
      if (longPressRef.current.timer) {
        clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
        const item = layout.find((l) => l.id === draggingId);
        if (item) {
          triggerAnimation(item, 'onClick');
        }
      }
      longPressRef.current.componentId = null;
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draggingId, canvasRef, dispatch, layout, triggerAnimation]);

  const handleDropFromPanel = useCallback(
    (type: ComponentType, clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return;
      }
      const x = clientX - rect.left - 70;
      const y = clientY - rect.top - 22;
      dispatch(
        addComponent({
          type,
          x: Math.max(0, Math.min(x, rect.width - 140)),
          y: Math.max(0, Math.min(y, rect.height - 50)),
        }),
      );
    },
    [canvasRef, dispatch],
  );

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { type, x, y } = e.detail;
      handleDropFromPanel(type, x, y);
    };
    window.addEventListener('panel-drop' as any, handler as any);
    return () => window.removeEventListener('panel-drop' as any, handler as any);
  }, [handleDropFromPanel]);

  // 暴露drop方法给父
  (Canvas as any).dropHandler = handleDropFromPanel;

  const renderItems = () => {
    const allItems: (LayoutItem & { fading?: boolean })[] = [...layout];
    for (const id of fadingOut) {
      const existing = prevLayout.find((p) => p.id === id);
      if (existing && !layout.find((l) => l.id === id)) {
        allItems.push({ ...existing, fading: true });
      }
    }
    return allItems.map((item) => {
      const activeAnim = activeAnimations[item.id];
      const isHovered = hovered === item.id;
      const isDragging = draggingId === item.id;
      let animStyle: React.CSSProperties = {
        transition: isDragging ? 'none' : BASE_TRANSITION,
      };
      if (activeAnim) {
        animStyle = { ...animStyle, ...activeAnim.style };
      } else if (isHovered && !isDragging) {
        const hoverAnim = getAnimationFor(item.type, 'onHover');
        animStyle = { ...animStyle, ...hoverAnim };
      }
      if ((item as any).fading) {
        animStyle = {
          ...animStyle,
          animation: 'fadeOutAnim 0.5s ease forwards',
        };
      }
      const isNewlyAdded =
        !prevLayout.find((p) => p.id === item.id) &&
        Date.now() - item.createdAt < 260 &&
        !(item as any).fading;
      if (isNewlyAdded) {
        animStyle = {
          ...animStyle,
          animation: 'placeBounce 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        };
      }
      return (
        <div
          key={item.id}
          className={`canvas-component type-${item.type.replace('-', '_')} ${
            isDragging ? 'is-dragging' : ''
          } ${isHovered ? 'is-hovered' : ''}`}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            zIndex: isDragging ? 100 : 10,
            ...animStyle,
          }}
          onMouseDown={(e) => handleMouseDown(item, e)}
          onMouseEnter={() => {
            setHovered(item.id);
            dispatch(
              logEvent({
                componentId: item.id,
                componentType: item.type,
                eventType: 'onHover',
              }),
            );
          }}
          onMouseLeave={() => {
            setHovered((h) => (h === item.id ? null : h));
          }}
        >
          {renderComponentInner(item.type, true)}
        </div>
      );
    });
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-title-row">
        <span className="canvas-title">预览画布 · 1200 × 700</span>
        <span className="canvas-subtitle">
          {layout.length} 个组件 · 拖拽移动 · 悬停点击长按触发动画
        </span>
      </div>
      <div className="canvas-scroll">
        <div
          ref={canvasRef as unknown as React.Ref<HTMLDivElement>}
          className="preview-canvas"
          onMouseDown={() => setHovered(null)}
        >
          {layout.length === 0 && (
            <div className="canvas-empty-state">
              <div className="empty-icon">⬚</div>
              <div className="empty-title">从左侧面板拖拽组件到此</div>
              <div className="empty-tip">
                悬停 / 点击 / 长按查看微交互效果 · 右侧实时查看事件日志
              </div>
            </div>
          )}
          {renderItems()}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
