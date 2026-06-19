import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/modal';
import type { Product } from '@/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    price: number;
    stock: number;
    dailyLimit: number;
  }) => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product = null,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    dailyLimit: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        dailyLimit: product.dailyLimit.toString(),
      });
    } else {
      setFormData({ name: '', price: '', stock: '', dailyLimit: '' });
    }
    setErrors({});
  }, [product, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入商品名称';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      newErrors.price = '价格必须为正数';
    }

    const stock = parseInt(formData.stock, 10);
    if (!formData.stock || isNaN(stock) || stock <= 0) {
      newErrors.stock = '库存必须为正数';
    }

    const dailyLimit = parseInt(formData.dailyLimit, 10);
    if (!formData.dailyLimit || isNaN(dailyLimit) || dailyLimit <= 0) {
      newErrors.dailyLimit = '今日限量必须为正数';
    }

    if (dailyLimit > stock) {
      newErrors.dailyLimit = '今日限量不能超过库存';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      dailyLimit: parseInt(formData.dailyLimit, 10),
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? '编辑商品' : '添加商品'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {product ? '保存' : '添加'}
          </button>
        </>
      }
    >
      <form className="product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            商品名称
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`input ${errors.name ? 'error' : ''}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="请输入商品名称"
            autoFocus
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price" className="form-label">
              价格 (元)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              className={`input ${errors.price ? 'error' : ''}`}
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
            />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="stock" className="form-label">
              库存
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              className={`input ${errors.stock ? 'error' : ''}`}
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
            />
            {errors.stock && <span className="form-error">{errors.stock}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dailyLimit" className="form-label">
            今日限量
          </label>
          <input
            id="dailyLimit"
            name="dailyLimit"
            type="number"
            min="0"
            className={`input ${errors.dailyLimit ? 'error' : ''}`}
            value={formData.dailyLimit}
            onChange={handleChange}
            placeholder="0"
          />
          {errors.dailyLimit && (
            <span className="form-error">{errors.dailyLimit}</span>
          )}
        </div>
      </form>
      <style>{`
        .product-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
        }
        .input.error {
          border-color: var(--color-danger);
        }
        .input.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
        .form-error {
          font-size: 12px;
          color: var(--color-danger);
        }
        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Modal>
  );
};
