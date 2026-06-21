import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import MealPlan from '@/pages/MealPlan';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/plan" element={<MealPlan />} />
    </Routes>
  );
}
