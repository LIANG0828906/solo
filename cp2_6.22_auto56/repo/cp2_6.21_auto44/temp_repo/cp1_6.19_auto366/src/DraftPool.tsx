import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Draft } from './types';
import { useCalendarStore } from './store';
import { draftsApi } from './api';

const PLATFORMS = ['微博', '小红书', '抖音', '微信公众号'];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

export default function DraftPool() {
  const drafts = useCalendarStore((s) => s.drafts);
  const addDraft = useCalendarStore((s) => s.addDraft);
  const updateDraft = useCalendarStore((s) => s.updateDraft);
  const removeDraft = useCalendarStore((s) => s.removeDraft);
  const draggingDraft = useCalendarStore((s) => s.draggingDraft);
  const setDraggingDraft = useCalendarStore((s) => s.setDraggingDraft);
  const addToast = useCalendarStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [batchText, setBatchText] = useState('');
  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    platform: '微博'
  });

  const resetForm = () => {
    setForm({ title: '', body: '', imageUrl: '', platform: '微博' });
    setEditingDraft(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      addToast('error', '请填写标题和正文');
      return;
    }
    try {
      if (editingDraft) {
        const updated = await draftsApi.update(editingDraft.id, form);
        updateDraft(updated);
        addToast('success', '草稿已更新');
      } else {
        const created = await draftsApi.create(form);
        addDraft(created);
        addToast('success', '草稿已创建');
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      addToast('error', '操作失败');
    }
  };

  const handleBatchImport = async () => {
    try {
      const data = JSON.parse(batchText);
      const result = await draftsApi.batchImport(data);
      result.drafts.forEach((d) => addDraft(d));
      addToast('success', `成功导入 ${result.imported} 条草稿`);
      setShowBatch(false);
      setBatchText('');
    } catch (e) {
      addToast('error', 'JSON 格式错误');
    }
  };

  const handleDelete = async (id: string) => {
    await draftsApi.remove(id);
    removeDraft(id);
    addToast('info', '草稿已删除');
  };

  const handleDragStart = (draft: Draft, e: any) => {
    setDraggingDraft(draft);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draft.id);
    }
  };

  return (
    <div className="draft-pool">
      <div style={poolHeaderStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>草稿池</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={btnStyle('#667eea')}>
            + 新建
          </button>
          <button onClick={() => setShowBatch(true)} style={btnStyle('#2a2a3e')}>
            批量导入
          </button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}
      >
        {drafts.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
            暂无草稿，点击"新建"开始
          </div>
        ) : (
          drafts.map((draft, idx) => (
            <motion.div
              key={draft.id}
              variants={itemVariants}
              draggable
              onDragStart={(e) => handleDragStart(draft, e)}
              onDragEnd={() => setDraggingDraft(null)}
              onClick={() => {
                setEditingDraft(draft);
                setForm({
                  title: draft.title,
                  body: draft.body,
                  imageUrl: draft.imageUrl || '',
                  platform: draft.platform
                });
                setShowForm(true);
              }}
              className="draft-card"
              style={cardStyle}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={draggingDraft?.id === draft.id ? { opacity: 0.7 } : { opacity: 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={tagStyle(draft.platform)}>
                  {draft.platform}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(draft.id); }}
                  style={{ background: 'transparent', color: '#888', fontSize: 12, padding: '2px 6px' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#fff' }}>
                {draft.title}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {draft.body}
              </div>
              {draft.imageUrl && (
                <div style={{ fontSize: 11, color: '#667eea', marginTop: 8 }}>
                  📷 含图片
                </div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>

      <AnimatePresence>
        {(showForm || showBatch) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={modalOverlayStyle}
            onClick={() => { setShowForm(false); setShowBatch(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              style={modalContentStyle}
            >
              {showForm ? (
                <>
                  <h3 style={{ fontSize: 16, marginBottom: 16 }}>
                    {editingDraft ? '编辑草稿' : '新建草稿'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      placeholder="标题"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <textarea
                      placeholder="正文内容"
                      rows={4}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />
                    <input
                      placeholder="图片链接 (可选)"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                    <select
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowForm(false); resetForm(); }} style={btnStyle('#2a2a3e')}>
                      取消
                    </button>
                    <button onClick={handleSubmit} style={btnStyle('#667eea')}>
                      保存
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 16, marginBottom: 16 }}>批量导入草稿</h3>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                    粘贴 JSON 数组，每项包含 title、body、platform 字段
                  </div>
                  <textarea
                    rows={10}
                    placeholder='[{"title":"...","body":"...","platform":"微博"}]'
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowBatch(false)} style={btnStyle('#2a2a3e')}>
                      取消
                    </button>
                    <button onClick={handleBatchImport} style={btnStyle('#667eea')}>
                      导入
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const poolHeaderStyle: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #2a2a3e'
};

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: '8px 14px',
  backgroundColor: bg,
  color: '#fff',
  fontSize: 13,
  fontWeight: 500
});

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1e1e2f',
  borderRadius: 12,
  padding: 14,
  margin: '8px auto',
  cursor: 'grab',
  userSelect: 'none',
  transition: 'all 0.3s ease-in-out'
};

const tagStyle = (platform: string): React.CSSProperties => {
  const colors: Record<string, string> = {
    '微博': '#e6162d',
    '小红书': '#fe2c55',
    '抖音': '#000000',
    '微信公众号': '#07c160'
  };
  return {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: colors[platform] || '#667eea',
    color: '#fff',
    fontSize: 11,
    borderRadius: 4,
    fontWeight: 500
  };
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#00000066',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1e1e2f',
  borderRadius: 12,
  padding: 24,
  width: 460,
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto'
};
