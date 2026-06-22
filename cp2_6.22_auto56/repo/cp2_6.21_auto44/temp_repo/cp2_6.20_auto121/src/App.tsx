import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Sidebar';
import ReviewSquare from './pages/ReviewSquare';
import Bookshelf from './pages/Bookshelf';
import ReviewEditor from './pages/ReviewEditor';
import DebateZone from './pages/DebateZone';
import Settings from './pages/Settings';
import { useUserStore } from './stores/userStore';
import './App.css';

type PageKey = 'reviews' | 'bookshelf' | 'debate' | 'settings' | 'editor';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('reviews');
  const user = useUserStore((s) => s.user);
  const login = useUserStore((s) => s.login);

  React.useEffect(() => {
    if (!user) {
      login({
        id: 'u1',
        nickname: '墨语书客',
        avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20avatar%20of%20a%20literary%20reader%2C%20minimalist%20watercolor%20style&image_size=square_hd',
      });
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'reviews':
        return <ReviewSquare onWriteReview={() => setCurrentPage('editor')} />;
      case 'bookshelf':
        return <Bookshelf />;
      case 'debate':
        return <DebateZone />;
      case 'settings':
        return <Settings />;
      case 'editor':
        return <ReviewEditor onBack={() => setCurrentPage('reviews')} />;
      default:
        return <ReviewSquare onWriteReview={() => setCurrentPage('editor')} />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app-container">
        <Sidebar
          user={user}
          currentPage={currentPage}
          onNavigate={(page: string) => setCurrentPage(page as PageKey)}
        />
        <main className="main-area">{renderPage()}</main>
      </div>
    </ConfigProvider>
  );
};

export default App;
