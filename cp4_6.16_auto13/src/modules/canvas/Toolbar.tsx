import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEditorStore } from '@/store/useEditorStore';
import type { ColorTheme } from '@/types';
import { downloadPoster } from '@/utils/canvasExport';
import type { LucideIcon } from 'lucide-react';
import {
  Type,
  Image,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Save,
  History,
  RotateCcw,
  Download,
  Share2,
  Layout,
  Palette,
  LayoutGrid,
} from 'lucide-react';

interface ToolbarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  action: 'toggle' | 'direct';
  panel?: 'templates' | 'colors' | 'versions';
  onClick?: () => void;
  route?: string;
}

const GRADIENT_STYLE: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function Toolbar() {
  const {
    addTextElement,
    addImageElement,
    moveToTop,
    moveToBottom,
    moveUp,
    moveDown,
    duplicateSelected,
    deleteSelected,
    saveSnapshot,
    isSaving,
    setActivePanel,
    activePanel,
    resetCanvas,
    elements,
    canvasBackground,
    getCurrentTheme,
    selectedId,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme: ColorTheme = getCurrentTheme();

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (src) addImageElement(src);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [addImageElement]
  );

  const handleSave = useCallback(async () => {
    await saveSnapshot();
  }, [saveSnapshot]);

  const handleDownload = useCallback(async () => {
    await downloadPoster(elements, canvasBackground, theme);
  }, [elements, canvasBackground, theme]);

  const handleReset = useCallback(() => {
    if (elements.length === 0) {
      resetCanvas();
      return;
    }
    if (window.confirm('确定要重置画布吗？所有内容将被清除。')) {
      resetCanvas();
    }
  }, [elements.length, resetCanvas]);

  const togglePanel = useCallback(
    (panel: 'templates' | 'colors' | 'versions') => {
      setActivePanel(activePanel === panel ? null : panel);
    },
    [activePanel, setActivePanel]
  );

  const hasSelection = selectedId !== null;

  const items: ToolbarItem[] = [
    { id: 'text', icon: Type, label: '添加文字', action: 'direct', onClick: addTextElement },
    { id: 'image', icon: Image, label: '添加图片', action: 'direct', onClick: triggerImageUpload },
    { id: 'top', icon: ArrowUpToLine, label: '置于顶层', action: 'direct', onClick: () => hasSelection && moveToTop() },
    { id: 'bottom', icon: ArrowDownToLine, label: '置于底层', action: 'direct', onClick: () => hasSelection && moveToBottom() },
    { id: 'up', icon: ArrowUp, label: '上移一层', action: 'direct', onClick: () => hasSelection && moveUp() },
    { id: 'down', icon: ArrowDown, label: '下移一层', action: 'direct', onClick: () => hasSelection && moveDown() },
    { id: 'copy', icon: Copy, label: '复制 (Ctrl+D)', action: 'direct', onClick: () => hasSelection && duplicateSelected() },
    { id: 'delete', icon: Trash2, label: '删除 (Del)', action: 'direct', onClick: () => hasSelection && deleteSelected() },
    { id: 'save', icon: Save, label: '保存版本', action: 'direct', onClick: handleSave },
    { id: 'versions', icon: History, label: '版本历史', action: 'toggle', panel: 'versions', onClick: () => togglePanel('versions') },
    { id: 'reset', icon: RotateCcw, label: '重置画布', action: 'direct', onClick: handleReset },
    { id: 'download', icon: Download, label: '下载导出', action: 'direct', onClick: handleDownload },
    { id: 'publish', icon: Share2, label: '发布作品', action: 'direct', onClick: () => window.dispatchEvent(new CustomEvent('open-publish')) },
    { id: 'templates', icon: Layout, label: '模板库', action: 'toggle', panel: 'templates', onClick: () => togglePanel('templates') },
    { id: 'colors', icon: Palette, label: '配色方案', action: 'toggle', panel: 'colors', onClick: () => togglePanel('colors') },
    { id: 'gallery', icon: LayoutGrid, label: '前往广场', action: 'direct', route: '/gallery' },
  ];

  const renderIcon = (Icon: LucideIcon, size: number, isActive: boolean) => (
    <span
      className={`inline-flex transition-all duration-200 ease-out group-hover:scale-125 ${isActive ? 'scale-110' : ''}`}
      style={!isActive ? GRADIENT_STYLE : undefined}
    >
      <Icon size={size} className={isActive ? 'text-indigo-600' : ''} />
    </span>
  );

  return (
    <>
      <div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col w-[72px] rounded-2xl p-2 gap-1 backdrop-blur-xl bg-white/60 border border-white/60"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.18), 0 2px 8px rgba(168,85,247,0.12)',
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.action === 'toggle' && item.panel && activePanel === item.panel;
          const isDisabled =
            (item.id === 'top' ||
              item.id === 'bottom' ||
              item.id === 'up' ||
              item.id === 'down' ||
              item.id === 'copy' ||
              item.id === 'delete') &&
            !hasSelection;

          if (item.route) {
            return (
              <Link
                key={item.id}
                to={item.route}
                title={item.label}
                className="relative flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-200 ease-out group cursor-pointer hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10"
              >
                {renderIcon(Icon, 22, false)}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              disabled={isDisabled || (item.id === 'save' && isSaving)}
              onClick={item.onClick}
              title={item.label}
              className={`relative flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-200 ease-out group ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-400/50'
                  : 'hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10'
              } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${item.id === 'save' && isSaving ? 'opacity-50' : ''}`}
            >
              {renderIcon(Icon, 22, !!isActive)}
              {item.id === 'save' && isSaving && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-sm">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-[64px] px-2 py-2 gap-1 backdrop-blur-xl bg-white/70 border-t border-white/60 flex items-center justify-between overflow-x-auto"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -8px 32px rgba(99,102,241,0.18)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.action === 'toggle' && item.panel && activePanel === item.panel;
          const isDisabled =
            (item.id === 'top' ||
              item.id === 'bottom' ||
              item.id === 'up' ||
              item.id === 'down' ||
              item.id === 'copy' ||
              item.id === 'delete') &&
            !hasSelection;

          if (item.route) {
            return (
              <Link
                key={item.id}
                to={item.route}
                title={item.label}
                className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl transition-all duration-200 ease-out group cursor-pointer hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10"
              >
                {renderIcon(Icon, 20, false)}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              disabled={isDisabled || (item.id === 'save' && isSaving)}
              onClick={item.onClick}
              title={item.label}
              className={`relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl transition-all duration-200 ease-out group ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-400/50'
                  : 'hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10'
              } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {renderIcon(Icon, 20, !!isActive)}
              {item.id === 'save' && isSaving && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-sm">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
