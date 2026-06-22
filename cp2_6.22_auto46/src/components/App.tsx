import { useState, useCallback } from 'react';
import Dashboard from './Dashboard';
import ProductPanel from './ProductPanel';
import type { Product, ProductDetail } from '../types';

function App() {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const handleProductClick = useCallback((product: ProductDetail) => {
    setSelectedProduct(product);
    setPanelVisible(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelVisible(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 500);
  }, []);

  return (
    <div className="app">
      <Dashboard onProductClick={handleProductClick} />
      {selectedProduct && (
        <ProductPanel
          product={selectedProduct}
          visible={panelVisible}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}

export default App;
