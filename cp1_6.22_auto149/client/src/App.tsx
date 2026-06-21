import React, { useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import html2canvas from 'html2canvas';
import GraphView, { NoteSummary, TagFrequency } from './GraphView';
import TagPanel from './TagPanel';

interface ScanResponse {
  notes: NoteSummary[];
  tags: TagFrequency[];
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [tags, setTags] = useState<TagFrequency[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buttonAnim, setButtonAnim] = useState<'rescan' | 'export' | null>(null);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scanFolder = useCallback(async (path: string) => {
    if (!path) return;
    setLoading(true);
    setError('');
    try {
      const resp = await axios.post<ScanResponse>('/api/scan', { folderPath: path });
      setNotes(resp.data.notes);
      setTags(resp.data.tags);
      setSelectedTag(null);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || '扫描失败';
      setError(msg);
      setNotes([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const firstFile = files[0] as any;
    const path = firstFile.webkitRelativePath || firstFile.name;
    const parts = path.split('/');
    const folderName = parts.length > 1 ? parts[0] : '';

    const fileEntry = firstFile as any;
    let absolutePath = '';

    if (fileEntry.path) {
      const p = fileEntry.path;
      const idx = p.lastIndexOf(folderName);
      absolutePath = idx >= 0 ? p.slice(0, idx + folderName.length) : p;
    } else if (folderName) {
      absolutePath = folderName;
    } else {
      setError('无法获取文件夹路径，请直接输入路径');
      return;
    }

    setFolderPath(absolutePath);
    setFolderName(folderName || absolutePath);
    setMobileMenuOpen(false);
    scanFolder(absolutePath);

    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePathInput = () => {
    const input = window.prompt('请输入本地文件夹绝对路径：', folderPath);
    if (input !== null && input.trim()) {
      const trimmed = input.trim();
      setFolderPath(trimmed);
      setFolderName(trimmed.split(/[\\/]/).pop() || trimmed);
      setMobileMenuOpen(false);
      scanFolder(trimmed);
    }
  };

  const handleRescan = () => {
    setButtonAnim('rescan');
    setTimeout(() => setButtonAnim(null), 150);
    if (folderPath) scanFolder(folderPath);
  };

  const handleExport = async () => {
    setButtonAnim('export');
    setTimeout(() => setButtonAnim(null), 150);

    const container = graphContainerRef.current;
    if (!container) return;

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `note-tag-graph-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      setError('导出失败，请重试');
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes bounce-click {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.92); }
          70%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .bounce-anim {
          animation: bounce-click 0.15s ease-out;
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .graph-area { margin-left: 0 !important; }
        }
        @media (min-width: 768px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          height: 56,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(30, 27, 75, 0.2)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🕸️</span>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            笔记标签图谱
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className={buttonAnim === 'rescan' ? 'bounce-anim' : ''}
            disabled={!folderPath || loading}
            onClick={handleRescan}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              backgroundColor: folderPath && !loading ? '#A78BFA' : '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: folderPath && !loading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (folderPath && !loading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              if (folderPath && !loading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#A78BFA';
            }}
          >
            {loading ? '扫描中…' : '🔄 重新扫描'}
          </button>
          <button
            className={buttonAnim === 'export' ? 'bounce-anim' : ''}
            disabled={notes.length === 0}
            onClick={handleExport}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              backgroundColor: notes.length > 0 ? '#6366F1' : '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: notes.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (notes.length > 0)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5';
            }}
            onMouseLeave={(e) => {
              if (notes.length > 0)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366F1';
            }}
          >
            📷 导出图谱
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Desktop sidebar */}
        <div
          className="sidebar-desktop"
          style={{
            width: 300,
            backgroundColor: '#F1F5F9',
            borderRight: '1px solid #E2E8F0',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <SidebarContent
            folderName={folderName}
            folderPath={folderPath}
            notes={notes}
            tags={tags}
            loading={loading}
            error={error}
            inputRef={inputRef}
            onFolderSelect={handleFolderSelect}
            onPathInput={handlePathInput}
          />
        </div>

        {/* Mobile sidebar dropdown */}
        <div
          className="sidebar-mobile"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: '#F1F5F9',
            borderBottom: mobileMenuOpen ? '1px solid #E2E8F0' : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '10px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>📁 {folderName || '选择文件夹'}</span>
            <span>{mobileMenuOpen ? '▲' : '▼'}</span>
          </button>
          {mobileMenuOpen && (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <SidebarContent
                folderName={folderName}
                folderPath={folderPath}
                notes={notes}
                tags={tags}
                loading={loading}
                error={error}
                inputRef={inputRef}
                onFolderSelect={handleFolderSelect}
                onPathInput={handlePathInput}
                compact
              />
            </div>
          )}
        </div>

        {/* Graph area */}
        <div
          ref={graphContainerRef}
          className="graph-area"
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 200 }}>
            <GraphView notes={notes} tags={tags} selectedTag={selectedTag} />
          </div>
          <TagPanel tags={tags} selectedTag={selectedTag} onTagSelect={setSelectedTag} />
        </div>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  folderName: string;
  folderPath: string;
  notes: NoteSummary[];
  tags: TagFrequency[];
  loading: boolean;
  error: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onFolderSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPathInput: () => void;
  compact?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  folderName,
  folderPath,
  notes,
  tags,
  loading,
  error,
  inputRef,
  onFolderSelect,
  onPathInput,
  compact,
}) => {
  const pad = compact ? '12px' : '20px';
  return (
    <>
      <div style={{ padding: pad, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: '#1E293B', marginBottom: 12 }}>
          📂 文件夹选择
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: compact ? '8px 12px' : '10px 16px',
              backgroundColor: '#312E81',
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: compact ? 12 : 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.backgroundColor = '#4338CA';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.backgroundColor = '#312E81';
            }}
          >
            📁 选择文件夹
            <input
              ref={inputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={onFolderSelect}
            />
          </label>
          <button
            onClick={onPathInput}
            style={{
              padding: compact ? '8px 12px' : '10px 16px',
              backgroundColor: '#FFFFFF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
              borderRadius: 8,
              fontSize: compact ? 12 : 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EEF2FF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            ⌨️ 手动输入路径
          </button>
        </div>

        {folderName && (
          <div style={{ marginTop: 12, padding: 10, backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>当前文件夹</div>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#1E293B', wordBreak: 'break-all' }}>
              {folderName}
            </div>
            {!compact && folderPath && folderPath !== folderName && (
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, wordBreak: 'break-all' }}>
                {folderPath}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              borderRadius: 6,
              fontSize: 12,
              border: '1px solid #FECACA',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
            正在扫描文件夹…
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 12 }}>
            📋 扫描概览
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                padding: 12,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 12, color: '#64748B' }}>📝 笔记数量</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6366F1' }}>{notes.length}</div>
            </div>
            <div
              style={{
                padding: 12,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 12, color: '#64748B' }}>🏷️ 标签数量</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>{tags.length}</div>
            </div>
          </div>

          {notes.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 10 }}>
                📑 笔记列表
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {notes.slice(0, 30).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      fontSize: 12,
                    }}
                    title={n.fileName}
                  >
                    <div style={{ fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                      {n.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                      {n.tags.length > 3 ? ` +${n.tags.length - 3}` : ''}
                    </div>
                  </div>
                ))}
                {notes.length > 30 && (
                  <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: 6 }}>
                    …另有 {notes.length - 30} 篇笔记
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
