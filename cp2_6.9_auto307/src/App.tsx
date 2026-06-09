import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Prescription from './pages/Prescription';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard />
            </motion.div>
          }
        />
        <Route
          path="/prescription"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Prescription />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#f5efe0]">
        <Navigation />
        <main className="pb-8">
          <AnimatedRoutes />
        </main>
        <footer className="text-center py-4 text-[#8d6e63]/60 text-sm border-t border-[#c9a96e]/20">
          <p>回春堂药铺管理系统 © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
