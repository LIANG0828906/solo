import { motion } from 'framer-motion';
import FlowerLibrary from './FlowerLibrary';
import BouquetWorkspace from './BouquetWorkspace';
import RecommendationPanel from './RecommendationPanel';

export default function App() {
  return (
    <div className="app">
      <motion.header
        className="navbar"
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="navbar-content">
          <div className="logo">
            <span className="logo-icon">🌸</span>
            <span className="logo-text">花语轩</span>
          </div>
          <nav className="nav-links">
            <a className="nav-link active" href="#home">花束搭配</a>
            <a className="nav-link" href="#library">花材百科</a>
            <a className="nav-link" href="#occasions">场合推荐</a>
          </nav>
          <div className="nav-actions">
            <motion.button className="nav-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              💝 我的收藏
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="main-content" id="home">
        <div className="layout-container">
          <aside className="left-panel">
            <FlowerLibrary />
          </aside>

          <section className="center-panel">
            <BouquetWorkspace />
          </section>

          <aside className="right-panel">
            <RecommendationPanel />
          </aside>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <span>🌸 花语轩 - 让每一束花都传递真挚情感</span>
          <span className="footer-tip">提示：拖动花材可调整顺序 · 点击推荐卡片可直接应用搭配</span>
        </div>
      </footer>
    </div>
  );
}
