import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import GalleryPage from '@/pages/GalleryPage';
import ProfilePage from '@/pages/ProfilePage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'gallery':
        return <GalleryPage />;
      case 'profile':
        return <ProfilePage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={styles.app}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main style={styles.main}>{renderPage()}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#0B0E17',
    color: '#FFFFFF',
  },
  main: {
    minHeight: 'calc(100vh - 60px)',
  },
};

export default App;
