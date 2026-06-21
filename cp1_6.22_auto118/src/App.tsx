import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClassList from './pages/ClassList';
import ClassDetail from './pages/ClassDetail';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClassList />} />
        <Route path="/class/:id" element={<ClassDetail />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
