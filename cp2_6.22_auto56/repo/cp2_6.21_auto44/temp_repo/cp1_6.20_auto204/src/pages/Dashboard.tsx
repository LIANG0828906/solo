import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import SidePanel from '../components/SidePanel';
import { api, type Product, type RestockSuggestion } from '../api';

interface DashboardProps {
  onNavigateToOrder: (items: RestockSuggestion[]) => void;
}

function Dashboard({ onNavigateToOrder }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      if (selectedProduct) {
        const updated = data.find((p) => p.id === selectedProduct.id);
        if (updated) {
          setSelectedProduct(updated);
        }
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleClosePanel = () => {
    setSelectedProduct(null);
  };

  const handleSetThreshold = async (productId: string, threshold: number) => {
    try {
      const updated = await api.setThreshold(productId, threshold);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
      setSelectedProduct(updated);
    } catch (error) {
      console.error('设置阈值失败:', error);
    }
  };

  const handleGenerateRestock = async (product: Product) => {
    try {
      const suggestions = await api.getRestockSuggestions([product.id]);
      onNavigateToOrder(suggestions);
    } catch (error) {
      console.error('生成补货建议失败:', error);
    }
    return [] as RestockSuggestion[];
  };

  const warningCount = products.filter(
    (p) => p.status === 'warning' || p.status === 'outOfStock'
  ).length;

  const outOfStockCount = products.filter((p) => p.status === 'outOfStock').length;

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#141414',
    padding: '24px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#e0e0e0',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#a0a0a0',
  };

  const statsContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#1f1f1f',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #2a2a2a',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#a0a0a0',
    marginBottom: '8px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#e0e0e0',
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>库存管理控制台</h1>
        <p style={subtitleStyle}>
          实时监控库存变化，及时处理补货需求
        </p>
      </div>

      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>商品总数</div>
          <div style={statValueStyle}>{products.length}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>需要关注</div>
          <div style={{ ...statValueStyle, color: '#faad14' }}>
            {warningCount}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>已缺货</div>
          <div style={{ ...statValueStyle, color: '#f5222d' }}>
            {outOfStockCount}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>库存正常</div>
          <div style={{ ...statValueStyle, color: '#52c41a' }}>
            {products.length - warningCount}
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#a0a0a0',
            fontSize: '14px',
          }}
        >
          加载中...
        </div>
      ) : (
        <DataTable
          products={products}
          onRowClick={handleRowClick}
          selectedProductId={selectedProduct?.id}
        />
      )}

      <SidePanel
        product={selectedProduct}
        onClose={handleClosePanel}
        onSetThreshold={handleSetThreshold}
        onGenerateRestock={handleGenerateRestock}
      />
    </div>
  );
}

export default Dashboard;
