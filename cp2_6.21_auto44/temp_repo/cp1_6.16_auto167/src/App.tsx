import { Routes, Route } from 'react-router-dom';
import EditPage from './pages/EditPage';
import PreviewPage from './pages/PreviewPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditPage />} />
      <Route path="/preview" element={<PreviewPage />} />
    </Routes>
  );
}
