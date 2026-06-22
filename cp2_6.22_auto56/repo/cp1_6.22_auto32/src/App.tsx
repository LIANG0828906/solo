import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from '@/modules/user/UserContext';
import { PoemProvider } from '@/modules/poem/PoemContext';
import LoginPage from '@/modules/user/LoginPage';
import ProfilePage from '@/modules/user/ProfilePage';
import ExplorePage from '@/modules/poem/ExplorePage';
import CreatePoemPage from '@/modules/poem/CreatePoemPage';
import Navbar from '@/components/Navbar';

function App() {
  return (
    <UserProvider>
      <PoemProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Navigate to="/explore" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/create" element={<CreatePoemPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </PoemProvider>
    </UserProvider>
  );
}

export default App;
