import { useEffect, useState, useRef } from 'react';
import { X, Tag, AlignLeft, FileText, Hash } from 'lucide-react';
import { marked } from 'marked';
import { useNodeStore } from '@/stores/NodeStore';
import type { NodeCreationPayload } from '@/types';

export default function NodeModal() {
  const open = useNodeStore((s) => s.nodeModalOpen);
  const editingNode = useNodeStore((s) => s.editingNode);
  const close = useNodeStore((s) => s.closeNodeModal);
  const addNode = useNodeStore((s) => s.addNode);
  const updateNode = useNodeStore((s) => s.updateNode);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(editingNode?.title || '');
      setSummary(editingNode?.summary || '');
      setTagsText(editingNode ? editingNode.tags.join(', ') : '');
      setContent(editingNode?.content || '');
      setProgress(editingNode?.progress ?? 0);
      setErrors({});
      setShowPreview(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, editingNode]);

  if (!open) return null;

  const parseTags = () =>
    tagsText
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!title.trim()) e.title = '请输入标题';
    if (summary.length > 200) e.summary = '摘要不能超过 200 字';
    const tags = parseTags();
    if (tags.length > 3) e.tags = '最多只能输入 3 个标签';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: NodeCreationPayload = {
      title: title.trim(),
      summary: summary.trim(),
      tags: parseTags(),
      content,
    };
    if (editingNode) {
      updateNode(editingNode.id, { ...payload, progress });
    } else {
      addNode(payload);
    }
    close();
  };

  const tags = parseTags();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(44,62,80,0.35)' }}
      onClick={close}
    >
      <div
        className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          maxWidth: 760,
          maxHeight: '88vh',
          animation: 'nodeModalIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(44,62,80,0.08)', background: '#fafbfc' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#2c3e50' }}>
              {editingNode ? '编辑知识节点' : '新建知识节点'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#7b8a9a' }}>
              结构化记录零散知识，构建个人知识网络
            </p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg transition-all hover:bg-slate-100 hover:rotate-90"
            style={{ color: '#5a6c7d' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(88vh - 140px)' }}>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: '#2c3e50' }}>
              <Hash size={14} style={{ color: '#4a9eff' }} /> 标题 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：React Hooks 原理剖析"
              className={`focus-input w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all`}
              style={{
                borderColor: errors.title ? '#e74c3c' : 'rgba(44,62,80,0.12)',
                background: '#fff',
              }}
            />
            {errors.title && <p className="text-xs mt-1" style={{ color: '#e74c3c' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: '#2c3e50' }}>
              <AlignLeft size={14} style={{ color: '#4a9eff' }} /> 摘要
              <span className="ml-auto text-xs font-normal" style={{ color: summary.length > 200 ? '#e74c3c' : '#95a5b4' }}>
                {summary.length}/200
              </span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 210))}
              rows={2}
              placeholder="用 1~2 句话概括核心知识点..."
              className="focus-input w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none"
              style={{
                borderColor: errors.summary ? '#e74c3c' : 'rgba(44,62,80,0.12)',
                background: '#fff',
              }}
            />
            {errors.summary && <p className="text-xs mt-1" style={{ color: '#e74c3c' }}>{errors.summary}</p>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: '#2c3e50' }}>
              <Tag size={14} style={{ color: '#4a9eff' }} /> 标签
              <span className="ml-auto text-xs font-normal" style={{ color: '#95a5b4' }}>
                最多 3 个，用逗号或空格分隔（已选 {tags.length}/3）
              </span>
            </label>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="例如：前端, React, 源码"
              className="focus-input w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: errors.tags ? '#e74c3c' : 'rgba(44,62,80,0.12)',
                background: '#fff',
              }}
            />
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(74,158,255,0.18)', color: '#2c6bd9', fontWeight: 500 }}
                >
                  #{t}
                </span>
              ))}
            </div>
            {errors.tags && <p className="text-xs mt-1" style={{ color: '#e74c3c' }}>{errors.tags}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#2c3e50' }}>
                <FileText size={14} style={{ color: '#4a9eff' }} /> 知识点正文（Markdown）
              </label>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={!showPreview ? { background: '#fff', color: '#2c3e50', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#7b8a9a' }}
                >
                  编辑
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={showPreview ? { background: '#fff', color: '#2c3e50', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#7b8a9a' }}
                >
                  预览
                </button>
              </div>
            </div>
            {!showPreview ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="# 一级标题&#10;&#10;- 使用 Markdown 记录正文&#10;- 支持列表、代码块等&#10;&#10;```ts&#10;const x = 1;&#10;```"
                className="focus-input w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all resize-none font-mono"
                style={{
                  borderColor: 'rgba(44,62,80,0.12)',
                  background: '#fafbfc',
                  fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                  lineHeight: 1.65,
                }}
              />
            ) : (
              <div
                className="w-full px-4 py-3 rounded-xl border text-sm markdown-preview overflow-auto"
                style={{
                  borderColor: 'rgba(44,62,80,0.12)',
                  background: '#fff',
                  minHeight: 180,
                  maxHeight: 320,
                  color: '#2c3e50',
                }}
                dangerouslySetInnerHTML={{ __html: content ? marked.parse(content) as string : '<em style="color:#95a5b4">（暂无内容）</em>' }}
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold" style={{ color: '#2c3e50' }}>学习进度：{progress}%</label>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full accent-[#4a9eff]"
            />
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'rgba(44,62,80,0.08)', background: '#fafbfc' }}
        >
          <button
            onClick={close}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all hover:bg-slate-100"
            style={{ color: '#5a6c7d' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: '#4a9eff', boxShadow: '0 4px 14px rgba(74,158,255,0.4)' }}
          >
            {editingNode ? '保存修改' : '创建节点'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes nodeModalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .focus-input:focus {
          transform: scale(1.008);
          box-shadow: 0 0 0 4px rgba(74,158,255,0.22), 0 0 0 1px #4a9eff;
          border-color: #4a9eff !important;
        }
        .markdown-preview h1 { font-size: 1.4em; font-weight: 700; margin: 0.6em 0 0.4em; padding-bottom: 0.3em; border-bottom: 1px solid rgba(44,62,80,0.1); }
        .markdown-preview h2 { font-size: 1.25em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .markdown-preview h3 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }
        .markdown-preview p { margin: 0.5em 0; line-height: 1.75; }
        .markdown-preview ul, .markdown-preview ol { padding-left: 1.6em; margin: 0.4em 0; }
        .markdown-preview li { line-height: 1.75; }
        .markdown-preview code { background: rgba(74,158,255,0.12); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; font-family: "JetBrains Mono", Consolas, monospace; }
        .markdown-preview pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 10px; overflow-x: auto; margin: 0.6em 0; }
        .markdown-preview pre code { background: transparent; color: inherit; padding: 0; }
        .markdown-preview blockquote { border-left: 3px solid #4a9eff; padding: 0.2em 1em; color: #5a6c7d; background: rgba(74,158,255,0.06); border-radius: 0 8px 8px 0; margin: 0.5em 0; }
        .markdown-preview a { color: #4a9eff; text-decoration: underline; }
        .markdown-preview table { border-collapse: collapse; margin: 0.5em 0; width: 100%; }
        .markdown-preview th, .markdown-preview td { border: 1px solid rgba(44,62,80,0.12); padding: 0.4em 0.8em; }
        .markdown-preview th { background: rgba(74,158,255,0.08); }
        input[type=range] { -webkit-appearance: none; height: 6px; background: rgba(74,158,255,0.2); border-radius: 99px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #4a9eff; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 8px rgba(74,158,255,0.5); border: 3px solid #fff; }
      `}</style>
    </div>
  );
}
