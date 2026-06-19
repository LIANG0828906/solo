import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import RecipeDetail from '@/pages/RecipeDetail';
import RecipeEditor from '@/pages/RecipeEditor';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/editor/new" element={<RecipeEditor />} />
        <Route path="/editor/:id" element={<RecipeEditor />} />
      </Routes>
    </Router>
  );
}
