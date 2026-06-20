import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

const CATEGORIES = ['陶艺', '编织', '木工', '刺绣', '皮具', '珠宝', '其他'];

const urlRegex = /^https?:\/\/.+/;

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [costPrice, setCostPrice] = useState(product?.costPrice?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setImageUrl(product.imageUrl);
      setCostPrice(product.costPrice.toString());
      setStock(product.stock.toString());
    }
  }, [product]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '名称不能为空';
    else if (name.length > 30) e.name = '名称不超过30字';
    if (description.length > 300) e.description = '描述不超过300字';
    if (imageUrl && !urlRegex.test(imageUrl)) e.imageUrl = 'URL格式不正确，需以http://或https://开头';
    if (!costPrice || isNaN(Number(costPrice)) || Number(costPrice) <= 0) e.costPrice = '成本价必须为正数';
    if (stock === '' || isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock)))
      e.stock = '库存必须为非负整数';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      description,
      category,
      imageUrl: imageUrl.trim(),
      costPrice: parseFloat(parseFloat(costPrice).toFixed(2)),
      stock: parseInt(stock, 10)
    });
  };

  const fieldStyle = (field: string): React.CSSProperties => ({
    ...styles.field,
    borderColor: errors[field] ? '#dc3545' : '#e0e0e0'
  });

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{product ? '编辑商品' : '创建商品'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>
              商品名称 <span style={styles.required}>*</span>
              <span style={styles.counter}>{name.length}/30</span>
            </label>
            <input
              style={fieldStyle('name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="请输入商品名称"
            />
            {errors.name && <span style={styles.error}>{errors.name}</span>}
          </div>

          <div style={styles.group}>
            <label style={styles.label}>
              商品描述
              <span style={styles.counter}>{description.length}/300</span>
            </label>
            <textarea
              style={{ ...fieldStyle('description'), minHeight: 80, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              placeholder="请输入商品描述"
            />
            {errors.description && <span style={styles.error}>{errors.description}</span>}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>分类 <span style={styles.required}>*</span></label>
              <select
                style={{ ...fieldStyle('category'), cursor: 'pointer' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>库存 <span style={styles.required}>*</span></label>
              <input
                type="number"
                style={fieldStyle('stock')}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                step="1"
                placeholder="0"
              />
              {errors.stock && <span style={styles.error}>{errors.stock}</span>}
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>主图URL</label>
            <input
              style={fieldStyle('imageUrl')}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && <span style={styles.error}>{errors.imageUrl}</span>}
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>成本价 <span style={styles.required}>*</span></label>
              <input
                type="number"
                style={fieldStyle('costPrice')}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
              {errors.costPrice && <span style={styles.error}>{errors.costPrice}</span>}
            </div>
          </div>

          <div style={styles.buttons}>
            <button type="button" style={styles.btnCancel} onClick={onCancel}>取消</button>
            <button type="submit" style={styles.btnSubmit}>{product ? '保存修改' : '创建商品'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px 32px',
    width: '90%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
  },
  title: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#212529'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  required: {
    color: '#dc3545'
  },
  counter: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#adb5bd'
  },
  field: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 200ms',
    fontFamily: 'inherit'
  },
  error: {
    fontSize: '12px',
    color: '#dc3545'
  },
  row: {
    display: 'flex',
    gap: 12
  },
  buttons: {
    display: 'flex',
    gap: 12,
    marginTop: 4
  },
  btnCancel: {
    flex: 1,
    padding: '10px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#495057',
    fontSize: '14px',
    cursor: 'pointer'
  },
  btnSubmit: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#00d2ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  }
};
