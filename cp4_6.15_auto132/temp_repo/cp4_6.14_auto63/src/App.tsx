import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MixerPage } from '@pages/MixerPage';
import '@styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MixerPage />} />
        <Route path="*" element={<MixerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
