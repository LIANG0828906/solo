import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { DetailPage } from './pages/DetailPage';
import { DemoPage } from './pages/DemoPage';
import { UploadPage } from './pages/UploadPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/detail/:id" element={<DetailPage />} />
        <Route path="/demo/:id" element={<DemoPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
