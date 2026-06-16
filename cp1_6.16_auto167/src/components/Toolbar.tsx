import { useState, useRef } from 'react';
import {
  Square,
  Circle,
  Route,
  Download,
  Upload,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Eye,
  Play,
  Grip,
  Plus,
  ImagePlus,
  Link2,
  X,
} from 'lucide-react';
import { useLayoutStore } from '@/store/layoutStore';
import { useApiStore } from '@/store/apiStore';
import { THEME_COLORS, ViewMode, TEXT_PRIMARY } from '@/types';
import { exportLayout, downloadLayout, triggerFileImport } from '@/utils/exportImport';

const VIEW_MODES: { value: ViewMode; label: string; icon: typeof Eye }[] = [
  { value: 'edit', label: '编辑模式', icon: Eye },
  { value: 'preview', label: '预览模式', icon: Play },
  { value: 'visitor', label: '访客轨迹', icon: Grip },
];

export default function Toolbar() {
  const {
    selectedZoneId,
    zones,
    currentViewMode,
    isDrawingPath,
    visitorSpeed,
    addZone,
    updateZone,
    deleteZone,
    bringZoneForward,
    sendZoneBackward,
    rotateZone,
    addExhibitToZone,
    startDrawingPath,
    finishDrawingPath,
    cancelDrawingPath,
    setViewMode,
    setVisitorSpeed,
    resetCanvas,
    clearAll,
    restoreLayout,
  } = useLayoutStore();

  const { exhibits, isExporting, setExporting } = useApiStore();
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [showExhibitPicker, setShowExhibitPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const urlNameInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 400));
    const data = exportLayout(
      useLayoutStore.getState().zones,
      useLayoutStore.getState().paths,
      useLayoutStore.getState().canvas
    );
    downloadLayout(data);
    setTimeout(() => setExporting(false), 300);
  };

  const handleImport = async () => {
    try {
      const result = await triggerFileImport();
      restoreLayout(result.zones, result.paths, result.canvas);
    } catch {
      /* ignore */
    }
  };

  const handleAddExhibitFromLibrary = (src: string, name: string) => {
    if (!selectedZoneId) return;
    addExhibitToZone(selectedZoneId, src, name);
    setShowExhibitPicker(false);
  };

  const handleAddExhibitFromUrl = () => {
    if (!selectedZoneId || !urlInput.trim()) return;
    const name = (urlNameInputRef.current?.value || '自定义展品').trim();
    addExhibitToZone(selectedZoneId, urlInput.trim(), name);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const currentView = VIEW_MODES.find((m) => m.value === currentViewMode)!;

  const filteredExhibits = exhibits.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className="h-full flex flex-col shrink-0"
      style={{
        width: 280,
        background: 'var(--bg-panel)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="font-display text-xl font-semibold" style={{ color: TEXT_PRIMARY }}>
          策展工作室
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          虚拟展厅布局设计工具
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* 创建展区 */}
        <section>
          <div className="panel-title">创建展区</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-base btn-secondary"
              onClick={() => addZone('rect', 300 + zones.length * 30, 200 + zones.length * 30)}
            >
              <Square size={16} />
              矩形展区
            </button>
            <button
              className="btn-base btn-secondary"
              onClick={() => addZone('circle', 300 + zones.length * 30, 200 + zones.length * 30)}
            >
              <Circle size={16} />
              圆形展区
            </button>
          </div>
        </section>

        {/* 主题色板 */}
        <section>
          <div className="panel-title">主题色板</div>
          <div className="grid grid-cols-4 gap-2">
            {THEME_COLORS.map((c) => (
              <div
                key={c.value}
                title={c.name}
                className={`color-swatch ${selectedZone?.bgColor === c.value ? 'selected' : ''}`}
                style={{ background: c.value }}
                onClick={() => {
                  if (selectedZoneId) updateZone(selectedZoneId, { bgColor: c.value });
                }}
              />
            ))}
          </div>
          {!selectedZoneId && (
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>
              选中展区后点击色板修改背景色
            </p>
          )}
        </section>

        {/* 动线绘制 */}
        <section>
          <div className="panel-title">参观动线</div>
          {!isDrawingPath ? (
            <button
              className="btn-base w-full"
              style={{
                background: 'var(--accent-2)',
                color: 'white',
              }}
              onClick={startDrawingPath}
            >
              <Route size={16} />
              开始绘制动线
            </button>
          ) : (
            <div className="space-y-2">
              <div
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(142, 68, 173, 0.15)',
                  color: '#bb86d6',
                  border: '1px dashed rgba(142, 68, 173, 0.4)',
                }}
              >
                点击画布添加路径点，至少2个点后完成
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-base btn-primary" onClick={finishDrawingPath}>
                  完成
                </button>
                <button className="btn-base btn-ghost" onClick={cancelDrawingPath}>
                  <X size={14} />
                  取消
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 视图切换 */}
        <section className="relative">
          <div className="panel-title">视图模式</div>
          <button
            className="btn-base w-full btn-secondary justify-between"
            onClick={() => setViewDropdownOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <currentView.icon size={16} />
              {currentView.label}
            </span>
          </button>
          {viewDropdownOpen && (
            <div
              className="absolute left-0 right-0 z-50 mt-2 rounded-lg overflow-hidden shadow-xl"
              style={{
                background: 'var(--bg-bar)',
                border: '1px solid rgba(255,255,255,0.1)',
                top: '100%',
              }}
            >
              {VIEW_MODES.map((m) => (
                <button
                  key={m.value}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors"
                  style={{
                    color: currentViewMode === m.value ? 'var(--accent)' : TEXT_PRIMARY,
                    background: currentViewMode === m.value ? 'rgba(233,69,96,0.08)' : 'transparent',
                  }}
                  onClick={() => {
                    setViewMode(m.value);
                    setViewDropdownOpen(false);
                  }}
                >
                  <m.icon size={15} />
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {currentViewMode === 'visitor' && (
            <div className="mt-3">
              <div
                className="text-xs mb-1.5 flex justify-between"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>行走速度</span>
                <span style={{ color: 'var(--accent-2)' }}>{visitorSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={visitorSpeed}
                onChange={(e) => setVisitorSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#8E44AD]"
              />
            </div>
          )}
        </section>

        {/* 选中展区操作 */}
        {selectedZone && (
          <section className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="panel-title">展区操作</div>
            <div className="space-y-3">
              <div>
                <label
                  className="text-xs block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  展区标题
                </label>
                <input
                  value={selectedZone.title}
                  onChange={(e) => updateZone(selectedZoneId!, { title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: TEXT_PRIMARY,
                  }}
                />
              </div>
              <div>
                <label
                  className="text-xs block mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  策展人备注
                </label>
                <textarea
                  value={selectedZone.note}
                  onChange={(e) => updateZone(selectedZoneId!, { note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: TEXT_PRIMARY,
                  }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  className="btn-base btn-ghost !px-0 !py-2"
                  title="逆时针旋转"
                  onClick={() => rotateZone(selectedZoneId!, -1)}
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  className="btn-base btn-ghost !px-0 !py-2"
                  title="顺时针旋转"
                  onClick={() => rotateZone(selectedZoneId!, 1)}
                >
                  <RotateCw size={15} />
                </button>
                <button
                  className="btn-base btn-ghost !px-0 !py-2"
                  title="上移一层"
                  onClick={() => bringZoneForward(selectedZoneId!)}
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  className="btn-base btn-ghost !px-0 !py-2"
                  title="下移一层"
                  onClick={() => sendZoneBackward(selectedZoneId!)}
                >
                  <ChevronDown size={15} />
                </button>
              </div>

              <div>
                <div
                  className="text-xs mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  添加展品（{selectedZone.exhibits.length}件）
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn-base btn-secondary text-xs"
                    onClick={() => setShowExhibitPicker(true)}
                  >
                    <ImagePlus size={13} />
                    素材库
                  </button>
                  <button
                    className="btn-base btn-secondary text-xs"
                    onClick={() => setShowUrlInput(true)}
                  >
                    <Link2 size={13} />
                    URL
                  </button>
                </div>
              </div>

              <button
                className="btn-base w-full"
                style={{
                  background: 'rgba(233, 69, 96, 0.12)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(233, 69, 96, 0.3)',
                }}
                onClick={() => deleteZone(selectedZoneId!)}
              >
                <Trash2 size={14} />
                删除展区
              </button>
            </div>
          </section>
        )}

        {/* 画布控制 */}
        <section className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="panel-title">画布控制</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-base btn-ghost text-xs" onClick={resetCanvas}>
              <Plus size={13} />
              重置视图
            </button>
            <button
              className="btn-base btn-ghost text-xs"
              onClick={() => {
                if (confirm('确定清空所有内容吗？此操作不可撤销。')) clearAll();
              }}
            >
              <Trash2 size={13} />
              清空画布
            </button>
          </div>
        </section>

        {/* 导入导出 */}
        <section className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="panel-title">数据管理</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-base btn-primary text-xs"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download size={13} />
              导出JSON
            </button>
            <button
              className="btn-base btn-secondary text-xs"
              onClick={handleImport}
              disabled={isExporting}
            >
              <Upload size={13} />
              导入JSON
            </button>
          </div>
        </section>
      </div>

      {/* 展品库弹窗 */}
      {showExhibitPicker && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowExhibitPicker(false)}
        >
          <div
            className="panel-card w-[92%] max-h-[75vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="font-display text-base">素材库 · {exhibits.length}件</div>
              <button
                className="btn-base btn-ghost !p-2"
                onClick={() => setShowExhibitPicker(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <input
                placeholder="搜索展品名称或分类..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: TEXT_PRIMARY,
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3">
              {filteredExhibits.map((e) => (
                <button
                  key={e.id}
                  className="group text-left rounded-lg overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  onClick={() => handleAddExhibitFromLibrary(e.url, e.name)}
                >
                  <div
                    className="w-full aspect-square bg-center bg-cover group-hover:scale-105 transition-transform"
                    style={{ backgroundImage: `url(${e.thumbnail})` }}
                  />
                  <div className="px-2 py-2">
                    <div className="text-xs font-medium truncate" style={{ color: TEXT_PRIMARY }}>
                      {e.name}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {e.category}
                    </div>
                  </div>
                </button>
              ))}
              {filteredExhibits.length === 0 && (
                <div className="col-span-3 text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  未找到匹配展品
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* URL输入弹窗 */}
      {showUrlInput && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowUrlInput(false)}
        >
          <div
            className="panel-card w-[90%] max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-lg">通过URL添加展品</div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                图片URL
              </label>
              <input
                autoFocus
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: TEXT_PRIMARY,
                }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                展品名称
              </label>
              <input
                ref={urlNameInputRef}
                defaultValue="自定义展品"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: TEXT_PRIMARY,
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-base btn-ghost" onClick={() => setShowUrlInput(false)}>
                取消
              </button>
              <button className="btn-base btn-primary" onClick={handleAddExhibitFromUrl}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
