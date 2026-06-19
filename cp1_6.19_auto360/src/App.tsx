import { motion } from 'framer-motion';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';

export default function App() {
  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="app-header">
        <motion.div 
          className="logo"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="logo-icon">✨</span>
          <span className="logo-text">拆文成卡</span>
        </motion.div>
        <motion.div 
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          一键生成精美卡片
        </motion.div>
      </header>
      
      <main className="main-content">
        <div className="editor-wrapper">
          <EditorPanel />
        </div>
        <div className="divider" />
        <div className="preview-wrapper">
          <PreviewPanel />
        </div>
      </main>
    </motion.div>
  );
}
