import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToastContainer from '@/components/Toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import ExplorePage from '@/pages/ExplorePage';
import CreateTripPage from '@/pages/CreateTripPage';
import TripEditorPage from '@/pages/TripEditorPage';
import ProfilePage from '@/pages/ProfilePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ExplorePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreateTripPage />
          </ProtectedRoute>
        } />
        <Route path="/trip/:tripId/edit" element={
          <ProtectedRoute>
            <TripEditorPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}
