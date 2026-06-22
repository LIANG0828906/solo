import React, { useState, useRef, useEffect } from 'react';
import { useResourceContext, type Resource } from '../../context/ResourceContext';
import { fetchContent, createResource, parseBookmarkHTML, type FetchResult } from './FetchService';

const tagStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '4px 10px', borderRadius: '8px',
  background: '#334155', color: '#E2E8F0',
  border: '2px dashed #475569', fontSize: '12px',
  cursor: 'pointer', userSelect: 'none',
  transition: 'background 0.2s, border-color 0.2s'
};

const tagHover = {
  background: '#475569',
  borderColor: '#3B82F6'
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '10px 16px',
  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  color: 'white', border: 'none', borderRadius: '10px',
  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
};

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '9px 14px',
  background: 'transparent', color: '#E2E8F0',
  border: '1px solid #475569', borderRadius: '10px',
  fontSize: '13px', cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: '#0F172A', color: '#E2E8F0',
  border: '1px solid #334155', borderRadius: '10px',
  fontSize: '13px', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

export default function ResourceManager() {
  const { addResource, toast, importResources, setImportProgress, importProgress } = useResourceContext();

  const [urlInput, setUrlInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const [preview, setPreview] = useState<FetchResult | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (u: string) => {
    try { const x = new URL(u.trim()); return x.protocol === 'http:' || x.protocol === 'https:'; }
    catch { return false; }
  };

  const handleFetch = async () => {
    const url = urlInput.trim();
    if (!validateUrl(url)) {
      toast('error', '请输入有效的 http/https URL');
      setShakeKey(k => k + 1);
      return;
    }
    setFetching(true);
    setPreview(null);
    setEditingTags([]);
    const res = await fetchContent(url);
    setFetching(false);
    if (res.ok && res.data) {
      setPreview(res.data);
      setEditingTags([...res.data.tags]);
    } else {
      toast('error', res.error || '抓取失败');
    }
  };

  const handleAdd = async () => {
    if (!preview) return;
    if (editingTags.length === 0) {
      toast('error', '请至少添加一个标签');
      return;
    }
    setSaving(true);
    const data = {
      url: preview.url,
      domain: preview.domain,
      favicon: preview.favicon,
      title: preview.title,
      description: preview.description,
      summary: preview.summary,
      tags: editingTags.filter(Boolean)
    };
    const res = await createResource(data);
    setSaving(false);
    if (res.ok && res.data) {
      addResource(res.data);
      toast('success', `已添加：${res.data.title.slice(0, 30)}${res.data.title.length > 30 ? '...' : ''}`);
      resetForm();
    } else {
      toast('error', res.error || '保存失败');
    }
  };

  const resetForm = () => {
    setUrlInput(''); setPreview(null); setEditingTags([]); setNewTagInput('');
  };

  const addTag = () => {
    const v = newTagInput.trim();
    if (!v) return;
    if (editingTags.some(t => t.toLowerCase() === v.toLowerCase())) {
      toast('info', '标签已存在');
      return;
    }
    setEditingTags([...editingTags, v]);
    setNewTagInput('');
  };

  const removeTag = (idx: number) => {
    setEditingTags(editingTags.filter((_, i) => i !== idx));
  };

  const startEditTag = (idx: number) => {
    setEditingTagIdx(idx);
    setEditingTagValue(editingTags[idx]);
  };

  const confirmEditTag = () => {
    if (editingTagIdx === null) return;
    const v = editingTagValue.trim();
    if (v) {
      const next = [...editingTags];
      next[editingTagIdx] = v;
      setEditingTags(next);
    }
    setEditingTagIdx(null); setEditingTagValue('');
  };

  const handleImportFile = async (file: File) => {
    const html = await file.text();
    const links = parseBookmarkHTML(html);
    if (links.length === 0) {
      toast('error', '未解析到有效书签链接');
      return;
    }
    const total = Math.min(links.length, 200);
    const toProcess = links.slice(0, total);
    setImportProgress({ current: 0, total, percentage: 0 });
    toast('info', `开始导入 ${total} 条书签...`);

    const results: Resource[] = [];
    const concurrency = 3;
    let cursor = 0;

    const worker = async () => {
      while (cursor < toProcess.length) {
        const i = cursor++;
        const link = toProcess[i];
        try {
          const fr = await fetchContent(link.url);
          if (fr.ok && fr.data) {
            const res = await createResource({
              url: fr.data.url,
              domain: fr.data.domain,
              favicon: fr.data.favicon,
              title: fr.data.title || link.title,
              description: fr.data.description,
              summary: fr.data.summary,
              tags: fr.data.tags
            });
            if (res.ok && res.data) results.push(res.data);
          }
        } catch {}
        setImportProgress({ current: i + 1, total });
      }
    };

    await Promise.all([...Array(concurrency)].map(() => worker()));

    if (results.length > 0) importResources(results);
    setImportProgress({ current: 0, total: 0, percentage: 0 });
    toast('success', `书签导入完成：成功 ${results.length} / ${total} 条`);
  };

  return (
    <div style={{
      background: '#1E293B', borderRadius: '16px',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '18px',
      height: 'calc(100vh - 32px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
    }}>
      <Header />

      <div key={shakeKey} className={shakeKey > 0 ? 'shake-error' : ''}>
        <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', display: 'block' }}>
          添加网络资源
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            style={inputStyle}
            placeholder="粘贴 https:// 链接..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !fetching && handleFetch()}
            onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={handleFetch}
            disabled={fetching || !urlInput.trim()}
            style={{
              padding: '0 16px', borderRadius: '10px',
              background: '#3B82F6', color: 'white', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {fetching ? '抓取中...' : '抓取'}
          </button>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', display: 'block' }}>
          批量导入书签
        </label>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importProgress.total > 0}
          style={{ ...secondaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>📚</span> 导入浏览器书签 HTML
        </button>
        <input
          ref={fileInputRef}
          type="file" accept=".html,.htm"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {preview && (
        <PreviewSection
          preview={preview} fetching={fetching}
          editingTags={editingTags} editingTagIdx={editingTagIdx} editingTagValue={editingTagValue}
          startEditTag={startEditTag} confirmEditTag={confirmEditTag} setEditingTagValue={setEditingTagValue}
          removeTag={removeTag} newTagInput={newTagInput} setNewTagInput={setNewTagInput}
          addTag={addTag} saving={saving} handleAdd={handleAdd} resetForm={resetForm}
        />
      )}

      {!preview && !fetching && <EmptyHint />}
      {fetching && !preview && <FetchingSkeleton />}

      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #334155' }}>
        <StatsLine />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
        }}>📖</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>资源管理</div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>Resource Manager</div>
        </div>
      </div>
    </div>
  );
}

interface PreviewProps {
  preview: FetchResult;
  fetching: boolean;
  editingTags: string[];
  editingTagIdx: number | null;
  editingTagValue: string;
  startEditTag: (i: number) => void;
  confirmEditTag: () => void;
  setEditingTagValue: (v: string) => void;
  removeTag: (i: number) => void;
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  addTag: () => void;
  saving: boolean;
  handleAdd: () => void;
  resetForm: () => void;
}

function PreviewSection(p: PreviewProps) {
  return (
    <div style={{
      background: '#0F172A', borderRadius: '12px',
      padding: '14px', border: '1px solid #334155',
      display: 'flex', flexDirection: 'column', gap: '12px',
      animation: 'card-fade-in 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <img src={p.preview.favicon} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, marginTop: '2px', background: '#334155' }} onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', lineHeight: 1.4, marginBottom: '4px' }}>
            {p.preview.title}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', wordBreak: 'break-all' }}>{p.preview.domain || p.preview.url}</div>
        </div>
      </div>

      {p.preview.summary && (
        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6, maxHeight: '72px', overflow: 'hidden', position: 'relative' }}>
          {p.preview.summary}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            推荐标签 ({p.editingTags.length})
          </div>
          <div style={{ fontSize: '10px', color: '#475569' }}>点击 ✎ 编辑 · × 删除</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {p.editingTags.map((tag, i) => (
            <div
              key={i}
              style={tagStyle}
              onMouseEnter={e => { Object.assign(e.currentTarget.style, tagHover); }}
              onMouseLeave={e => {
                e.currentTarget.style.background = tagStyle.background as string;
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              {p.editingTagIdx === i ? (
                <input
                  autoFocus value={p.editingTagValue}
                  onChange={e => p.setEditingTagValue(e.target.value)}
                  onBlur={p.confirmEditTag}
                  onKeyDown={e => { if (e.key === 'Enter') p.confirmEditTag(); if (e.key === 'Escape') { p.setEditingTagValue(''); p.confirmEditTag(); } }}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#E2E8F0', fontSize: '12px', width: `${Math.max(40, p.editingTagValue.length * 8)}px`,
                    padding: 0
                  }}
                />
              ) : (
                <span>{tag}</span>
              )}
              {p.editingTagIdx !== i && (
                <>
                  <span onClick={(e) => { e.stopPropagation(); p.startEditTag(i); }} style={{ fontSize: '10px', opacity: 0.6 }}>✎</span>
                  <span onClick={(e) => { e.stopPropagation(); p.removeTag(i); }} style={{ fontSize: '11px', opacity: 0.7 }}>×</span>
                </>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              placeholder="+ 添加标签"
              value={p.newTagInput}
              onChange={e => p.setNewTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && p.addTag()}
              style={{
                padding: '4px 10px', borderRadius: '8px',
                background: 'transparent', color: '#E2E8F0',
                border: '2px dashed #334155', fontSize: '12px',
                outline: 'none', width: '100px'
              }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
            {p.newTagInput && (
              <button onClick={p.addTag} style={{
                padding: '0 10px', borderRadius: '8px',
                background: '#3B82F6', color: 'white', border: 'none',
                cursor: 'pointer', fontSize: '12px'
              }}>+</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button onClick={p.resetForm} style={{ ...secondaryBtn, flex: 1 }}>取消</button>
        <button onClick={p.handleAdd} disabled={p.saving} style={{ ...primaryBtn, flex: 2 }}>
          {p.saving ? '保存中...' : '✓ 确认保存'}
        </button>
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: '10px',
      padding: '30px 20px', color: '#64748B'
    }}>
      <div style={{ fontSize: '48px', opacity: 0.3 }}>🔍</div>
      <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
        粘贴任意网页链接<br/>自动抓取标题、摘要和智能标签<br/>构建你的个人知识库
      </div>
    </div>
  );
}

function FetchingSkeleton() {
  return (
    <div style={{
      background: '#0F172A', borderRadius: '12px',
      padding: '14px', border: '1px solid #334155',
      display: 'flex', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton" style={{ height: '16px', borderRadius: '4px', width: '80%' }} />
          <div className="skeleton" style={{ height: '12px', borderRadius: '4px', width: '50%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: '48px', borderRadius: '6px' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: '28px', width: `${50 + i * 10}px`, borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  );
}

function StatsLine() {
  const { resources, filterTags, toggleFilterTag } = useResourceContext();
  const allTags = new Map<string, number>();
  resources.forEach(r => r.tags.forEach(t => allTags.set(t, (allTags.get(t) || 0) + 1)));
  const topTags = [...allTags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>
        <span>已收录 <span style={{ color: '#3B82F6', fontWeight: 600 }}>{resources.length}</span> 条资源</span>
        <span>{allTags.size} 个标签</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>热门标签</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {topTags.map(([tag, count]) => (
          <span key={tag}
            onClick={() => toggleFilterTag(tag)}
            style={{
              ...tagStyle, fontSize: '10px', padding: '2px 8px', cursor: 'pointer',
              background: filterTags.includes(tag) ? '#475569' : tagStyle.background,
              borderColor: filterTags.includes(tag) ? '#3B82F6' : '#475569'
            }}>
            {tag} <span style={{ opacity: 0.5 }}>({count})</span>
          </span>
        ))}
        {topTags.length === 0 && <span style={{ fontSize: '11px', color: '#475569' }}>暂无数据</span>}
      </div>
    </div>
  );
}
