import { Routes, Route } from 'react-router-dom';
import { EditorCanvas } from './components/EditorCanvas';
import { StorePreview } from './components/StorePreview';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorCanvas />} />
      <Route path="/store-preview" element={<StorePreview />} />
    </Routes>
  );
}
