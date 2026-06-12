import { Routes, Route } from 'react-router-dom';
import ClubPage from './pages/ClubPage';
import BookDetailPage from './pages/BookDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ClubPage />} />
      <Route path="/book/:id" element={<BookDetailPage />} />
    </Routes>
  );
}

export default App;
