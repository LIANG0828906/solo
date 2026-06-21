import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TimerPage from '@/pages/TimerPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <main className="ml-60 p-8 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<TimerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
