import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Leaf, LogOut, Users, Sprout, TreeDeciduous, Flower2 } from 'lucide-react';
import { usePlantStore } from '../stores/usePlantStore';
import { PlantVariety, varietyNames, stageNames, varietyColors } from '../services/api';

const plantSVGs: Record<string, (stage: string) => JSX.Element> = {
  pothos: (stage) => (
    <svg viewBox="0 0 120 140" className="w-full h-full plant-grow-anim">
      <ellipse cx="60" cy="130" rx="35" ry="8" fill="#8d6e63" />
      <rect x="30" y="100" width="60" height="30" rx="4" fill="#a1887f" />
      <rect x="25" y="95" width="70" height="10" rx="3" fill="#8d6e63" />
      <path d="M60 95 Q55 70 50 55" stroke="#66bb6a" strokeWidth="3" fill="none" className="leaf-sway" style={{ animationDelay: '0s' }} />
      <path d="M60 95 Q65 75 70 60" stroke="#66bb6a" strokeWidth="3" fill="none" className="leaf-sway" style={{ animationDelay: '0.5s' }} />
      {stage !== 'sprout' && (
        <>
          <ellipse cx="45" cy="55" rx="12" ry="8" fill="#81c784" transform="rotate(-20 45 55)" className="leaf-sway" style={{ animationDelay: '0.2s' }} />
          <ellipse cx="70" cy="60" rx="10" ry="7" fill="#66bb6a" transform="rotate(25 70 60)" className="leaf-sway" style={{ animationDelay: '0.7s' }} />
          <path d="M60 95 Q50 60 40 40" stroke="#4caf50" strokeWidth="2.5" fill="none" className="leaf-sway" style={{ animationDelay: '1s' }} />
          <ellipse cx="38" cy="40" rx="14" ry="9" fill="#a5d6a7" transform="rotate(-30 38 40)" className="leaf-sway" style={{ animationDelay: '1.2s' }} />
        </>
      )}
      {stage === 'flowering' && (
        <>
          <circle cx="55" cy="35" r="5" fill="#e8f5e9" />
          <circle cx="45" cy="45" r="4" fill="#c8e6c9" />
          <circle cx="65" cy="50" r="4" fill="#e8f5e9" />
        </>
      )}
      {stage === 'sprout' && (
        <ellipse cx="60" cy="85" rx="6" ry="10" fill="#81c784" className="leaf-sway" />
      )}
      {stage === 'wilting' && (
        <g opacity="0.6">
          <path d="M60 95 Q50 80 45 75" stroke="#9e9e9e" strokeWidth="3" fill="none" />
          <ellipse cx="45" cy="75" rx="10" ry="6" fill="#bdbdbd" transform="rotate(45 45 75)" />
        </g>
      )}
    </svg>
  ),
  cactus: (stage) => (
    <svg viewBox="0 0 120 140" className="w-full h-full plant-grow-anim">
      <ellipse cx="60" cy="130" rx="35" ry="8" fill="#8d6e63" />
      <rect x="30" y="100" width="60" height="30" rx="4" fill="#a1887f" />
      <rect x="25" y="95" width="70" height="10" rx="3" fill="#8d6e63" />
      {stage !== 'sprout' && (
        <>
          <rect x="48" y={stage === 'growing' ? 55 : 40} width="24" height={stage === 'growing' ? 45 : 60} rx="12" fill="#8bc34a" />
          <rect x="28" y={stage === 'growing' ? 70 : 55} width="16" height="28" rx="8" fill="#9ccc65" />
          <rect x="76" y={stage === 'growing' ? 65 : 50} width="16" height="32" rx="8" fill="#9ccc65" />
          {[...Array(8)].map((_, i) => (
            <circle key={i} cx={55 + (i % 2) * 10} cy={50 + i * 6} r="1.5" fill="#558b2f" />
          ))}
        </>
      )}
      {stage === 'flowering' && (
        <g>
          <circle cx="60" cy="35" r="10" fill="#ffeb3b" />
          <circle cx="60" cy="35" r="5" fill="#ff9800" />
          {[...Array(8)].map((_, i) => (
            <ellipse
              key={i}
              cx={60 + Math.cos((i * Math.PI) / 4) * 14}
              cy={35 + Math.sin((i * Math.PI) / 4) * 14}
              rx="6"
              ry="10"
              fill="#ffc107"
              transform={`rotate(${i * 45} ${60 + Math.cos((i * Math.PI) / 4) * 14} ${35 + Math.sin((i * Math.PI) / 4) * 14})`}
            />
          ))}
        </g>
      )}
      {stage === 'sprout' && (
        <rect x="52" y="80" width="16" height="20" rx="8" fill="#8bc34a" />
      )}
      {stage === 'wilting' && (
        <g opacity="0.5">
          <rect x="48" y="55" width="24" height="45" rx="12" fill="#9e9e9e" />
          <path d="M45 65 Q35 80 40 95" stroke="#757575" strokeWidth="3" fill="none" />
        </g>
      )}
    </svg>
  ),
  sunflower: (stage) => (
    <svg viewBox="0 0 120 140" className="w-full h-full plant-grow-anim">
      <ellipse cx="60" cy="130" rx="35" ry="8" fill="#8d6e63" />
      <rect x="30" y="100" width="60" height="30" rx="4" fill="#a1887f" />
      <rect x="25" y="95" width="70" height="10" rx="3" fill="#8d6e63" />
      <line x1="60" y1="95" x2="60" y2={stage === 'sprout' ? 85 : stage === 'growing' ? 45 : 35} stroke="#7cb342" strokeWidth="4" />
      {stage !== 'sprout' && (
        <>
          <ellipse cx="45" cy="70" rx="12" ry="7" fill="#8bc34a" transform="rotate(-20 45 70)" className="leaf-sway" style={{ animationDelay: '0.3s' }} />
          <ellipse cx="75" cy="60" rx="14" ry="8" fill="#9ccc65" transform="rotate(25 75 60)" className="leaf-sway" style={{ animationDelay: '0.8s' }} />
        </>
      )}
      {stage === 'flowering' && (
        <g>
          {[...Array(12)].map((_, i) => (
            <ellipse
              key={i}
              cx={60 + Math.cos((i * Math.PI) / 6) * 22}
              cy={30 + Math.sin((i * Math.PI) / 6) * 22}
              rx="8"
              ry="14"
              fill="#ffc107"
              transform={`rotate(${i * 30} ${60 + Math.cos((i * Math.PI) / 6) * 22} ${30 + Math.sin((i * Math.PI) / 6) * 22})`}
            />
          ))}
          <circle cx="60" cy="30" r="14" fill="#795548" />
          <circle cx="60" cy="30" r="9" fill="#5d4037" />
        </g>
      )}
      {stage === 'growing' && (
        <circle cx="60" cy="40" r="12" fill="#8bc34a" />
      )}
      {stage === 'sprout' && (
        <ellipse cx="60" cy="80" rx="8" ry="12" fill="#8bc34a" className="leaf-sway" />
      )}
      {stage === 'wilting' && (
        <g opacity="0.5">
          <line x1="60" y1="95" x2="60" y2="45" stroke="#9e9e9e" strokeWidth="4" />
          <ellipse cx="60" cy="40" rx="18" ry="8" fill="#bdbdbd" transform="rotate(15 60 40)" />
        </g>
      )}
    </svg>
  ),
  succulent: (stage) => (
    <svg viewBox="0 0 120 140" className="w-full h-full plant-grow-anim">
      <ellipse cx="60" cy="130" rx="35" ry="8" fill="#8d6e63" />
      <rect x="30" y="100" width="60" height="30" rx="4" fill="#a1887f" />
      <rect x="25" y="95" width="70" height="10" rx="3" fill="#8d6e63" />
      {stage !== 'sprout' && (
        <g>
          {[...Array(stage === 'flowering' ? 10 : 7)].map((_, i) => {
            const angle = (i * 360) / (stage === 'flowering' ? 10 : 7);
            const radius = stage === 'growing' ? 18 : 24;
            const x = 60 + Math.cos((angle * Math.PI) / 180) * radius;
            const y = 80 + Math.sin((angle * Math.PI) / 180) * radius * 0.6;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="12"
                ry="18"
                fill={i % 2 === 0 ? '#ab47bc' : '#ba68c8'}
                transform={`rotate(${angle} ${x} ${y})`}
                className="leaf-sway"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            );
          })}
          <ellipse cx="60" cy="80" rx="10" ry="14" fill="#9c27b0" />
        </g>
      )}
      {stage === 'flowering' && (
        <g>
          <circle cx="60" cy="55" r="8" fill="#f8bbd9" />
          {[...Array(5)].map((_, i) => (
            <ellipse
              key={i}
              cx={60 + Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2) * 14}
              cy={55 + Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2) * 14}
              rx="7"
              ry="10"
              fill="#f48fb1"
              transform={`rotate(${i * 72 - 90} ${60 + Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2) * 14} ${55 + Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2) * 14})`}
            />
          ))}
          <circle cx="60" cy="55" r="4" fill="#ec407a" />
        </g>
      )}
      {stage === 'sprout' && (
        <g>
          <ellipse cx="55" cy="85" rx="8" ry="14" fill="#ab47bc" transform="rotate(-15 55 85)" />
          <ellipse cx="65" cy="85" rx="8" ry="14" fill="#ba68c8" transform="rotate(15 65 85)" />
        </g>
      )}
      {stage === 'wilting' && (
        <g opacity="0.5">
          {[...Array(5)].map((_, i) => {
            const angle = (i * 360) / 5 + 30;
            const x = 60 + Math.cos((angle * Math.PI) / 180) * 18;
            const y = 85 + Math.sin((angle * Math.PI) / 180) * 12;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="10"
                ry="6"
                fill="#9e9e9e"
                transform={`rotate(${angle + 90} ${x} ${y})`}
              />
            );
          })}
        </g>
      )}
    </svg>
  ),
};

function PlantSVG({ variety, stage }: { variety: string; stage: string }) {
  const Renderer = plantSVGs[variety] || plantSVGs.pothos;
  return Renderer(stage);
}

export default function Home() {
  const navigate = useNavigate();
  const { user, plants, isLoading, error, login, register, logout, fetchPlants, createPlant } = usePlantStore();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState<PlantVariety | ''>('');
  const [plantName, setPlantName] = useState('');

  useEffect(() => {
    if (user) {
      fetchPlants();
    }
  }, [user, fetchPlants]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      navigate('/home');
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const handleCreatePlant = async () => {
    if (!selectedVariety || !plantName.trim()) return;
    try {
      await createPlant(selectedVariety as PlantVariety, plantName.trim());
      setShowModal(false);
      setSelectedVariety('');
      setPlantName('');
    } catch (err) {
      console.error('Create plant error:', err);
    }
  };

  const handlePotClick = (plantId?: number) => {
    if (plantId) {
      navigate(`/plant/${plantId}`);
    } else if (plants.length < 9) {
      setShowModal(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-green-800">植物花园</h1>
            <p className="text-green-600 mt-2">种植属于你的虚拟植物</p>
          </div>

          <div className="flex mb-6 bg-white/30 rounded-xl p-1">
            <button
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isLogin ? 'bg-white shadow text-green-700' : 'text-green-600'
              }`}
              onClick={() => setIsLogin(true)}
            >
              登录
            </button>
            <button
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isLogin ? 'bg-white shadow text-green-700' : 'text-green-600'
              }`}
              onClick={() => setIsLogin(false)}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 border border-green-200 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="请输入用户名"
                required
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 border border-green-200 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-green-800 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 border border-green-200 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="请输入密码"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const emptySlots = 9 - plants.length;

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800">我的花园</h1>
              <p className="text-green-600 text-sm">欢迎回来，{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 transition-all"
            >
              <Users className="w-5 h-5" />
              社区广场
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 justify-items-center">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="pot-card"
              onClick={() => handlePotClick(plant.id)}
            >
              <div className="w-full h-40 mb-3">
                <PlantSVG variety={plant.variety} stage={plant.stage} />
              </div>
              <div className="text-center w-full">
                <p className="font-semibold text-gray-800">{plant.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {varietyNames[plant.variety]} · {plant.days}天
                </p>
                <span
                  className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: varietyColors[plant.variety] }}
                >
                  {stageNames[plant.stage]}
                </span>
              </div>
            </div>
          ))}
          {[...Array(emptySlots)].map((_, i) => (
            <div
              key={`empty-${i}`}
              className="pot-card border-dashed border-green-300 bg-green-50/50 hover:bg-green-100/50"
              onClick={() => handlePotClick()}
            >
              <div className="flex-1 flex flex-col items-center justify-center text-green-400">
                <Plus className="w-12 h-12 mb-2" />
                <p className="text-sm">种植新植物</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <TreeDeciduous className="w-6 h-6 text-green-600" />
              选择种子
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(Object.keys(varietyNames) as PlantVariety[]).map((v) => (
                <button
                  key={v}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedVariety === v
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setSelectedVariety(v)}
                >
                  <div className="h-16 mb-2">
                    <PlantSVG variety={v} stage="growing" />
                  </div>
                  <p className="font-medium text-gray-700">{varietyNames[v]}</p>
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">植物名称</label>
              <input
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
                placeholder="给你的植物起个名字"
                maxLength={20}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreatePlant}
                className="flex-1 btn-primary"
                disabled={!selectedVariety || !plantName.trim() || isLoading}
              >
                {isLoading ? '种植中...' : '开始种植'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
