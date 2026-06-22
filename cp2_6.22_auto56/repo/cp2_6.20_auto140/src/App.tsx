import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { Button, Modal, App as AntdApp } from 'antd';
import EditorCanvas from './EditorCanvas';
import Preview from './Preview';
import { useEditorStore, getPageTitle } from './store';
import {
  exportMagazineJSON,
  importMagazineFromFile,
  generateCoverThumbnail,
  triggerDownload,
} from './utils';
import { CANVAS_WIDTH, TextElement, ImageElement, ShapeElement, Magazine } from './types';

const SAMPLE_IMG =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80';

const THUMB_SCALE = 44 / CANVAS_WIDTH;

export default function App() {
  const { message } = AntdApp.useApp();
  const {
    magazine,
    currentPageId,
    setMagazineName,
    setMagazineAuthor,
    addPage,
    deletePage,
    reorderPages,
    selectPage,
    setCoverPage,
    addTextElement,
    addImageElement,
    addShapeElement,
    setPreviewOpen,
    generateTocPage,
    importMagazine,
  } = useEditorStore();

  const sortedPages = useMemo(
    () => [...magazine.pages].sort((a, b) => a.order - b.order),
    [magazine.pages],
  );

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMG);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExport = async () => {
    try {
      exportMagazineJSON(magazine);
      const blob = await generateCoverThumbnail(magazine);
      const safeName = (magazine.name || 'magazine').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
      triggerDownload(blob, `${safeName}-cover.png`);
      message.success('已导出杂志 JSON 与封面缩略图');
    } catch (e) {
      message.error(`导出失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importMagazineFromFile(file);
      importMagazine(data as Magazine);
      message.success('导入成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddImage = () => {
    if (!currentPageId) return;
    if (imageUrl.trim()) {
      addImageElement(currentPageId, imageUrl.trim());
      message.success('已添加图片');
    }
    setImageModalOpen(false);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-root">
        <header className="topbar">
          <div className="meta">
            <input
              value={magazine.name}
              onChange={(e) => setMagazineName(e.target.value)}
              placeholder="杂志名称"
              maxLength={30}
            />
            <div className="divider" />
            <input
              value={magazine.author}
              onChange={(e) => setMagazineAuthor(e.target.value)}
              placeholder="作者名"
              maxLength={20}
            />
          </div>
          <div className="actions">
            <Button
              className="pill ghost"
              onClick={() => currentPageId && addTextElement(currentPageId)}
            >
              + 文字
            </Button>
            <Button
              className="pill ghost"
              onClick={() => {
                setImageUrl(SAMPLE_IMG);
                setImageModalOpen(true);
              }}
            >
              + 图片
            </Button>
            <Button
              className="pill ghost"
              onClick={() => currentPageId && addShapeElement(currentPageId)}
            >
              + 色块
            </Button>
            <Button className="pill ghost" onClick={generateTocPage}>
              生成目录
            </Button>
            <Button className="pill ghost" onClick={handleImportClick}>
              导入
            </Button>
            <Button className="pill ghost" onClick={handleExport}>
              导出
            </Button>
            <Button className="pill primary" onClick={() => setPreviewOpen(true)}>
              预览杂志
            </Button>
          </div>
          <input
            type="file"
            accept="application/json,.json"
            ref={importInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </header>

        <div className="main-layout">
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>页面管理 · {sortedPages.length}/12</h3>
              <Button
                size="small"
                type="primary"
                disabled={sortedPages.length >= 12}
                onClick={() => addPage()}
                style={{ borderRadius: 999 }}
              >
                + 新页
              </Button>
            </div>
            <div className="page-list">
              {sortedPages.map((p, i) => (
                <PageCard
                  key={p.id}
                  page={p}
                  index={i}
                  isSelected={p.id === currentPageId}
                  isCover={p.id === magazine.coverPageId}
                  onSelect={() => {
                    selectPage(p.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  onDelete={() => {
                    Modal.confirm({
                      title: '确认删除此页？',
                      content: '删除后不可撤销',
                      okText: '删除',
                      cancelText: '取消',
                      okButtonProps: { danger: true },
                      onOk: () => deletePage(p.id),
                    });
                  }}
                  onToggleCover={() =>
                    setCoverPage(magazine.coverPageId === p.id ? null : p.id)
                  }
                  onReorder={(from, to) => reorderPages(from, to)}
                />
              ))}
              {sortedPages.length === 0 && (
                <div style={{ color: 'rgba(44,62,80,0.5)', textAlign: 'center', padding: 40 }}>
                  还没有页面，点击右上角添加
                </div>
              )}
            </div>
            <div className="sidebar-footer">
              <Button
                block
                type="primary"
                disabled={sortedPages.length >= 12}
                onClick={() => addPage()}
              >
                + 添加页面 ({sortedPages.length}/12)
              </Button>
              <div style={{ fontSize: 11, color: 'rgba(44,62,80,0.45)', textAlign: 'center' }}>
                提示：拖拽卡片可调整页面顺序
              </div>
            </div>
          </aside>

          <EditorCanvas />
        </div>

        <button
          className="mobile-tray-toggle"
          onClick={() => setSidebarOpen((s) => !s)}
          title={sidebarOpen ? '收起页面' : '展开页面'}
        >
          {sidebarOpen ? '×' : '☰'}
        </button>

        <Modal
          title="添加图片"
          open={imageModalOpen}
          onCancel={() => setImageModalOpen(false)}
          onOk={handleAddImage}
          okText="添加到画布"
          cancelText="取消"
          centered
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'rgba(44,62,80,0.7)' }}>
                粘贴图片链接
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(44,62,80,0.15)',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'rgba(44,62,80,0.7)' }}>
                或从本地上传
              </div>
              <input type="file" accept="image/*" onChange={handleUploadImage} />
            </div>
            <div
              style={{
                marginTop: 6,
                border: '1px dashed rgba(44,62,80,0.15)',
                borderRadius: 10,
                padding: 12,
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(44,62,80,0.02)',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="预览"
                  style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span style={{ color: 'rgba(44,62,80,0.45)', fontSize: 12 }}>图片预览</span>
              )}
            </div>
          </div>
        </Modal>

        <Preview />
      </div>
    </DndProvider>
  );
}

const PAGE_DND_TYPE = 'MAGAZINE_PAGE_CARD';

interface PageCardProps {
  page: { id: string; order: number; elements: (TextElement | ImageElement | ShapeElement)[]; isToc?: boolean };
  index: number;
  isSelected: boolean;
  isCover: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleCover: () => void;
  onReorder: (from: number, to: number) => void;
}

function PageCard({
  page,
  index,
  isSelected,
  isCover,
  onSelect,
  onDelete,
  onToggleCover,
  onReorder,
}: PageCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: PAGE_DND_TYPE,
    item: { index, id: page.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: PAGE_DND_TYPE,
    drop: (item: { index: number }) => {
      if (item.index !== index) onReorder(item.index, index);
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  }));

  const ref = (node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
  };

  return (
    <>
      {isOver && <div className="drop-indicator" />}
      <div
        ref={ref}
        className={`page-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={onSelect}
      >
        <div className="page-number">{index + 1}</div>
        <div className="page-thumb">
          <Thumbnail page={page} />
          {isCover && <div className="mini-cover-mask">封面</div>}
        </div>
        <div className="page-info">
          <div className="page-title">{getPageTitle(page, index)}</div>
          <div className="page-meta">
            {page.elements.length} 个元素
            {page.isToc ? ' · 目录页' : ''}
            {isCover ? ' · 封面' : ''}
          </div>
        </div>
        <div className="page-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`page-btn cover ${isCover ? 'active' : ''}`}
            title={isCover ? '取消封面' : '设为封面'}
            onClick={onToggleCover}
          >
            ★
          </button>
          <button className="page-btn delete" title="删除页面" onClick={onDelete}>
            ×
          </button>
        </div>
      </div>
    </>
  );
}

function Thumbnail({
  page,
}: {
  page: { elements: (TextElement | ImageElement | ShapeElement)[] };
}) {
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
  const w = 44;
  const h = Math.round(w * 1.414);
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {sorted.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: el.x * THUMB_SCALE,
          top: el.y * THUMB_SCALE,
          width: el.width * THUMB_SCALE,
          height: el.height * THUMB_SCALE,
        };
        if (el.type === 'text') {
          const t = el as TextElement;
          return (
            <div
              key={el.id}
              style={{
                ...style,
                color: t.color,
                fontSize: Math.max(4, t.fontSize * THUMB_SCALE),
                fontFamily: t.fontFamily,
                fontWeight: 700,
                overflow: 'hidden',
                lineHeight: 1.1,
              }}
            >
              {t.content.slice(0, 8)}
            </div>
          );
        }
        if (el.type === 'shape') {
          const s = el as ShapeElement;
          return (
            <div
              key={el.id}
              style={{ ...style, background: s.fillColor, borderRadius: s.borderRadius * THUMB_SCALE }}
            />
          );
        }
        if (el.type === 'image') {
          const img = el as ImageElement;
          return (
            <div
              key={el.id}
              style={{
                ...style,
                background: `url(${img.src}) center/${img.fitMode === 'cover' ? 'cover' : 'contain'} no-repeat rgba(44,62,80,0.05)`,
              }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
