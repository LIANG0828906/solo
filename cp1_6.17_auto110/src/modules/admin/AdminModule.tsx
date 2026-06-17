import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, X, ArrowUpDown } from 'lucide-react';
import { useStore } from '@/store';
import type { Record, Track } from '@/store';

const GENRES = ['摇滚', '爵士', '电子', '古典', '嘻哈', '灵魂乐'];

interface FormData {
  coverUrl: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  price: number;
  stock: number;
  tracksText: string;
}

const emptyForm: FormData = {
  coverUrl: '',
  title: '',
  artist: '',
  year: 2024,
  genre: '摇滚',
  price: 0,
  stock: 0,
  tracksText: '',
};

type SortField = 'price' | 'stock' | null;
type SortOrder = 'asc' | 'desc';

export default function AdminModule() {
  const navigate = useNavigate();
  const records = useStore((s) => s.records);
  const loading = useStore((s) => s.loading);
  const fetchRecords = useStore((s) => s.fetchRecords);
  const setError = useStore((s) => s.setError);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortField) return 0;
    const diff = a[sortField] - b[sortField];
    return sortOrder === 'asc' ? diff : -diff;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const parseTracks = (text: string): Track[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const match = line.match(/^(\d+)[.\s、]+(.+)$/);
        if (match) {
          return { number: parseInt(match[1], 10), title: match[2].trim() };
        }
        return { number: idx + 1, title: line };
      });
  };

  const tracksToText = (tracks: Track[]) => {
    return tracks.map((t) => `${t.number}. ${t.title}`).join('\n');
  };

  const openAddForm = () => {
    setEditingRecord(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (record: Record) => {
    setEditingRecord(record);
    setFormData({
      coverUrl: record.coverUrl,
      title: record.title,
      artist: record.artist,
      year: record.year,
      genre: record.genre,
      price: record.price,
      stock: record.stock,
      tracksText: tracksToText(record.tracks),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.artist.trim()) {
      showToast('请填写必填字段', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const tracks = parseTracks(formData.tracksText);
      const payload = {
        coverUrl: formData.coverUrl,
        title: formData.title,
        artist: formData.artist,
        year: Number(formData.year),
        genre: formData.genre,
        price: Number(formData.price),
        stock: Number(formData.stock),
        tracks,
      };

      const res = editingRecord
        ? await fetch(`/api/records/${editingRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '操作失败');
      }

      showToast(editingRecord ? '更新成功' : '添加成功', 'success');
      setShowForm(false);
      await fetchRecords();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '操作失败', 'error');
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/records/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      showToast('删除成功', 'success');
      setDeletingId(null);
      await fetchRecords();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>黑胶唱片店</div>
        <div className="navbar-right">
          <span className="navbar-link" onClick={() => navigate('/')}>返回前台</span>
        </div>
      </nav>

      <div className="admin-page">
        <div className="page-container">
          <div className="admin-card">
            <div className="admin-header">
              <h1>唱片管理</h1>
              <button className="btn-add" onClick={openAddForm}>
                <Plus size={16} /> 添加唱片
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">加载中...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>封面</th>
                    <th>专辑名</th>
                    <th>艺术家</th>
                    <th className="sortable" onClick={() => toggleSort('price')}>
                      价格
                      <span className="sort-arrow">
                        {sortField === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </th>
                    <th className="sortable" onClick={() => toggleSort('stock')}>
                      库存
                      <span className="sort-arrow">
                        {sortField === 'stock' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <img className="admin-thumb" src={record.coverUrl} alt={record.title} />
                      </td>
                      <td>{record.title}</td>
                      <td>{record.artist}</td>
                      <td>¥{record.price.toFixed(2)}</td>
                      <td>{record.stock}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="btn-edit" onClick={() => openEditForm(record)} title="编辑">
                            <Pencil size={16} />
                          </button>
                          <button className="btn-delete" onClick={() => setDeletingId(record.id)} title="删除">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${showForm ? 'open' : ''}`} onClick={() => !submitting && setShowForm(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{editingRecord ? '编辑唱片' : '添加唱片'}</h2>
            <button className="cart-close" onClick={() => setShowForm(false)} disabled={submitting}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>封面图片URL</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="粘贴图片链接"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>专辑名<span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>艺术家<span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>发行年份</label>
                <input
                  className="form-input"
                  type="number"
                  min={1900}
                  max={2025}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>流派</label>
                <select
                  className="form-select"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>价格<span className="required">*</span></label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>库存数量<span className="required">*</span></label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>曲目列表（每行一首，格式：序号.曲名）</label>
                <textarea
                  className="form-textarea"
                  value={formData.tracksText}
                  onChange={(e) => setFormData({ ...formData, tracksText: e.target.value })}
                  placeholder="1. 曲名一\n2. 曲名二"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={submitting}>
                取消
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? '提交中...' : (editingRecord ? '保存修改' : '添加')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`modal-overlay ${deletingId ? 'open' : ''}`} onClick={() => setDeletingId(null)}>
        <div className="modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>确认删除</h2>
          </div>
          <div className="modal-body">
            <p className="confirm-text">确定删除该唱片吗？此操作不可撤销。</p>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={() => setDeletingId(null)}>取消</button>
            <button className="btn-confirm" onClick={handleDelete}>确认删除</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
