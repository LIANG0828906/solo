import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import PetDetail from '@/pages/PetDetail';
import Sidebar from '@/components/Sidebar';
import VaccineReminder from '@/components/VaccineReminder';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen font-sans">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto bg-pet-bg">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pet/:id" element={<PetDetail />} />
          </Routes>
        </main>
        <VaccineReminder />
      </div>
    </Router>
  );
}
