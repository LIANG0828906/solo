import { useState } from 'react';
import {
  MousePointer2,
  Square,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Download,
  Menu,
  Palette,
  Film,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { VideoUploader } from '@/components/VideoUploader';
import { FrameTimeline } from '@/components/FrameTimeline';
import { AnnotationCanvas } from '@/components/AnnotationCanvas';
import { AnnotationList } from '@/components/AnnotationList';
import { ExportModal } from '@/components/ExportModal';
import type { ToolType } from '@/utils/types';

const PRESET_COLORS = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB', '#FFFFFF'];

function ToolButton({
  tool,
  active,
  onClick,
  icon,
  label,
}: {
  tool: ToolType;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="btn-transition flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-primary)',
        color: active ? '#000' : 'var(--text-secondary)',
        border: active ? 'none' : '1px solid var(--border-color)',
      }}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function SidebarContent() {
  const {
    activeTool,
    setActiveTool,
    toolColor,
    setToolColor,
    lineWidth,
    setLineWidth,
    undo,
    redo,
    canUndo,
    canRedo,
    frames,
  } = useAppStore();

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
      <div className="flex items-center gap-2 px-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
        >
          <Film style={{ width: 18, height: 18, color: '#000' }} />
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            SnapScape
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            逐帧标注工具
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <MousePointer2 style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            标注工具
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <ToolButton
            tool="select"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
            icon={<MousePointer2 style={{ width: 18, height: 18 }} />}
            label="选择"
          />
          <ToolButton
            tool="rectangle"
            active={activeTool === 'rectangle'}
            onClick={() => setActiveTool('rectangle')}
            icon={<Square style={{ width: 18, height: 18 }} />}
            label="矩形"
          />
          <ToolButton
            tool="arrow"
            active={activeTool === 'arrow'}
            onClick={() => setActiveTool('arrow')}
            icon={<ArrowRight style={{ width: 18, height: 18 }} />}
            label="箭头"
          />
          <ToolButton
            tool="text"
            active={activeTool === 'text'}
            onClick={() => setActiveTool('text')}
            icon={<Type style={{ width: 18, height: 18 }} />}
            label="文字"
          />
        </div>
      </div>

      <div
        className="rounded-2xl p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <Palette style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            画笔设置
          </span>
        </div>

        <div className="px-1 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              颜色
            </span>
            <div
              className="w-5 h-5 rounded border"
              style={{ background: toolColor, borderColor: 'var(--border-color)' }}
            />
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className="btn-transition w-full aspect-square rounded-md"
                style={{
                  background: c,
                  outline: toolColor === c ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 2,
                }}
                onClick={() => setToolColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="px-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              线宽
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              {lineWidth}px
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </div>
      </div>

      <div
        className="rounded-2xl p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <Undo2 style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            历史记录
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-transition py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onClick={undo}
            disabled={!canUndo()}
          >
            <Undo2 style={{ width: 14, height: 14 }} />
            撤销
          </button>
          <button
            className="btn-transition py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onClick={redo}
            disabled={!canRedo()}
          >
            <Redo2 style={{ width: 14, height: 14 }} />
            重做
          </button>
        </div>
      </div>

      {frames.length > 0 && <AnnotationList />}
    </div>
  );
}

export default function App() {
  const { frames, appStatus, setShowExportModal, sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileMenu, setMobileMenu] = useState(false);

  const canExport = frames.length > 0 && appStatus === 'ready';

  return (
    <div
      className="w-full h-full flex"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <aside
        className={`sidebar-desktop shrink-0 h-full glass flex-col ${
          sidebarOpen ? 'flex' : 'hidden'
        }`}
        style={{
          width: 350,
          borderRight: '1px solid var(--border-color)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <SidebarContent />
      </aside>

      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileMenu(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 glass flex-col"
            style={{
              width: 320,
              borderRight: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(18,18,18,0.8)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="btn-transition p-2 rounded-xl lg:hidden"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
              onClick={() => setMobileMenu(true)}
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
            <button
              className="btn-transition p-2 rounded-xl hidden lg:inline-flex"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                工作区
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {frames.length > 0
                  ? `已加载 ${frames.length} 帧`
                  : '上传视频开始标注'}
              </div>
            </div>
          </div>

          <button
            className="btn-transition py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canExport
                ? 'linear-gradient(135deg, #00838F 0%, #00BCD4 100%)'
                : 'var(--bg-card)',
              color: canExport ? '#fff' : 'var(--text-muted)',
              boxShadow: canExport ? '0 4px 20px rgba(0, 188, 212, 0.3)' : 'none',
              border: canExport ? 'none' : '1px solid var(--border-color)',
            }}
            disabled={!canExport}
            onClick={() => canExport && setShowExportModal(true)}
            onMouseEnter={(e) => {
              if (canExport) {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            <span className="hidden sm:inline">导出</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          {frames.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-xl">
                <VideoUploader />
                <div
                  className="mt-6 text-center text-xs space-y-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <p>支持 MP4、WebM、MOV 等常见视频格式</p>
                  <p>视频将在本地处理，不会上传到服务器</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="w-full max-w-[900px]">
                  <AnnotationCanvas />
                </div>
              </div>
              <FrameTimeline />
            </>
          )}
        </div>
      </main>

      <ExportModal />
    </div>
  );
}
