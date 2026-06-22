import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Publish from './pages/Publish';
import Detail from './pages/Detail';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import { authApi, User } from './api';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi
        .getMe()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      const demoUser = localStorage.getItem('user');
      if (demoUser) {
        setUser(JSON.parse(demoUser));
      }
      setLoading(false);
    }
  }, []);

  const handleLogin = (userId: string) => {
    authApi.login(userId).then((data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <div className="container main-content">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home user={user} />} />
          <Route
            path="/publish"
            element={user ? <Publish user={user} /> : <Navigate to="/" />}
          />
          <Route path="/item/:id" element={<Detail user={user} />} />
          <Route
            path="/profile"
            element={
              user ? (
                <Profile user={user} onUpdateUser={handleUpdateUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
