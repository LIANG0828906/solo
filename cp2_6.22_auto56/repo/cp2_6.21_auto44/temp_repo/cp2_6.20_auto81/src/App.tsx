import { Routes, Route } from 'react-router-dom';
import StoryPage from './pages/StoryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StoryPage />} />
    </Routes>
  );
}

export default App;
