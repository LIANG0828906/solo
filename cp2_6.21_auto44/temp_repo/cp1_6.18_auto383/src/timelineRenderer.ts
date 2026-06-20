import {
  TimelineEvent,
  Connection,
  TimelineConfig,
  EVENT_TYPE_COLORS,
  EVENT_NODE_WIDTH,
  EVENT_NODE_HEIGHT,
  HOUR_PIXELS,
  RendererEvent,
  RendererEventType,
  RendererEventHandler,
  LineAnimation,
} from './types';
import { parseISODate } from './dataManager';

const TIMELINE_Y = 60;
const TOP_PADDING = 140;
const SIDE_PADDING = 60;

export interface TimelineRendererHandle {
  update: () => void;
  destroy: () => void;
  scrollToEvent: (id: string) => void;
}

export class TimelineRenderer {
  private container: HTMLElement | null = null;
  private svg: SVGSVGElement | null = null;
  private defs: SVGDefsElement | null = null;
  private eventsLayer: SVGGElement | null = null;
  private connectionsLayer: SVGGElement | null = null;
  private gridLayer: SVGGElement | null = null;
  private timelineAxis: SVGGElement | null = null;

  private events: TimelineEvent[] = [];
  private connections: Connection[] = [];
  private config: TimelineConfig;

  private eventHandlers: Map<RendererEventType, Set<RendererEventHandler>> = new Map();
  private draggingEventId: string | null = null;
  private dragStartPos = { x: 0, y: 0 };
  private dragStartNodePos = { x: 0, y: 0 };
  private rafId: number | null = null;
  private lastDragPos = { x: 0, y: 0 };
  private connectingFromId: string | null = null;
  private tempLine: SVGPathElement | null = null;

  constructor(config: TimelineConfig) {
    this.config = config;
  }

  mount(container: HTMLElement): TimelineRendererHandle {
    this.container = container;
    this.createSvg();
    this.bindContainerEvents();
    return {
      update: () => this.render(),
      destroy: () => this.unmount(),
      scrollToEvent: (id) => this.scrollToEvent(id),
    };
  }

  unmount() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.svg && this.container) {
      this.container.removeChild(this.svg);
    }
    this.svg = null;
    this.container = null;
  }

  setConnectingFrom(id: string | null) {
    this.connectingFromId = id;
    if (!id && this.tempLine && this.svg) {
      this.connectionsLayer?.removeChild(this.tempLine);
      this.tempLine = null;
    }
  }

  private createSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('class', 'timeline-svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';
    this.svg.style.overflow = 'visible';

    this.defs = document.createElementNS(ns, 'defs');
    this.svg.appendChild(this.defs);
    this.createFilters();

    this.gridLayer = document.createElementNS(ns, 'g');
    this.gridLayer.setAttribute('class', 'grid-layer');
    this.svg.appendChild(this.gridLayer);

    this.timelineAxis = document.createElementNS(ns, 'g');
    this.timelineAxis.setAttribute('class', 'timeline-axis');
    this.svg.appendChild(this.timelineAxis);

    this.connectionsLayer = document.createElementNS(ns, 'g');
    this.connectionsLayer.setAttribute('class', 'connections-layer');
    this.svg.appendChild(this.connectionsLayer);

    this.eventsLayer = document.createElementNS(ns, 'g');
    this.eventsLayer.setAttribute('class', 'events-layer');
    this.svg.appendChild(this.eventsLayer);

    this.container?.appendChild(this.svg);
  }

  private createFilters() {
    const ns = 'http://www.w3.org/2000/svg';
    if (!this.defs) return;

    const dropShadow = document.createElementNS(ns, 'filter');
    dropShadow.setAttribute('id', 'node-shadow');
    dropShadow.setAttribute('x', '-50%');
    dropShadow.setAttribute('y', '-50%');
    dropShadow.setAttribute('width', '200%');
    dropShadow.setAttribute('height', '200%');
    const feDropShadow = document.createElementNS(ns, 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '4');
    feDropShadow.setAttribute('flood-opacity', '0.15');
    dropShadow.appendChild(feDropShadow);
    this.defs.appendChild(dropShadow);

    const dropShadowHover = document.createElementNS(ns, 'filter');
    dropShadowHover.setAttribute('id', 'node-shadow-hover');
    dropShadowHover.setAttribute('x', '-50%');
    dropShadowHover.setAttribute('y', '-50%');
    dropShadowHover.setAttribute('width', '200%');
    dropShadowHover.setAttribute('height', '200%');
    const feDropShadowHover = document.createElementNS(ns, 'feDropShadow');
    feDropShadowHover.setAttribute('dx', '0');
    feDropShadowHover.setAttribute('dy', '4');
    feDropShadowHover.setAttribute('stdDeviation', '8');
    feDropShadowHover.setAttribute('flood-opacity', '0.25');
    dropShadowHover.appendChild(feDropShadowHover);
    this.defs.appendChild(dropShadowHover);

    const flowingGradient = document.createElementNS(ns, 'linearGradient');
    flowingGradient.setAttribute('id', 'flowing-gradient');
    flowingGradient.setAttribute('x1', '0%');
    flowingGradient.setAttribute('y1', '0%');
    flowingGradient.setAttribute('x2', '100%');
    flowingGradient.setAttribute('y2', '0%');
    const s1 = document.createElementNS(ns, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', 'transparent');
    flowingGradient.appendChild(s1);
    const s2 = document.createElementNS(ns, 'stop');
    s2.setAttribute('offset', '50%');
    s2.setAttribute('stop-color', 'currentColor');
    flowingGradient.appendChild(s2);
    const s3 = document.createElementNS(ns, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', 'transparent');
    flowingGradient.appendChild(s3);
    this.defs.appendChild(flowingGradient);

    const wavePattern = document.createElementNS(ns, 'pattern');
    wavePattern.setAttribute('id', 'wave-pattern');
    wavePattern.setAttribute('width', '20');
    wavePattern.setAttribute('height', '10');
    wavePattern.setAttribute('patternUnits', 'userSpaceOnUse');
    const wavePath = document.createElementNS(ns, 'path');
    wavePath.setAttribute('d', 'M0 5 Q 5 0 10 5 T 20 5');
    wavePath.setAttribute('fill', 'none');
    wavePath.setAttribute('stroke', 'currentColor');
    wavePath.setAttribute('stroke-width', '1.5');
    wavePattern.appendChild(wavePath);
    this.defs.appendChild(wavePattern);
  }

  update(events: TimelineEvent[], connections: Connection[], config: TimelineConfig) {
    this.events = events;
    this.connections = connections;
    this.config = config;
    this.render();
  }

  private render() {
    if (!this.svg) return;
    const totalMinutes = this.getTotalMinutes();
    const totalWidth = Math.max(
      (totalMinutes / 60) * HOUR_PIXELS * this.config.zoomLevel + SIDE_PADDING * 2,
      (this.container?.clientWidth ?? 800)
    );
    const height = this.getCanvasHeight();
    this.svg.setAttribute('viewBox', `0 0 ${totalWidth} ${height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');

    this.renderGrid(totalWidth, height);
    this.renderTimelineAxis(totalWidth);
    this.renderConnections();
    this.renderEvents();
  }

  private getTotalMinutes(): number {
    if (this.events.length === 0) {
      const start = parseISODate(this.config.startDate).getTime();
      const end = parseISODate(this.config.endDate).getTime();
      return Math.round((end - start) / 60000);
    }
    const base = parseISODate(this.config.startDate).getTime();
    let max = 0;
    this.events.forEach((e) => {
      const mins = (parseISODate(e.date).getTime() - base) / 60000;
      if (mins > max) max = mins;
    });
    return Math.max(max + 24 * 60, 24 * 60 * 30);
  }

  private getCanvasHeight(): number {
    let maxY = TOP_PADDING + 400;
    this.events.forEach((e) => {
      const bottom = TOP_PADDING + e.position.y + EVENT_NODE_HEIGHT + 60;
      if (bottom > maxY) maxY = bottom;
    });
    return maxY;
  }

  private renderGrid(width: number, height: number) {
    if (!this.gridLayer || !this.svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    while (this.gridLayer.firstChild) {
      this.gridLayer.removeChild(this.gridLayer.firstChild);
    }

    const hourWidth = HOUR_PIXELS * this.config.zoomLevel;
    for (let x = SIDE_PADDING; x < width - SIDE_PADDING; x += hourWidth) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', String(TOP_PADDING - 20));
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(height));
      line.setAttribute('stroke', '#E5E7EB');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4,4');
      this.gridLayer.appendChild(line);
    }
  }

  private renderTimelineAxis(width: number) {
    if (!this.timelineAxis) return;
    const ns = 'http://www.w3.org/2000/svg';
    while (this.timelineAxis.firstChild) {
      this.timelineAxis.removeChild(this.timelineAxis.firstChild);
    }

    const axisY = TOP_PADDING + TIMELINE_Y;
    const mainLine = document.createElementNS(ns, 'line');
    mainLine.setAttribute('x1', String(SIDE_PADDING));
    mainLine.setAttribute('y1', String(axisY));
    mainLine.setAttribute('x2', String(width - SIDE_PADDING));
    mainLine.setAttribute('y2', String(axisY));
    mainLine.setAttribute('stroke', '#D1D5DB');
    mainLine.setAttribute('stroke-width', '2');
    this.timelineAxis.appendChild(mainLine);

    const hourWidth = HOUR_PIXELS * this.config.zoomLevel;
    const baseDate = parseISODate(this.config.startDate);

    let hourCounter = 0;
    for (let x = SIDE_PADDING; x < width - SIDE_PADDING; x += hourWidth / 4) {
      const isHour = hourCounter % 4 === 0;
      const isSixHour = hourCounter % 24 === 0;
      const tickHeight = isSixHour ? 20 : isHour ? 12 : 6;
      const tickWidth = isSixHour ? 2 : isHour ? 1 : 0.5;

      const tick = document.createElementNS(ns, 'line');
      tick.setAttribute('x1', String(x));
      tick.setAttribute('y1', String(axisY - tickHeight / 2));
      tick.setAttribute('x2', String(x));
      tick.setAttribute('y2', String(axisY + tickHeight / 2));
      tick.setAttribute('stroke', '#D1D5DB');
      tick.setAttribute('stroke-width', String(tickWidth));
      this.timelineAxis.appendChild(tick);

      if (isHour) {
        const currentDate = new Date(baseDate.getTime() + hourCounter * 15 * 60000);
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', String(x));
        label.setAttribute('y', String(axisY + 32));
        label.setAttribute('fill', '#6B7280');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-family', 'PingFang SC, system-ui, sans-serif');
        label.setAttribute('text-anchor', 'middle');
        const hh = String(currentDate.getHours()).padStart(2, '0');
        const mm = String(currentDate.getMinutes()).padStart(2, '0');
        label.textContent = isSixHour
          ? `${currentDate.getMonth() + 1}/${currentDate.getDate()} ${hh}:${mm}`
          : `${hh}:${mm}`;
        this.timelineAxis.appendChild(label);
      }
      hourCounter++;
    }
  }

  private renderConnections() {
    if (!this.connectionsLayer) return;
    const ns = 'http://www.w3.org/2000/svg';
    while (this.connectionsLayer.firstChild) {
      this.connectionsLayer.removeChild(this.connectionsLayer.firstChild);
    }

    this.connections.forEach((conn) => {
      const from = this.events.find((e) => e.id === conn.fromEventId);
      const to = this.events.find((e) => e.id === conn.toEventId);
      if (!from || !to) return;

      const x1 = SIDE_PADDING + from.position.x + EVENT_NODE_WIDTH / 2;
      const y1 = TOP_PADDING + from.position.y + EVENT_NODE_HEIGHT / 2;
      const x2 = SIDE_PADDING + to.position.x + EVENT_NODE_WIDTH / 2;
      const y2 = TOP_PADDING + to.position.y + EVENT_NODE_HEIGHT / 2;

      const midX = (x1 + x2) / 2;
      const d = `M${x1} ${y1} C${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', conn.color);
      path.setAttribute('stroke-width', String(conn.width));
      path.setAttribute('stroke-dasharray', '8,4');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('cursor', 'pointer');
      path.setAttribute('data-connection-id', conn.id);
      path.style.transition = 'stroke-width 0.2s ease, filter 0.2s ease';

      if (conn.animation === 'flowing') {
        const anim = document.createElementNS(ns, 'animate');
        anim.setAttribute('attributeName', 'stroke-dashoffset');
        anim.setAttribute('from', '24');
        anim.setAttribute('to', '0');
        anim.setAttribute('dur', '1s');
        anim.setAttribute('repeatCount', 'indefinite');
        path.appendChild(anim);

        const glowPath = path.cloneNode() as SVGPathElement;
        glowPath.setAttribute('stroke', conn.color);
        glowPath.setAttribute('stroke-width', String(conn.width + 1));
        glowPath.setAttribute('stroke-opacity', '0.3');
        glowPath.setAttribute('filter', 'blur(2px)');
        this.connectionsLayer?.appendChild(glowPath);
      } else if (conn.animation === 'wave') {
        path.setAttribute('stroke-dasharray', 'none');
        path.setAttribute('stroke-width', String(conn.width + 2));
        path.setAttribute('stroke', `url(#wave-pattern)`);
        path.style.color = conn.color;
      }

      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.emit({
          type: 'connection-click',
          connectionId: conn.id,
        });
      });

      path.addEventListener('mouseenter', () => {
        path.setAttribute('stroke-width', String(conn.width + 2));
        path.style.filter = 'drop-shadow(0 0 6px currentColor)';
      });
      path.addEventListener('mouseleave', () => {
        path.setAttribute('stroke-width', String(conn.width));
        path.style.filter = 'none';
      });

      this.connectionsLayer?.appendChild(path);
    });
  }

  private renderEvents() {
    if (!this.eventsLayer) return;
    const ns = 'http://www.w3.org/2000/svg';
    while (this.eventsLayer.firstChild) {
      this.eventsLayer.removeChild(this.eventsLayer.firstChild);
    }

    this.events.forEach((event) => {
      this.renderSingleEvent(event, ns);
    });
  }

  private renderSingleEvent(event: TimelineEvent, ns: string) {
    if (!this.eventsLayer) return;
    const x = SIDE_PADDING + event.position.x;
    const y = TOP_PADDING + event.position.y;
    const color = EVENT_TYPE_COLORS[event.type];

    const group = document.createElementNS(ns, 'g');
    group.setAttribute('data-event-id', event.id);
    group.setAttribute('transform', `translate(${x}, ${y})`);
    group.style.cursor = 'grab';
    group.style.transformOrigin = `${EVENT_NODE_WIDTH / 2}px ${EVENT_NODE_HEIGHT / 2}px`;
    group.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease';

    const shadow = document.createElementNS(ns, 'rect');
    shadow.setAttribute('width', String(EVENT_NODE_WIDTH));
    shadow.setAttribute('height', String(EVENT_NODE_HEIGHT));
    shadow.setAttribute('x', '0');
    shadow.setAttribute('y', '0');
    shadow.setAttribute('rx', '12');
    shadow.setAttribute('fill', 'rgba(255,255,255,0.8)');
    shadow.setAttribute('filter', 'url(#node-shadow)');
    group.appendChild(shadow);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', String(EVENT_NODE_WIDTH - 4));
    rect.setAttribute('height', String(EVENT_NODE_HEIGHT - 4));
    rect.setAttribute('x', '2');
    rect.setAttribute('y', '2');
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', 'rgba(255,255,255,0.9)');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '2');
    rect.style.backdropFilter = 'blur(8px)';
    rect.style.webkitBackdropFilter = 'blur(8px)';
    group.appendChild(rect);

    const typeBar = document.createElementNS(ns, 'rect');
    typeBar.setAttribute('width', '4');
    typeBar.setAttribute('height', String(EVENT_NODE_HEIGHT - 16));
    typeBar.setAttribute('x', '10');
    typeBar.setAttribute('y', '8');
    typeBar.setAttribute('rx', '2');
    typeBar.setAttribute('fill', color);
    group.appendChild(typeBar);

    const title = document.createElementNS(ns, 'text');
    title.setAttribute('x', '22');
    title.setAttribute('y', '28');
    title.setAttribute('fill', '#111827');
    title.setAttribute('font-size', '13');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'PingFang SC, system-ui, sans-serif');
    title.textContent = event.title.length > 10 ? event.title.slice(0, 10) + '…' : event.title;
    group.appendChild(title);

    const dateLabel = document.createElementNS(ns, 'text');
    dateLabel.setAttribute('x', '22');
    dateLabel.setAttribute('y', '46');
    dateLabel.setAttribute('fill', '#6B7280');
    dateLabel.setAttribute('font-size', '10');
    dateLabel.setAttribute('font-family', 'PingFang SC, system-ui, sans-serif');
    const parsedDate = parseISODate(event.date);
    const yStr = parsedDate.getFullYear() < 0
      ? `公元前${Math.abs(parsedDate.getFullYear())}年`
      : `${parsedDate.getFullYear()}/${parsedDate.getMonth() + 1}`;
    dateLabel.textContent = yStr;
    group.appendChild(dateLabel);

    const typeIcon = document.createElementNS(ns, 'text');
    typeIcon.setAttribute('x', String(EVENT_NODE_WIDTH - 18));
    typeIcon.setAttribute('y', '28');
    typeIcon.setAttribute('text-anchor', 'middle');
    typeIcon.setAttribute('font-size', '12');
    typeIcon.textContent = event.type === 'text' ? '📝' : event.type === 'image' ? '🖼️' : '🎬';
    group.appendChild(typeIcon);

    const lineY = TOP_PADDING + TIMELINE_Y;
    const connector = document.createElementNS(ns, 'line');
    connector.setAttribute('x1', String(EVENT_NODE_WIDTH / 2));
    connector.setAttribute('y1', String(-(y - lineY) + EVENT_NODE_HEIGHT / 2));
    connector.setAttribute('x2', String(EVENT_NODE_WIDTH / 2));
    connector.setAttribute('y2', String(0));
    connector.setAttribute('stroke', color);
    connector.setAttribute('stroke-width', '1');
    connector.setAttribute('stroke-dasharray', '3,3');
    connector.setAttribute('opacity', '0.5');
    group.appendChild(connector);

    group.addEventListener('mouseenter', () => {
      if (this.draggingEventId) return;
      group.style.transform = `translate(${x}, ${y}) scale(1.1)`;
      shadow.setAttribute('filter', 'url(#node-shadow-hover)');
    });
    group.addEventListener('mouseleave', () => {
      if (this.draggingEventId === event.id) return;
      group.style.transform = `translate(${x}, ${y}) scale(1)`;
      shadow.setAttribute('filter', 'url(#node-shadow)');
    });

    group.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.connectingFromId && this.connectingFromId !== event.id) {
        this.emit({
          type: 'create-connection-end',
          eventId: event.id,
          payload: { fromId: this.connectingFromId },
        });
        this.setConnectingFrom(null);
        return;
      }
      this.emit({
        type: 'event-click',
        eventId: event.id,
      });
    });

    group.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.startDrag(event.id, e.clientX, e.clientY, x, y);
    });

    group.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (!this.connectingFromId) {
        this.setConnectingFrom(event.id);
        this.emit({
          type: 'create-connection-start',
          eventId: event.id,
        });
        this.startTempLine(event);
      }
    });

    this.eventsLayer?.appendChild(group);
  }

  private startTempLine(event: TimelineEvent) {
    if (!this.connectionsLayer || !this.svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    this.tempLine = document.createElementNS(ns, 'path');
    this.tempLine.setAttribute('stroke', '#6366F1');
    this.tempLine.setAttribute('stroke-width', '2');
    this.tempLine.setAttribute('stroke-dasharray', '6,4');
    this.tempLine.setAttribute('fill', 'none');
    this.tempLine.setAttribute('opacity', '0.7');
    this.connectionsLayer.appendChild(this.tempLine);
  }

  private updateTempLine(clientX: number, clientY: number) {
    if (!this.tempLine || !this.connectingFromId || !this.svg) return;
    const event = this.events.find((e) => e.id === this.connectingFromId);
    if (!event) return;

    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const x1 = SIDE_PADDING + event.position.x + EVENT_NODE_WIDTH / 2;
    const y1 = TOP_PADDING + event.position.y + EVENT_NODE_HEIGHT / 2;
    const midX = (x1 + svgPt.x) / 2;
    this.tempLine.setAttribute('d', `M${x1} ${y1} C${midX} ${y1}, ${midX} ${svgPt.y}, ${svgPt.x} ${svgPt.y}`);
  }

  private startDrag(id: string, clientX: number, clientY: number, nodeX: number, nodeY: number) {
    this.draggingEventId = id;
    this.dragStartPos = { x: clientX, y: clientY };
    this.dragStartNodePos = { x: nodeX, y: nodeY };
    this.lastDragPos = { x: clientX, y: clientY };

    this.emit({
      type: 'event-drag-start',
      eventId: id,
      position: { x: clientX, y: clientY },
    });

    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  private handleDragMove = (e: MouseEvent) => {
    if (!this.draggingEventId || !this.svg) return;
    this.updateTempLine(e.clientX, e.clientY);

    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      if (!this.draggingEventId) {
        this.rafId = null;
        return;
      }
      const ctm = this.svg?.getScreenCTM();
      if (!ctm) {
        this.rafId = null;
        return;
      }
      const pt = this.svg!.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());

      const dx = e.clientX - this.dragStartPos.x;
      const dy = e.clientY - this.dragStartPos.y;

      let newX = this.dragStartNodePos.x + (dx / ctm.a);
      let newY = this.dragStartNodePos.y + (dy / ctm.d);
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      this.lastDragPos = { x: svgPt.x, y: svgPt.y };

      this.emit({
        type: 'event-drag-move',
        eventId: this.draggingEventId,
        position: { x: newX - SIDE_PADDING, y: newY - TOP_PADDING },
        payload: { rawClientX: e.clientX, rawClientY: e.clientY },
      });

      this.rafId = null;
    });
  };

  private handleDragEnd = (e: MouseEvent) => {
    if (!this.draggingEventId || !this.svg) {
      this.cleanupDrag();
      return;
    }
    const ctm = this.svg.getScreenCTM();
    if (!ctm) {
      this.cleanupDrag();
      return;
    }
    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;

    const finalX = this.dragStartNodePos.x + (dx / ctm.a) - SIDE_PADDING;
    const finalY = this.dragStartNodePos.y + (dy / ctm.d) - TOP_PADDING;

    this.emit({
      type: 'event-drag-end',
      eventId: this.draggingEventId,
      position: { x: Math.max(0, finalX), y: Math.max(0, finalY) },
    });

    this.cleanupDrag();
  };

  private cleanupDrag() {
    this.draggingEventId = null;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  private bindContainerEvents() {
    if (!this.container) return;
    this.container.addEventListener('dblclick', (e) => {
      if (e.target === this.container || e.target === this.svg) {
        const pt = this.svg!.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = this.svg!.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        this.emit({
          type: 'canvas-double-click',
          position: { x: svgPt.x - SIDE_PADDING, y: svgPt.y - TOP_PADDING },
        });
      }
    });
  }

  addEventListener(type: RendererEventType, handler: RendererEventHandler) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)!.add(handler);
  }

  removeEventListener(type: RendererEventType, handler: RendererEventHandler) {
    this.eventHandlers.get(type)?.delete(handler);
  }

  private emit(event: RendererEvent) {
    this.eventHandlers.get(event.type)?.forEach((h) => h(event));
  }

  scrollToEvent(id: string) {
    const event = this.events.find((e) => e.id === id);
    if (!event || !this.container) return;
    const scrollX = SIDE_PADDING + event.position.x - this.container.clientWidth / 2 + EVENT_NODE_WIDTH / 2;
    this.container.scrollTo({
      left: Math.max(0, scrollX),
      behavior: 'smooth',
    });
  }
}
