import React, { useState } from 'react';
import { useBookStore } from '../store';
import { Plus } from 'lucide-react';

const CATEGORIES = ['科幻', '文学', '历史', '技术', '经济', '悬疑', '哲学', '艺术', '其他'];

const BookForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const { addBook, loading } = useBookStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim()) {
      return;
    }

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    await addBook({
      title: title.trim(),
      author: author.trim(),
      category,
      tags: tagArray.length > 0 ? tagArray : [category],
      description: description.trim() || undefined
    });

    setTitle('');
    setAuthor('');
    setCategory(CATEGORIES[0]);
    setTags('');
    setDescription('');
  };

  return (
    <form className="publish-form" onSubmit={handleSubmit}>
      <h2 className="form-title">
        <Plus size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        发布闲置书籍
      </h2>
      <div className="form-group">
        <label>书名 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入书名"
          required
        />
      </div>
      <div className="form-group">
        <label>作者 *</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="请输入作者"
          required
        />
      </div>
      <div className="form-group">
        <label>类别</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>标签（用逗号分隔）</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例如：科幻, 宇宙, 冒险"
        />
      </div>
      <div className="form-group">
        <label>简介</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请输入书籍简介（选填）"
          rows={3}
        />
      </div>
      <button type="submit" className="btn btn-submit" disabled={loading}>
        {loading ? '发布中...' : '立即发布'}
      </button>
    </form>
  );
};

export default BookForm;
