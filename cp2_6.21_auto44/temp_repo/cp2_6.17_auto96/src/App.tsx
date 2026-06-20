import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import GalleryPage from './modules/gallery/GalleryPage';
import PhotoSharePage from './modules/gallery/PhotoSharePage';
import UploadPage from './modules/storage/UploadPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/photo/:id" element={<PhotoSharePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
