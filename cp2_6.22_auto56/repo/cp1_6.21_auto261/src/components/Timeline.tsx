import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { select, axisBottom, axisLeft, timeFormat } from 'd3';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeline } from '@/hooks/useTimeline';
import { exportTimelineAsPNG } from '@/utils/exportUtils';
import type { TimelineEvent, Annotation, TimeRange } from '@/types';
import SearchBox from './SearchBox';
import RangeSlider from './RangeSlider';
import AnnotationMenu from './AnnotationMenu';

interface TimelineProps {
  events: TimelineEvent[];
  annotations: Annotation[];
  timeRange: TimeRange | null;
  searchKeyword: string;
  theme: 'light' | 'dark';
  onSearchChange: (keyword: string) => void;
  onRangeChange: (range: [Date, Date]) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onExportPNG: () => void;
}

const PADDING = { top: 40, right: 30, bottom: 40, left: 30 };
const HEIGHT = 400;

const Timeline: React.FC<TimelineProps> = ({
  events,
  annotations,
  timeRange,
  searchKeyword,
  theme,
  onSearchChange,
  onRangeChange,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onExportPNG,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [editText, setEditText] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, date: new Date() });
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);

  const { filteredEvents, xScale, yScale, xAxisTicks, isInRange } = useTimeline({
    events,
    timeRange,
    searchKeyword,
    width,
    height: HEIGHT,
    padding: PADDING,
  });

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!svgRef.current || filteredEvents.length === 0) return;

    const svg = select(svgRef.current);
    const innerWidth = width - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${PADDING.left},${PADDING.top})`);

    const trackBg = theme === 'dark' ? '#1E293B' : '#F8FAFC';
    const trackLine = theme === 'dark' ? '#334155' : '#E2E8F0';
    const textColor = theme === 'dark' ? '#E2E8F0' : '#475569';

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', trackBg)
      .attr('rx', 8);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        axisBottom(xScale)
          .tickValues(xAxisTicks)
          .tickFormat(timeFormat('%Y-%m-%d'))
          .tickSizeOuter(0)
      );

    xAxisGroup.selectAll('text').attr('fill', textColor).attr('font-size', '11px');
    xAxisGroup.selectAll('line').attr('stroke', trackLine);
    xAxisGroup.select('.domain').attr('stroke', trackLine);

    const yAxisGroup = g
      .append('g')
      .call(
        axisLeft(yScale)
          .tickFormat((d) => {
            const event = filteredEvents.find((e) => e.id === d);
            return event ? event.eventName.substring(0, 15) : '';
          })
          .tickSizeOuter(0)
      );

    yAxisGroup.selectAll('text').attr('fill', textColor).attr('font-size', '11px');
    yAxisGroup.selectAll('line').attr('stroke', trackLine);
    yAxisGroup.select('.domain').attr('stroke', trackLine);

    filteredEvents.forEach((event) => {
      const y = yScale(event.id);
      if (y === undefined) return;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', y + yScale.bandwidth() / 2)
        .attr('x2', innerWidth)
        .attr('y2', y + yScale.bandwidth() / 2)
        .attr('stroke', '#D1D5DB')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
    });

    const eventGroups = g
      .selectAll('.event-group')
      .data(filteredEvents, (d) => (d as TimelineEvent).id)
      .enter()
      .append('g')
      .attr('class', 'event-group')
      .attr('cursor', (d) => (isInRange(d.date) ? 'pointer' : 'default'));

    eventGroups
      .append('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => {
        const y = yScale(d.id);
        return y !== undefined ? y + yScale.bandwidth() / 2 : 0;
      })
      .attr('r', 12)
      .attr('fill', '#3B82F6')
      .attr('opacity', (d) => (isInRange(d.date) ? 1 : 0.2))
      .attr('pointer-events', (d) => (isInRange(d.date) ? 'auto' : 'none'))
      .on('mouseenter', function () {
        select(this).transition().duration(150).attr('r', 18);
        select(this)
          .style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))');
      })
      .on('mouseleave', function () {
        select(this).transition().duration(150).attr('r', 12);
        select(this).style('filter', 'none');
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        if (isInRange(d.date)) {
          setSelectedEvent(d);
        }
      });

    const annotationGroups = g
      .selectAll('.annotation-group')
      .data(annotations, (d) => (d as Annotation).id)
      .enter()
      .append('g')
      .attr('class', 'annotation-group')
      .attr('cursor', 'pointer');

    annotationGroups
      .append('polygon')
      .attr('points', (d) => {
        const cx = PADDING.left + d.x;
        const cy = PADDING.top + d.y;
        return `${cx},${cy - 12} ${cx + 12},${cy} ${cx},${cy + 12} ${cx - 12},${cy}`;
      })
      .attr('fill', '#F59E0B')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .on('mouseenter', (event, d) => {
        event.stopPropagation();
        setHoveredAnnotationId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredAnnotationId(null);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        setEditingAnnotation(d);
        setEditText(d.text);
      });

    annotationGroups
      .append('text')
      .attr('x', (d) => PADDING.left + d.x)
      .attr('y', (d) => PADDING.top + d.y + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#FFFFFF')
      .attr('pointer-events', 'none')
      .text('?');
  }, [filteredEvents, annotations, xScale, yScale, xAxisTicks, width, theme, isInRange, onSearchChange, onRangeChange]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - PADDING.left;
      const y = e.clientY - rect.top - PADDING.top;

      const innerWidth = width - PADDING.left - PADDING.right;
      const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

      if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
        const date = xScale.invert(x);
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, date });
      }
    },
    [width, xScale]
  );

  const handleAddAnnotation = useCallback(() => {
    const newAnnotation: Annotation = {
      id: `anno-${Date.now()}`,
      x: xScale(contextMenu.date),
      y: (HEIGHT - PADDING.top - PADDING.bottom) / 2,
      date: contextMenu.date,
      text: '',
    };
    onAddAnnotation(newAnnotation);
    setEditingAnnotation(newAnnotation);
    setEditText('');
  }, [contextMenu.date, onAddAnnotation, xScale]);

  const handleSaveEdit = useCallback(() => {
    if (editingAnnotation) {
      onUpdateAnnotation(editingAnnotation.id, editText);
      setEditingAnnotation(null);
      setEditText('');
    }
  }, [editingAnnotation, editText, onUpdateAnnotation]);

  const handleDeleteAnnotation = useCallback(() => {
    if (editingAnnotation) {
      onDeleteAnnotation(editingAnnotation.id);
      setEditingAnnotation(null);
      setEditText('');
    }
  }, [editingAnnotation, onDeleteAnnotation]);

  const handleExportPNG = useCallback(() => {
    exportTimelineAsPNG('timeline-container', `timeline-${Date.now()}`).catch(() => {
      onExportPNG();
    });
  }, [onExportPNG]);

  const minDate = events.length > 0 ? events.reduce((min, e) => (e.date < min ? e.date : min), events[0].date) : new Date();
  const maxDate = events.length > 0 ? events.reduce((max, e) => (e.date > max ? e.date : max), events[0].date) : new Date();

  return (
    <div
      ref={containerRef}
      id="timeline-container"
      className={cn(
        'relative w-full rounded-xl p-4',
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      onContextMenu={handleContextMenu}
      onClick={() => {
        setSelectedEvent(null);
        setContextMenu({ ...contextMenu, visible: false });
      }}
    >
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <SearchBox value={searchKeyword} onChange={onSearchChange} placeholder="搜索事件..." />
        <button
          type="button"
          onClick={handleExportPNG}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors',
            theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          <Download size={16} />
          导出为PNG
        </button>
      </div>

      {events.length > 0 && (
        <div className="mb-4 px-2">
          <RangeSlider
            min={minDate}
            max={maxDate}
            value={timeRange ? [timeRange.start, timeRange.end] : [minDate, maxDate]}
            onChange={onRangeChange}
          />
        </div>
      )}

      <div className="relative">
        <svg ref={svgRef} width="100%" height={HEIGHT} />

        {selectedEvent && (
          <div
            className="absolute z-20"
            style={{
              left: PADDING.left + xScale(selectedEvent.date) + 24,
              top: PADDING.top + (yScale(selectedEvent.id) || 0) + yScale.bandwidth() / 2 - 60,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative rounded-xl p-4 max-w-[320px]"
              style={{
                backgroundColor: '#F8FAFC',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
              <h4 className="font-semibold text-gray-900 mb-2 pr-6">{selectedEvent.eventName}</h4>
              <p className="text-sm text-gray-500 mb-2">{selectedEvent.dateString}</p>
              {selectedEvent.description && (
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              )}
            </div>
          </div>
        )}

        {hoveredAnnotationId && (
          <>
            {annotations.map((anno) =>
              anno.id === hoveredAnnotationId && anno.text ? (
                <div
                  key={anno.id}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: PADDING.left + anno.x - 100,
                    top: PADDING.top + anno.y - 50,
                  }}
                >
                  <div
                    className="rounded px-3 py-2 max-w-[200px] text-sm"
                    style={{
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                    }}
                  >
                    {anno.text}
                  </div>
                </div>
              ) : null
            )}
          </>
        )}

        {editingAnnotation && (
          <div
            className="absolute z-30"
            style={{
              left: PADDING.left + editingAnnotation.x - 100,
              top: PADDING.top + editingAnnotation.y - 80,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-lg p-3 w-[200px]"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="输入注释内容..."
                className="w-full h-20 p-2 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAnnotation}
                  className="flex-1 px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnnotationMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onAdd={handleAddAnnotation}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      />
    </div>
  );
};

Timeline.displayName = 'Timeline';

export default memo(Timeline);
