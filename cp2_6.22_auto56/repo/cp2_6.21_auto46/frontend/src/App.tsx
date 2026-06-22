import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Navbar from './components/Navbar';
import WordLibraryPage from './pages/WordLibraryPage';
import LearnPage from './pages/LearnPage';
import ReviewPage from './pages/ReviewPage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="app">
      {isAuthenticated && <Navbar />}
      <main className={`main-content ${isAuthenticated ? 'with-navbar' : ''}`}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/library" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/library" /> : <RegisterPage />} />
          <Route
            path="/library"
            element={isAuthenticated ? <WordLibraryPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/learn"
            element={isAuthenticated ? <LearnPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/review"
            element={isAuthenticated ? <ReviewPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/stats"
            element={isAuthenticated ? <StatsPage /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/library' : '/login'} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
