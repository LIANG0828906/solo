import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import RecipeCreate from './pages/RecipeCreate';
import Profile from './pages/Profile';
import Toast from './components/Toast';
import { useUiController } from './module3/uiController';

function AppContent() {
  const { toast, hideToast, initUser, loadRecipes, loadActivities } = useUiController();

  useEffect(() => {
    initUser();
    loadRecipes();
    loadActivities();
  }, []);

  return (
    <div style={{ minHeight: '100vh', animation: 'fadeIn 300ms ease-out' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/create" element={<RecipeCreate />} />
        <Route path="/edit/:id" element={<RecipeCreate />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/discover" element={<Home />} />
        <Route path="/my-recipes" element={<Profile />} />
        <Route path="/favorites" element={<Profile />} />
      </Routes>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
