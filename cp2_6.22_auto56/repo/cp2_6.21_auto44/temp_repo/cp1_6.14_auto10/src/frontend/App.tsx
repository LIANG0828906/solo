import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomTabs from './components/BottomTabs';
import GroupPage from './pages/GroupPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="pt-16 md:pl-64 pb-16 md:pb-0 min-h-screen">
        <Routes>
          <Route path="/" element={<GroupPage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route path="/activities/:activityId" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      <BottomTabs />
    </div>
  );
}
