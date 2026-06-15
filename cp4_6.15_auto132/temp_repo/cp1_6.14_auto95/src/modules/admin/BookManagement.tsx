import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { getBooks, createBook, updateBook, deleteBook } from '../../api';
import { TableSkeleton } from '../../components/Skeleton';
import type { Book } from '../../types';

const CATEGORIES = ['文学', '科技', '历史', '艺术', '科幻'];

interface BookForm {
  title: string;
  author: string;
  category: string;
  isbn: string;
  description: string;
  cover: string;
  totalQuantity: number;
  availableQuantity: number;
}

const emptyForm: BookForm = {
  title: '', author: '', category: '文学', isbn: '',
  description: '', cover: '', totalQuantity: 1, availableQuantity: 1,
};

export default function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBooks = () => {
    setLoading(true);
    getBooks().then(setBooks).catch(() => setBooks([])).finally(() => setLoading(false));
  };

  useEffect(loadBooks, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setCoverPreview('');
    setShowForm(true);
  };

  const openEdit = (book: Book) => {
    setEditingId(book.id);
    setForm({
      title: book.title, author: book.author, category: book.category,
      isbn: book.isbn, description: book.description, cover: book.cover,
      totalQuantity: book.totalQuantity, availableQuantity: book.availableQuantity,
    });
    setCoverFile(null);
    setCoverPreview(book.cover);
    setShowForm(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const bookData = {
        title: form.title,
        author: form.author,
        category: form.category,
        isbn: form.isbn,
        description: form.description,
        totalQuantity: form.totalQuantity,
        availableQuantity: form.availableQuantity,
        cover: coverPreview || form.cover || '',
      };

      if (editingId) {
        await updateBook(editingId, bookData);
      } else {
        await createBook(bookData);
      }
      setShowForm(false);
      loadBooks();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(id);
      setDeleteId(null);
      loadBooks();
    } catch {
      // error handled silently
    }
  };

  return (
    <div className="bg-white rounded-xl border border-secondary/30 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-secondary/30">
        <h2 className="text-lg font-bold text-accent">藏书管理</h2>
        <button onClick={openAdd} className="btn-press flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90">
          <Plus className="w-4 h-4" /> 新增图书
        </button>
      </div>

      {loading ? (
        <div className="p-4"><TableSkeleton rows={5} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">封面</th>
                <th className="text-left px-4 py-3 text-gray-600">书名</th>
                <th className="text-left px-4 py-3 text-gray-600">作者</th>
                <th className="text-left px-4 py-3 text-gray-600">分类</th>
                <th className="text-left px-4 py-3 text-gray-600">在架/总量</th>
                <th className="text-left px-4 py-3 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-t border-secondary/20 hover:bg-secondary/10">
                  <td className="px-4 py-2">
                    <img src={book.cover} alt="" className="w-10 h-14 rounded object-cover" />
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">{book.title}</td>
                  <td className="px-4 py-2 text-gray-600">{book.author}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 bg-secondary/60 rounded-full text-xs">{book.category}</span></td>
                  <td className="px-4 py-2 text-gray-600">{book.availableQuantity}/{book.totalQuantity}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(book)} className="btn-press p-2 rounded-lg text-primary hover:bg-secondary/60">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(book.id)} className="btn-press p-2 rounded-lg text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-secondary/30">
              <h3 className="font-bold text-accent">{editingId ? '编辑图书' : '新增图书'}</h3>
              <button onClick={() => setShowForm(false)} className="btn-press p-2 rounded-lg text-gray-400 hover:bg-secondary/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-secondary/60 rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="封面预览" className="max-h-40 mx-auto rounded" />
                ) : (
                  <div className="py-4 text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">点击或拖拽上传封面</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {[
                { label: '书名', key: 'title' as const, type: 'text' },
                { label: '作者', key: 'author' as const, type: 'text' },
                { label: 'ISBN', key: 'isbn' as const, type: 'text' },
                { label: '封面URL', key: 'cover' as const, type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, [key]: e.target.value }));
                      if (key === 'cover') setCoverPreview(e.target.value);
                    }}
                    placeholder={key === 'cover' ? 'https://...' : ''}
                    className="w-full px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总量</label>
                  <input type="number" min={0} value={form.totalQuantity}
                    onChange={(e) => setForm((p) => ({ ...p, totalQuantity: +e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">在架数量</label>
                  <input type="number" min={0} value={form.availableQuantity}
                    onChange={(e) => setForm((p) => ({ ...p, availableQuantity: +e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent" />
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="btn-press w-full py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <p className="text-gray-700 mb-4">确定要删除这本书吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-press flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">取消</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-press flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
