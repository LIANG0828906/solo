import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { TimelineRenderer } from '../timelineRenderer';
import { useTimelineStore } from '../dataManager';
import { UIController } from '../uiController';
import { RendererEvent } from '../types';
import { cn } from '../lib/utils';

interface ScrollTimelineViewProps {
  timelineRenderer: TimelineRenderer;
  containerRef: React.RefObject<HTMLDivElement>;
  uiController: UIController;
}

export default function ScrollTimelineView({ timelineRenderer, containerRef, uiController }: ScrollTimelineViewProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const events = useTimelineStore((s) => s.events);
  const connectingFromId = useTimelineStore((s) => s.connectingFromId);
  const config = useTimelineStore((s) => s.config);
  const connections = useTimelineStore((s) => s.connections);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!innerRef.current) return;
    const handle = timelineRenderer.mount(innerRef.current);
    timelineRenderer.update(events, connections, config);

    const handleRendererEvent = (event: RendererEvent) => {
      switch (event.type) {
        case 'canvas-double-click': {
          const dateStr = uiController.xPositionToDate(event.position?.x ?? 0);
          uiController.showAddEventForm(dateStr, event.position);
          break;
        }
        case 'event-click': {
          const ev = useTimelineStore.getState().getEvent(event.eventId!);
          if (ev) uiController.showEditEventForm(ev);
          break;
        }
        case 'event-drag-move': {
          if (event.eventId && event.position) {
            useTimelineStore.getState().dragUpdatePosition(
              event.eventId,
              event.position.x,
              event.position.y
            );
          }
          break;
        }
        case 'event-drag-end': {
          if (event.eventId && event.position) {
            useTimelineStore.getState().finalizeDrag(
              event.eventId,
              event.position.x,
              event.position.y
            );
          }
          break;
        }
        case 'connection-click': {
          const conn = useTimelineStore
            .getState()
            .connections.find((c) => c.id === event.connectionId);
          if (conn) uiController.showConnectionForm(conn);
          break;
        }
        case 'create-connection-start': {
          if (event.eventId) {
            timelineRenderer.setConnectingFrom(event.eventId);
            uiController.startConnection(event.eventId);
          }
          break;
        }
        case 'create-connection-end': {
          const fromId = (event.payload as { fromId: string })?.fromId;
          const toId = event.eventId;
          if (fromId && toId && fromId !== toId) {
            const exists = useTimelineStore
              .getState()
              .connections.some(
                (c) =>
                  (c.fromEventId === fromId && c.toEventId === toId) ||
                  (c.fromEventId === toId && c.toEventId === fromId)
              );
            if (!exists) {
              useTimelineStore.getState().addConnection({
                fromEventId: fromId,
                toEventId: toId,
              });
              uiController.showNotification('关联已创建', 'success');
            } else {
              uiController.showNotification('该关联已存在', 'info');
            }
          }
          timelineRenderer.setConnectingFrom(null);
          uiController.cancelConnection();
          break;
        }
      }
    };

    const eventTypes = [
      'canvas-double-click',
      'event-click',
      'event-drag-move',
      'event-drag-end',
      'connection-click',
      'create-connection-start',
      'create-connection-end',
    ] as const;

    eventTypes.forEach((t) => timelineRenderer.addEventListener(t, handleRendererEvent));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (connectingFromId) {
          timelineRenderer.setConnectingFrom(null);
          uiController.cancelConnection();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const outer = containerRef.current;
    let targetScroll = 0;
    let currentScroll = 0;
    let rafId: number | null = null;
    const damping = 0.05;

    const animate = () => {
      currentScroll += (targetScroll - currentScroll) * damping;
      if (outer) outer.scrollLeft = currentScroll;
      if (Math.abs(targetScroll - currentScroll) > 0.5) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!outer) return;
      e.preventDefault();
      targetScroll = Math.max(
        0,
        Math.min(outer.scrollWidth - outer.clientWidth, outer.scrollLeft + e.deltaY)
      );
      currentScroll = outer.scrollLeft;
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    outer?.addEventListener('wheel', handleWheel, { passive: false });

    const handleMouseMove = (e: MouseEvent) => {
      if (connectingFromId) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      eventTypes.forEach((t) => timelineRenderer.removeEventListener(t, handleRendererEvent));
      document.removeEventListener('keydown', handleKeyDown);
      outer?.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
      handle.destroy();
    };
  }, [timelineRenderer, containerRef, uiController, connectingFromId]);

  useEffect(() => {
    timelineRenderer.update(events, connections, config);
  }, [timelineRenderer, events, connections, config]);

  const hasData = events.length > 0;
  const connectingEvent = connectingFromId
    ? useTimelineStore.getState().getEvent(connectingFromId)
    : null;

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto overflow-y-hidden w-full relative"
      style={{
        height: 'calc(100vh - 60px)',
        scrollBehavior: 'smooth',
      }}
    >
      <div id="timeline-container" ref={innerRef} className="w-full h-full min-w-full" />

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Clock className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-600">
                双击画布或点击上方+号开始创建
              </p>
              <p className="text-sm text-gray-400">
                第一个时间节点将从这里开启你的时光之旅
              </p>
            </div>
          </div>
        </div>
      )}

      {connectingFromId && mousePos && (
        <div
          className="fixed pointer-events-none z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
            background: 'rgba(99, 102, 241, 0.95)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>从「{connectingEvent?.title.slice(0, 8) || '事件'}」</span>
          <span className="text-indigo-200">→ 点击目标节点完成关联</span>
          <span className="text-indigo-300 text-xs ml-1">(Esc 取消)</span>
        </div>
      )}
    </div>
  );
}
