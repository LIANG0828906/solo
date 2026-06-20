import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/BookDetailPage';
import ExchangePage from './pages/ExchangePage';

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/exchanges" element={<ExchangePage />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
