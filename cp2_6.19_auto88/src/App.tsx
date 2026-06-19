import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import RecipeDetail from "@/pages/RecipeDetail";
import RecipeCreate from "@/pages/RecipeCreate";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/create" element={<RecipeCreate />} />
        <Route path="/edit/:id" element={<RecipeCreate />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
