import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import GroceryDrawer from "@/components/GroceryDrawer";
import Home from "@/pages/Home";
import RecipeDetail from "@/pages/RecipeDetail";
import ShareRecipe from "@/pages/ShareRecipe";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#FFF8F0]">
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/share" element={<ShareRecipe />} />
          </Routes>
        </main>
        <GroceryDrawer />
        <MobileNav />
      </div>
    </Router>
  );
}
