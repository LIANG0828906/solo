import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { GalleryPage } from '@/pages/GalleryPage';
import { ExhibitionPage } from '@/pages/ExhibitionPage';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/exhibition/:id" element={<ExhibitionPage />} />
          <Route path="*" element={<GalleryPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
