import { TimelineEvent, EventType, Connection, LineAnimation, NotificationType, PRESET_COLORS, HOUR_PIXELS } from './types';
import { useTimelineStore, parseISODate } from './dataManager';

export interface UIController {
  showAddEventForm: (prefillDate?: string, position?: { x: number; y: number }) => void;
  showEditEventForm: (event: TimelineEvent) => void;
  hideEventForm: () => void;
  submitEventForm: (data: {
    title: string;
    description: string;
    date: string;
    type: EventType;
    mediaUrl?: string;
  }) => void;

  showConnectionForm: (connection: Connection) => void;
  hideConnectionForm: () => void;
  submitConnectionForm: (data: {
    color: string;
    width: number;
    animation: LineAnimation;
  }) => void;

  toggleViewMode: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;

  exportAsJSON: () => void;
  importFromJSON: (file: File) => Promise<boolean>;
  exportAsMarkdown: () => void;

  startConnection: (fromEventId: string) => void;
  cancelConnection: () => void;

  showNotification: (message: string, type: NotificationType) => void;

  validateMediaUrl: (url: string, type: EventType) => { valid: boolean; message?: string };

  xPositionToDate: (x: number) => string;
  nextSlide: () => void;
  prevSlide: () => void;
  gotoSlide: (index: number) => void;
}

const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const imgExt = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
  const dataImg = /^data:image\//i;
  const imgHost = /picsum\.photos|unsplash\.com|images\.unsplash\.com|placehold\.co|i\.imgur\.com/i;
  return imgExt.test(url) || dataImg.test(url) || imgHost.test(url);
};

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const youtube = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/i;
  const vimeo = /(vimeo\.com\/|player\.vimeo\.com\/video\/)/i;
  const videoExt = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
  return youtube.test(url) || vimeo.test(url) || videoExt.test(url);
};

export const createUIController = (): UIController => {
  const store = useTimelineStore;

  return {
    showAddEventForm: (prefillDate, position) => {
      const config = store.getState().config;
      const today = new Date();
      const isoDate = prefillDate ??
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      let pos: { x: number; y: number } | undefined = position;
      if (!pos) {
        const baseDate = parseISODate(config.startDate);
        const targetDate = parseISODate(isoDate);
        const minutes = (targetDate.getTime() - baseDate.getTime()) / 60000;
        const x = (minutes / 60) * HOUR_PIXELS * config.zoomLevel;
        const count = store.getState().events.length;
        pos = { x, y: 100 + (count % 5) * 90 };
      }

      const tempEvent: TimelineEvent = {
        id: '',
        title: '',
        description: '',
        date: isoDate,
        type: 'text',
        position: pos,
        span: 0,
        collapsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      store.getState().setEditingEvent(tempEvent);
      store.getState().setShowEventForm(true);
    },

    showEditEventForm: (event: TimelineEvent) => {
      store.getState().setEditingEvent({ ...event });
      store.getState().setShowEventForm(true);
      store.getState().selectEvent(event.id);
    },

    hideEventForm: () => {
      store.getState().setShowEventForm(false);
      store.getState().setEditingEvent(null);
    },

    submitEventForm: (data) => {
      const state = store.getState();
      const { editingEvent } = state;

      if (!data.title.trim()) {
        state.showNotification('请输入事件标题', 'error');
        return;
      }
      if (data.description.length > 500) {
        state.showNotification('描述不能超过 500 字符', 'error');
        return;
      }

      const baseDate = parseISODate(state.config.startDate);
      const targetDate = parseISODate(data.date);
      const minutes = (targetDate.getTime() - baseDate.getTime()) / 60000;
      const x = (minutes / 60) * HOUR_PIXELS * state.config.zoomLevel;

      if (editingEvent && editingEvent.id) {
        state.updateEvent(editingEvent.id, {
          title: data.title,
          description: data.description,
          date: data.date,
          type: data.type,
          mediaUrl: data.mediaUrl,
          position: { ...editingEvent.position, x: Math.max(0, x) },
        });
        state.showNotification('事件已更新', 'success');
      } else {
        const result = state.addEvent({
          title: data.title,
          description: data.description,
          date: data.date,
          type: data.type,
          mediaUrl: data.mediaUrl,
          position: editingEvent?.position ?? { x: Math.max(0, x), y: 100 + (state.events.length % 5) * 90 },
        });
        state.showNotification('事件已添加', 'success');
        setTimeout(() => {
          store.getState().selectEvent(result.id);
        }, 100);
      }

      state.setShowEventForm(false);
      state.setEditingEvent(null);
    },

    showConnectionForm: (connection: Connection) => {
      store.getState().setEditingConnection({ ...connection });
      store.getState().setShowConnectionForm(true);
      store.getState().selectConnection(connection.id);
    },

    hideConnectionForm: () => {
      store.getState().setShowConnectionForm(false);
      store.getState().setEditingConnection(null);
    },

    submitConnectionForm: (data) => {
      const state = store.getState();
      const { editingConnection } = state;
      if (!editingConnection) return;

      if (!PRESET_COLORS.includes(data.color)) {
        state.showNotification('请选择有效的颜色', 'error');
        return;
      }
      if (data.width < 2 || data.width > 6) {
        state.showNotification('线宽必须在 2-6px 之间', 'error');
        return;
      }

      state.updateConnection(editingConnection.id, data);
      state.showNotification('关联线样式已更新', 'success');
      state.setShowConnectionForm(false);
      state.setEditingConnection(null);
    },

    toggleViewMode: () => {
      const state = store.getState();
      const next = state.config.viewMode === 'scroll' ? 'slides' : 'scroll';
      state.setViewMode(next);
      state.showNotification(next === 'scroll' ? '已切换到滚动模式' : '已切换到幻灯片模式', 'info');
    },

    openExportModal: () => {
      store.getState().setShowExportModal(true);
    },

    closeExportModal: () => {
      store.getState().setShowExportModal(false);
    },

    exportAsJSON: () => {
      const state = store.getState();
      const json = state.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (state.config.title || 'timeline').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.showNotification('JSON 文件已导出', 'success');
      state.setShowExportModal(false);
    },

    importFromJSON: async (file: File) => {
      try {
        const text = await file.text();
        const ok = store.getState().importJSON(text);
        if (ok) {
          store.getState().showNotification('数据已导入', 'success');
          store.getState().setShowExportModal(false);
          return true;
        } else {
          store.getState().showNotification('导入失败：文件格式无效', 'error');
          return false;
        }
      } catch {
        store.getState().showNotification('导入失败：读取文件错误', 'error');
        return false;
      }
    },

    exportAsMarkdown: () => {
      const state = store.getState();
      const md = state.exportMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (state.config.title || 'timeline').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.showNotification('Markdown 文件已导出', 'success');
      state.setShowExportModal(false);
    },

    startConnection: (fromEventId: string) => {
      store.getState().setConnectingFrom(fromEventId);
      store.getState().showNotification('请点击目标节点完成关联，或按 Esc 取消', 'info');
    },

    cancelConnection: () => {
      store.getState().setConnectingFrom(null);
    },

    showNotification: (message, type) => {
      store.getState().showNotification(message, type);
    },

    validateMediaUrl: (url, type) => {
      if (!url) return { valid: true };
      try {
        new URL(url);
      } catch {
        return { valid: false, message: 'URL 格式不正确' };
      }
      if (type === 'image' && !isImageUrl(url)) {
        return { valid: false, message: '图片 URL 看起来不正确，将显示占位图标' };
      }
      if (type === 'video' && !isVideoUrl(url)) {
        return { valid: false, message: '视频 URL 看起来不正确，将显示占位图标' };
      }
      return { valid: true };
    },

    xPositionToDate: (x: number) => {
      const state = store.getState();
      const baseDate = parseISODate(state.config.startDate);
      const minutes = (x / (HOUR_PIXELS * state.config.zoomLevel)) * 60;
      const d = new Date(baseDate.getTime() + minutes * 60000);
      const y = d.getFullYear();
      if (y < 0) {
        return `-${String(Math.abs(y)).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    nextSlide: () => {
      const state = store.getState();
      const total = state.events.length;
      if (total === 0) return;
      const next = (state.currentSlideIndex + 1) % total;
      state.setCurrentSlideIndex(next);
    },

    prevSlide: () => {
      const state = store.getState();
      const total = state.events.length;
      if (total === 0) return;
      const prev = (state.currentSlideIndex - 1 + total) % total;
      state.setCurrentSlideIndex(prev);
    },

    gotoSlide: (index: number) => {
      const state = store.getState();
      const total = state.events.length;
      if (total === 0) return;
      const clamped = Math.max(0, Math.min(total - 1, index));
      state.setCurrentSlideIndex(clamped);
    },
  };
};

export { isImageUrl, isVideoUrl };
