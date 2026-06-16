import React, { useEffect, useState } from 'react';
import { Layout, Badge } from 'antd';
import { HeartFilled, HomeOutlined } from '@ant-design/icons';
import RecipeSearchPage from './pages/RecipeSearchPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import { useRecipeStore } from './stores/recipeStore';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const { favorites } = useRecipeStore();

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isDetailPage = route.startsWith('#/recipe/');

  return (
    <Layout style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <Header
        style={{
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          height: 56,
          lineHeight: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, marginRight: 8 }}>🍳</span>
          <a
            href="#/"
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'opacity 0.2s ease',
            }}
          >
            食谱探索
          </a>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginLeft: 8 }}>
            智能配料替代工具
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a
            href="#/"
            style={{
              color: !isDetailPage ? '#1890FF' : 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.2s ease',
            }}
          >
            <HomeOutlined /> 首页
          </a>
          <Badge count={favorites.length} offset={[2, -2]}>
            <HeartFilled
              style={{
                fontSize: 20,
                color: favorites.length > 0 ? '#FF4D4F' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.2s ease',
              }}
            />
          </Badge>
        </div>
      </Header>

      <Content
        style={{
          padding: '24px 30px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {isDetailPage ? <RecipeDetailPage /> : <RecipeSearchPage />}
      </Content>
    </Layout>
  );
};

export default App;
