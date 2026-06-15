import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Home from '@/pages/Home';
import Booking from '@/pages/Booking';
import Coach from '@/pages/Coach';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col lg:flex-row min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
        <Sidebar />
        <main
          className="flex-1 p-6 overflow-auto"
          style={{ minWidth: '800px', padding: '24px' }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/coach" element={<Coach />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
