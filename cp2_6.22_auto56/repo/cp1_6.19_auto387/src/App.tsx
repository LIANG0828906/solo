import { motion } from 'framer-motion';
import { TeaSearch } from './TeaSearch';
import { Workbench } from './Workbench';
import { RecipeCard } from './RecipeCard';

export default function App() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-8 pb-4 px-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 4px 14px rgba(165, 214, 167, 0.4)' }}
            >
              <span className="text-2xl">🍵</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">TeaBlend</h1>
              <p className="text-xs text-gray-500">茶饮调配工坊 · 定制你的专属味道</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            实时智能推荐引擎已就绪
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="max-w-6xl mx-auto px-6 mb-2"
      >
        <div className="bg-white rounded-2xl p-5 flex items-center gap-5"
          style={{ boxShadow: '0 4px 20px rgba(165, 214, 167, 0.2)' }}
        >
          <div className="text-4xl">🧪</div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-800">像调酒师一样调配你的专属茶饮</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              自由选择茶底、小料和糖浆，系统会根据你的口味偏好推荐隐藏搭配，生成精美配方卡片保存分享
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-xs text-gray-400">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">22+</div>
              精选材料
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">AI</div>
              智能搭配
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">1s</div>
              卡片生成
            </div>
          </div>
        </div>
      </motion.div>

      <TeaSearch />
      <Workbench />
      <RecipeCard />

      <footer className="py-8 text-center text-xs text-gray-400">
        <p>Made with 🍃 · TeaBlend 茶饮调配工坊</p>
      </footer>
    </div>
  );
}
