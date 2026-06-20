import { Routes, Route } from 'react-router-dom';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
