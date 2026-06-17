import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PoemList } from '@/components/PoemList';
import { Editor } from '@/components/Editor';
import { PoemDetail } from '@/components/PoemDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PoemList />} />
        <Route path="/editor/:id?" element={<Editor />} />
        <Route path="/poem/:id" element={<PoemDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
