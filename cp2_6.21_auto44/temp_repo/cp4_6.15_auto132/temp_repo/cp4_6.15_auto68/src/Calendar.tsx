import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  LayoutGrid,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useContentStore } from './store';
import { Content, ViewMode, Platform, PLATFORM_CONFIG, Particle } from './types';

const ItemTypes = {
  CONTENT_CARD: 'contentCard',
};

interface DragItem {
  id: string;
  content: Content;
}

interface ParticleState {
  particles: Particle[];
  anchorX: number;
  anchorY: number;
}

const platformBadgeColors: Record<Platform, string> = {
  weibo: '#E6162D',
  zhihu: '#0084FF',
  bilibili: '#FB7299',
};

const platformBadgeNames: Record<Platform, string> = {
  weibo: '微',
  zhihu: '知',
  bilibili: 'B',
};

const ContentCard: React.FC<{
  content: Content;
  view: 'compact' | 'full';
  onRetry?: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({ content, view, onRetry, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CONTENT_CARD,
    item: { id: content.id, content },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const statusConfig = {
    draft: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', label: '草稿' },
    scheduled: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: '待发布' },
    published: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: '已发布' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: '发布失败' },
  };

  const status = statusConfig[content.status];
  const StatusIcon = status.icon;

  if (view === 'compact') {
    return (
      <div
        ref={drag}
        className={`content-card-compact ${isDragging ? 'opacity-50 scale-95' : ''}`}
        style={{ transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="platform-badges">
          {content.platforms.slice(0, 3).map((platform) => (
            <span
              key={platform}
              className="platform-badge"
              style={{ backgroundColor: platformBadgeColors[platform] }}
            >
              {platformBadgeNames[platform]}
            </span>
          ))}
        </div>
        <div className="card-title text-white/90 text-xs truncate">
          {content.title}
        </div>
        <div className={`status-indicator ${status.color}`}>
          <StatusIcon size={10} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`content-card-full glass-card ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="platform-badges">
          {content.platforms.map((platform) => (
            <span
              key={platform}
              className="platform-badge"
              style={{ backgroundColor: platformBadgeColors[platform] }}
            >
              {platformBadgeNames[platform]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className={`status-badge ${status.bg} ${status.color}`}>
            <StatusIcon size={12} />
            <span className="text-xs">{status.label}</span>
          </span>
        </div>
      </div>

      <h4 className="text-white font-medium mb-1">{content.title}</h4>
      <p className="text-gray-400 text-sm line-clamp-2 mb-2">{content.body}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {format(new Date(content.scheduleTime), 'MM月dd日 HH:mm', { locale: zhCN })}
        </span>
        {content.status === 'published' && content.likes !== undefined && (
          <span className="flex items-center gap-2">
            <span>👍 {content.likes}</span>
            <span>🔄 {content.reposts}</span>
            <span>💬 {content.comments}</span>
          </span>
        )}
      </div>

      {content.status === 'failed' && content.errorMsg && (
        <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <AlertTriangle size={12} />
            <span>{content.errorMsg}</span>
          </div>
          {onRetry && (
            <button
              onClick={() => onRetry(content.id)}
              className="mt-2 flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs transition-colors"
            >
              <RefreshCw size={12} />
              <span>重新发布</span>
            </button>
          )}
        </div>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(content.id)}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const DayCell: React.FC<{
  date: Date;
  contents: Content[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onDateClick: (date: Date) => void;
  onDrop: (contentId: string, date: Date) => void;
  showParticles: (x: number, y: number) => void;
}> = ({ date, contents, isCurrentMonth, isSelected, onDateClick, onDrop, showParticles }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  const [{ isOver: isDragOver }, drop] = useDrop(() => ({
    accept: ItemTypes.CONTENT_CARD,
    drop: (item: DragItem, monitor) => {
      onDrop(item.id, date);
      const offset = monitor.getClientOffset();
      if (offset && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        showParticles(
          offset.x - rect.left,
          offset.y - rect.top
        );
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  useEffect(() => {
    setIsOver(isDragOver);
  }, [isDragOver]);

  const dropRef = (node: HTMLDivElement | null) => {
    ref.current = node;
    drop(node);
  };

  const displayContents = contents.slice(0, 3);
  const hasMore = contents.length > 3;

  return (
    <div
      ref={dropRef}
      className={`day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isOver ? 'drag-over' : ''}`}
      onClick={() => onDateClick(date)}
    >
      <div className={`day-number ${isToday(date) ? 'today' : ''}`}>
        {format(date, 'd')}
      </div>
      <div className="day-contents">
        {displayContents.map((content) => (
          <ContentCard key={content.id} content={content} view="compact" />
        ))}
        {hasMore && (
          <div className="more-indicator text-xs text-gray-500">
            +{contents.length - 3} 更多
          </div>
        )}
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contentTitle: string;
  newDate: string;
}> = ({ isOpen, onClose, onConfirm, contentTitle, newDate }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close">
          <X size={18} />
        </button>
        <h3 className="text-lg font-semibold text-white mb-2">确认排期变更</h3>
        <p className="text-gray-400 text-sm mb-4">
          将 <span className="text-cyan-400">"{contentTitle}"</span> 移动到{' '}
          <span className="text-cyan-400">{newDate}</span>
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={onConfirm} className="btn-primary">
            确认移动
          </button>
        </div>
      </div>
    </div>
  );
};

const MonthView: React.FC<{
  currentMonth: Date;
  selectedDate: string;
  onDateClick: (date: Date) => void;
  onDrop: (contentId: string, date: Date) => void;
  showParticles: (x: number, y: number) => void;
}> = ({ currentMonth, selectedDate, onDateClick, onDrop, showParticles }) => {
  const contents = useContentStore((state) => state.contents);
  const getContentsByDate = useContentStore((state) => state.getContentsByDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="month-view">
      <div className="weekday-header">
        {weekDays.map((day) => (
          <div key={day} className="weekday-cell">
            {day}
          </div>
        ))}
      </div>
      <div className="days-grid">
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayContents = getContentsByDate(dateStr);
          return (
            <DayCell
              key={dateStr}
              date={date}
              contents={dayContents}
              isCurrentMonth={isSameMonth(date, currentMonth)}
              isSelected={selectedDate === dateStr}
              onDateClick={onDateClick}
              onDrop={onDrop}
              showParticles={showParticles}
            />
          );
        })}
      </div>
    </div>
  );
};

const WeekView: React.FC<{
  selectedDate: string;
  onDateClick: (date: Date) => void;
  onDrop: (contentId: string, date: Date) => void;
  showParticles: (x: number, y: number) => void;
}> = ({ selectedDate, onDateClick, onDrop, showParticles }) => {
  const getContentsByDate = useContentStore((state) => state.getContentsByDate);
  
  const selected = new Date(selectedDate);
  const weekStart = startOfWeek(selected, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="week-view">
      {days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayContents = getContentsByDate(dateStr);
        return (
          <div key={dateStr} className="week-day-column">
            <div className={`week-day-header ${isToday(date) ? 'today' : ''}`}>
              <span className="week-day-name">{format(date, 'EEE', { locale: zhCN })}</span>
              <span className="week-day-number">{format(date, 'd')}</span>
            </div>
            <div className="week-day-contents">
              {dayContents.map((content) => (
                <ContentCard key={content.id} content={content} view="compact" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ListView: React.FC = () => {
  const contents = useContentStore((state) => state.contents);
  const retryPublish = useContentStore((state) => state.retryPublish);
  const deleteContent = useContentStore((state) => state.deleteContent);

  const sortedContents = [...contents].sort(
    (a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime()
  );

  return (
    <div className="list-view">
      {sortedContents.length === 0 ? (
        <div className="empty-state text-center py-12">
          <CalendarIcon size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-500">暂无内容，去创建一条吧</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sortedContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              view="full"
              onRetry={retryPublish}
              onDelete={deleteContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Calendar: React.FC = () => {
  const viewMode = useContentStore((state) => state.viewMode);
  const currentMonth = useContentStore((state) => state.currentMonth);
  const selectedDate = useContentStore((state) => state.selectedDate);
  const setViewMode = useContentStore((state) => state.setViewMode);
  const setCurrentMonth = useContentStore((state) => state.setCurrentMonth);
  const setSelectedDate = useContentStore((state) => state.setSelectedDate);
  const rescheduleContent = useContentStore((state) => state.rescheduleContent);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    contentId: string;
    contentTitle: string;
    newDate: Date | null;
  }>({
    isOpen: false,
    contentId: '',
    contentTitle: '',
    newDate: null,
  });

  const [particleState, setParticleState] = useState<ParticleState>({
    particles: [],
    anchorX: 0,
    anchorY: 0,
  });
  
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const showParticles = useCallback((x: number, y: number) => {
    const colors = ['#00e5ff', '#ff6b6b', '#a855f7', '#22d3ee', '#f472b6'];
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      life: 1,
    }));

    setParticleState((prev) => ({
      particles: [...prev.particles, ...newParticles],
      anchorX: x,
      anchorY: y,
    }));
  }, []);

  useEffect(() => {
    if (particleState.particles.length === 0) return;

    const animate = () => {
      setParticleState((prev) => {
        const updated = prev.particles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3,
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0);

        return { ...prev, particles: updated };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleState.particles.length]);

  const handleDrop = (contentId: string, newDate: Date) => {
    const content = useContentStore.getState().contents.find((c) => c.id === contentId);
    if (!content) return;

    const oldDate = format(new Date(content.scheduleTime), 'yyyy-MM-dd');
    const newDateStr = format(newDate, 'yyyy-MM-dd');

    if (oldDate === newDateStr) return;

    setConfirmModal({
      isOpen: true,
      contentId,
      contentTitle: content.title,
      newDate,
    });
  };

  const confirmReschedule = () => {
    if (!confirmModal.newDate) return;

    const content = useContentStore.getState().contents.find(
      (c) => c.id === confirmModal.contentId
    );
    if (!content) return;

    const originalTime = new Date(content.scheduleTime);
    const newDateTime = new Date(confirmModal.newDate);
    newDateTime.setHours(
      originalTime.getHours(),
      originalTime.getMinutes(),
      0,
      0
    );

    rescheduleContent(confirmModal.contentId, newDateTime.toISOString());

    setConfirmModal({
      isOpen: false,
      contentId: '',
      contentTitle: '',
      newDate: null,
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="calendar-container glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 opacity-60"></div>

        {particleState.particles.length > 0 && (
          <div
            ref={particleContainerRef}
            className="particles-container"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {particleState.particles.map((p) => (
              <div
                key={p.id}
                className="particle"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.life,
                  transform: `scale(${p.life})`,
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              内容日历
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="nav-btn"
                title="上个月"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
              </span>
              <button
                onClick={nextMonth}
                className="nav-btn"
                title="下个月"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              title="月视图"
            >
              <Grid3X3 size={16} />
              <span className="text-xs ml-1">月</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              title="周视图"
            >
              <LayoutGrid size={16} />
              <span className="text-xs ml-1">周</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="列表视图"
            >
              <List size={16} />
              <span className="text-xs ml-1">列表</span>
            </button>
          </div>
        </div>

        <div className="view-transition-container">
          {viewMode === 'month' && (
            <MonthView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              onDrop={handleDrop}
              showParticles={showParticles}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              onDrop={handleDrop}
              showParticles={showParticles}
            />
          )}
          {viewMode === 'list' && <ListView />}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal({
              isOpen: false,
              contentId: '',
              contentTitle: '',
              newDate: null,
            })
          }
          onConfirm={confirmReschedule}
          contentTitle={confirmModal.contentTitle}
          newDate={confirmModal.newDate ? format(confirmModal.newDate, 'yyyy年MM月dd日', { locale: zhCN }) : ''}
        />
      </div>
    </DndProvider>
  );
};
