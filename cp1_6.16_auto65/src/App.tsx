import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { MealPlanProvider } from './context/MealPlanContext';
import Navbar from './components/Navbar';
import BrowseRecipesPage from './pages/BrowseRecipesPage';
import MealPlanPage from './pages/MealPlanPage';

export default function App() {
  return (
    <FavoritesProvider>
      <MealPlanProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<BrowseRecipesPage />} />
              <Route path="/meal-plan" element={<MealPlanPage />} />
            </Routes>
          </div>
        </Router>
      </MealPlanProvider>
    </FavoritesProvider>
  );
}
