import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import Dashboard from '@/pages/Dashboard';
import ItemList from '@/pages/ItemList';
import ItemDetail from '@/pages/ItemDetail';
import { useSwapStore } from '@/store/swapStore';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  duration: 0.25,
  ease: 'easeOut',
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Dashboard />
            </motion.div>
          }
        />
        <Route
          path="/items"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ItemList />
            </motion.div>
          }
        />
        <Route
          path="/items/:id"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ItemDetail />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const initialize = useSwapStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="min-h-screen bg-[#FFF1D0]">
        <Navbar />
        <main className="md:ml-60 pt-14 md:pt-0">
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </Router>
  );
}
