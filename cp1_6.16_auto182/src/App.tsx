import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MyListingsPage from './pages/MyListingsPage';
import { useMarketplaceStore } from './store/useMarketplaceStore';

const { Content } = Layout;

type PageKey = 'home' | 'my-listings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const loadCurrentUser = useMarketplaceStore(state => state.loadCurrentUser);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const handleNavigate = (page: PageKey) => {
    setCurrentPage(page);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#FFF8E7' }}>
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <Content
        style={{
          padding: 24,
          maxWidth: 1400,
          margin: '0 auto',
          width: '100%'
        }}
      >
        {currentPage === 'home' ? <HomePage /> : <MyListingsPage />}
      </Content>
    </Layout>
  );
}
