import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ExhibitPage from './pages/ExhibitPage';
import ManagePage from './pages/ManagePage';
import HomePage from './pages/HomePage';
import { useStore } from './store';

function App() {
  const user = useStore((state) => state.user);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exhibit/:id" element={<ExhibitPage />} />
        <Route
          path="/manage/:boothId"
          element={user ? <ManagePage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
