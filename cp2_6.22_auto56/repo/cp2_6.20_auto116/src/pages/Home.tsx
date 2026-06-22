import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Layers, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="text-yellow-400" size={40} />
          <h1
            className="text-5xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            }}
          >
            卡牌对战
          </h1>
          <Sparkles className="text-yellow-400" size={40} />
        </div>
        <p className="text-gray-400 text-lg">
          打造你的卡组，挑战AI对手，成为最强卡牌大师！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <button
          className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(42, 42, 74, 0.8), rgba(26, 26, 46, 0.9))',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
          onClick={() => navigate('/deck-builder')}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
                boxShadow: '0 4px 20px rgba(74, 158, 255, 0.4)',
              }}
            >
              <Layers size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">卡组编辑</h2>
            <p className="text-gray-400 text-center text-sm">
              从50张卡牌中挑选最强组合，打造属于你的专属卡组
            </p>
            <div
              className="mt-2 px-6 py-2 rounded-full text-sm font-bold text-white
                         transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
              }}
            >
              开始构建
            </div>
          </div>
        </button>

        <button
          className="group p-8 rounded-2xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(42, 42, 74, 0.8), rgba(26, 26, 46, 0.9))',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
          onClick={() => navigate('/battle')}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
              }}
            >
              <Swords size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">开始对战</h2>
            <p className="text-gray-400 text-center text-sm">
              与AI对手展开激烈的卡牌对战，考验你的策略智慧
            </p>
            <div
              className="mt-2 px-6 py-2 rounded-full text-sm font-bold text-white
                         transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              }}
            >
              开始游戏
            </div>
          </div>
        </button>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm">
          游戏特色：50张独特卡牌 • 丰富技能系统 • 智能AI对手
        </p>
      </div>
    </div>
  );
};
