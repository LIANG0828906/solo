import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import MealPlanner from "@/moduleB/MealPlanner";
import ShoppingList from "@/moduleB/ShoppingList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/room/demo-001/meal-planner" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/room/:inviteCode/meal-planner" element={<MealPlanner />} />
        <Route path="/room/:inviteCode/shopping-list" element={<ShoppingList />} />
        <Route path="*" element={<Navigate to="/room/demo-001/meal-planner" replace />} />
      </Routes>
    </Router>
  );
}
