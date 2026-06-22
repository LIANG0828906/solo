import { Routes, Route, useNavigate } from 'react-router-dom';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';

function App() {
  const navigate = useNavigate();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-title" onClick={() => navigate('/')}>
          食谱营养站
        </div>
        <div className="navbar-links">
          <button className="nav-btn" onClick={() => navigate('/')}>
            食谱列表
          </button>
          <button className="nav-btn" onClick={() => navigate('/create')}>
            发布食谱
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/create" element={<CreateRecipe />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
