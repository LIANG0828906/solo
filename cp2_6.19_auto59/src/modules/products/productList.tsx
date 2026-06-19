import React, { useState, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { ProductCard } from './productCard';
import { ProductModal } from './productModal';
import type { Product } from '@/types';

export const ProductList: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductId, setNewProductId] = useState<string | null>(null);

  const handleAddClick = useCallback(() => {
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (window.confirm('确定要删除这个商品吗？')) {
        deleteProduct(id);
      }
    },
    [deleteProduct]
  );

  const handleSubmit = useCallback(
    (data: {
      name: string;
      price: number;
      stock: number;
      dailyLimit: number;
    }) => {
      if (editingProduct) {
        updateProduct(editingProduct.id, data);
      } else {
        addProduct(data);
        const newId = products.length > 0 ? products[products.length - 1].id : null;
        if (newId) {
          setNewProductId(newId);
          setTimeout(() => setNewProductId(null), 300);
        }
      }
    },
    [editingProduct, updateProduct, addProduct, products]
  );

  return (
    <div className="product-list-page">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <button className="btn btn-accent" onClick={handleAddClick}>
          + 添加商品
        </button>
      </div>

      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            isNew={index === products.length - 1 && newProductId === product.id}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-text">暂无商品，点击上方按钮添加</p>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        product={editingProduct}
      />

      <style>{`
        .product-list-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 300ms ease-out;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
        }
        .empty-icon {
          font-size: 64px;
          opacity: 0.5;
        }
        .empty-text {
          color: var(--color-text-light);
          font-size: 16px;
        }
        @media (max-width: 768px) {
          .product-list-page {
            padding: 16px;
          }
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .page-title {
            font-size: 20px;
          }
          .product-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};
