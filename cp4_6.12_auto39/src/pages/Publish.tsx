import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsApi, User } from '../api';
import ImageUploader from '../components/ImageUploader';
import './Publish.css';

interface PublishProps {
  user: User;
}

const categories = ['家电', '家具', '书籍', '其他'];
const conditions = ['全新', '九成新', '七成新', '有瑕疵'];

const Publish = ({ user }: PublishProps) => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('家电');
  const [condition, setCondition] = useState('九成新');
  const [description, setDescription] = useState('');
  const [community, setCommunity] = useState(user.community || '');
  const [building, setBuilding] = useState(user.building || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请填写物品名称');
      return;
    }
    if (!description.trim()) {
      setError('请填写物品描述');
      return;
    }
    if (!community.trim()) {
      setError('请填写小区名称');
      return;
    }
    if (!building.trim()) {
      setError('请填写楼栋号');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('description', description);
      formData.append('community', community);
      formData.append('building', building);

      for (let i = 0; i < images.length; i++) {
        const byteString = atob(images[i].split(',')[1]);
        const mimeString = images[i].split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) {
          ia[j] = byteString.charCodeAt(j);
        }
        const blob = new Blob([ab], { type: mimeString });
        formData.append('images', blob, `image${i}.jpg`);
      }

      await itemsApi.publishItem(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.error || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x - 30}px`;
    ripple.style.top = `${y - 30}px`;
    ripple.style.width = '60px';
    ripple.style.height = '60px';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 400);
  };

  return (
    <div className="publish-page">
      <h1 className="page-title">发布闲置物品</h1>

      <form className="publish-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>物品图片</label>
          <ImageUploader images={images} onChange={setImages} maxImages={3} />
        </div>

        <div className="form-group">
          <label>物品名称</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入物品名称"
            maxLength={50}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>物品类别</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>新旧程度</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>详细描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述物品的使用情况、是否有瑕疵等"
            rows={4}
            maxLength={500}
          />
          <span className="char-count">{description.length}/500</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>小区名称</label>
            <input
              type="text"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="如：阳光花园"
            />
          </div>

          <div className="form-group">
            <label>楼栋号</label>
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="如：1号楼"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="submit-btn ripple"
          disabled={submitting}
          onClick={createRipple}
        >
          {submitting ? '发布中...' : '立即发布'}
        </button>
      </form>
    </div>
  );
};

export default Publish;
