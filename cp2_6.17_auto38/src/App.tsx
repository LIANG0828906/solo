import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/detail/:propertyId" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
