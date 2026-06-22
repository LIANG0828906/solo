import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DishDetailPage from './pages/DishDetailPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dish/:id" element={<DishDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
