import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import BookPage from './pages/BookPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/books/:id" element={<BookPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Routes>
    </>
  );
};

export default App;
