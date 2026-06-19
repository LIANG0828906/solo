import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { FilterBar } from '@/components/FilterBar';
import { FloatingButton, MobileQuickButton } from '@/components/FloatingButton';
import { useProducts, useUsageLogs, useStore } from '@/store/useStore';
import { sortProducts, getProductStatus } from '@/utils/productUtils';
import type { Product, ProductFormData } from '@/types';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const products = useProducts();
  const usageLogs = useUsageLogs();
  const addProduct = useStore((state) => state.addProduct);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const sortedProducts = useMemo(() => {
    return sortProducts(products, usageLogs);
  }, [products, usageLogs]);

  const handleFilter = useCallback((filtered: Product[]) => {
    setIsFiltering(true);
    setTimeout(() => {
      setFilteredProducts(sortProducts(filtered, usageLogs));
      setIsFiltering(false);
    }, 50);
  }, [usageLogs]);

  useEffect(() => {
    setFilteredProducts(sortedProducts);
  }, [sortedProducts]);

  const handleAddProduct = (data: ProductFormData) => {
    addProduct(data);
  };

  const handleQuickRecord = () => {
    navigate('/tracking');
  };

  const activeProductsCount = products.filter(
    (p) => getProductStatus(p) === '进行中'
  ).length;

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">我的护肤品库存</h1>
        <p className="text-gray-500">
          共 {products.length} 件产品，{activeProductsCount} 件正在使用中
        </p>
      </div>

      <FilterBar products={products} onFilter={handleFilter} />

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {products.length === 0 ? '还没有添加产品' : '没有符合条件的产品'}
          </h3>
          <p className="text-gray-500 mb-6">
            {products.length === 0
              ? '点击右下角按钮添加你的第一件护肤品'
              : '试试调整筛选条件'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark active:scale-95 transition-all duration-200"
            >
              添加产品
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300 ${
            isFiltering ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              usageLogs={usageLogs}
              index={index}
            />
          ))}
        </div>
      )}

      <FloatingButton
        onClick={() => setIsFormOpen(true)}
        icon="plus"
        label="添加产品"
      />

      <MobileQuickButton onClick={handleQuickRecord} />

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
};
