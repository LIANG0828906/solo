import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePetStore } from '@/stores/petStore';
import {
  PawPrint,
  Plus,
  Menu,
  X,
  Heart,
} from 'lucide-react';

const catBreeds = ['猫', 'cat', '橘猫', '布偶', '英短', '美短', '暹罗', '波斯', '缅因', '斯芬克斯', '加菲', '折耳', '短腿', '狸花', '三花', '奶牛'];
const dogBreeds = ['狗', 'dog', '哈士奇', '金毛', '柯基', '泰迪', '比熊', '边牧', '法斗', '柴犬', '萨摩耶', '博美', '吉娃娃', '拉布拉多', '阿拉斯加', '德牧', '古牧', '苏牧', '喜乐蒂', '雪纳瑞', '约克夏', '马尔济斯', '可卡', '腊肠', '斗牛', '巴哥', '京巴', '藏獒', '高加索', '圣伯纳'];

function getPetEmoji(breed: string): string {
  const lowerBreed = breed.toLowerCase();
  for (const cat of catBreeds) {
    if (lowerBreed.includes(cat.toLowerCase())) {
      return '🐱';
    }
  }
  for (const dog of dogBreeds) {
    if (lowerBreed.includes(dog.toLowerCase())) {
      return '🐶';
    }
  }
  return '🐾';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen: controlledIsOpen, onToggle: controlledOnToggle }: SidebarProps = {}) {
  const { pets, addPet } = usePetStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onToggle = controlledOnToggle || (() => setInternalIsOpen(!internalIsOpen));
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: 'male' as 'male' | 'female',
    birthday: '',
    weight: '',
  });

  const currentPetId = location.pathname.split('/pet/')[1] || '';

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.breed || !formData.birthday || !formData.weight) {
      return;
    }
    addPet({
      name: formData.name,
      breed: formData.breed,
      gender: formData.gender,
      birthday: formData.birthday,
      weight: parseFloat(formData.weight),
    });
    setFormData({
      name: '',
      breed: '',
      gender: 'male',
      birthday: '',
      weight: '',
    });
    setShowAddForm(false);
  };

  const handlePetClick = (petId: string) => {
    navigate(`/pet/${petId}`);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'fixed top-4 left-4 z-50 md:hidden',
          'flex h-10 w-10 items-center justify-center rounded-xl',
          'bg-pet-sidebar text-white shadow-lg',
          'transition-all duration-300 hover:bg-pet-sidebar/90 active:scale-95'
        )}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col',
          'bg-pet-sidebar text-white',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <PawPrint size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">宠物健康管家</h1>
            <p className="text-xs text-white/60">爱宠的健康每一天</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-xs font-medium text-white/50 uppercase tracking-wider">
            我的宠物
          </div>
          <div className="space-y-1">
            {pets.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Heart size={20} className="text-white/50" />
                </div>
                <p className="text-sm text-white/50">还没有添加宠物</p>
                <p className="text-xs text-white/30 mt-1">点击下方按钮添加吧</p>
              </div>
            ) : (
              pets.map((pet) => {
                const isActive = currentPetId === pet.id;
                const emoji = getPetEmoji(pet.breed);
                return (
                  <button
                    key={pet.id}
                    onClick={() => handlePetClick(pet.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                      'transition-all duration-200',
                      'hover:bg-white/10 active:scale-[0.98]',
                      isActive && 'bg-white/15 shadow-inner'
                    )}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg shadow-sm"
                      style={{ backgroundColor: hexToRgba(pet.colorScheme, 0.9) }}
                    >
                      {pet.avatar ? (
                        <img
                          src={pet.avatar}
                          alt={pet.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium text-sm">{pet.name}</p>
                      <p className="truncate text-xs text-white/50">{pet.breed}</p>
                    </div>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-white/80" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => setShowAddForm(true)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
              'bg-white/15 text-white font-medium',
              'transition-all duration-200',
              'hover:bg-white/25 active:scale-[0.98]',
              'backdrop-blur-sm'
            )}
          >
            <Plus size={18} />
            <span>添加宠物</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pet-sidebar/10">
                <Plus size={20} className="text-pet-sidebar" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-pet-text">添加新宠物</h2>
                <p className="text-sm text-pet-textLight">记录爱宠的基本信息</p>
              </div>
            </div>

            <form onSubmit={handleAddPet} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-pet-text">
                  宠物昵称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="给它起个名字吧"
                  className="w-full rounded-xl border border-pet-border bg-white px-4 py-2.5 text-pet-text placeholder:text-pet-textLight/50 focus:border-pet-sidebar/50 focus:outline-none focus:ring-2 focus:ring-pet-sidebar/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-pet-text">
                  品种
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="如：橘猫、金毛、柯基"
                  className="w-full rounded-xl border border-pet-border bg-white px-4 py-2.5 text-pet-text placeholder:text-pet-textLight/50 focus:border-pet-sidebar/50 focus:outline-none focus:ring-2 focus:ring-pet-sidebar/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-pet-text">
                  性别
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border font-medium transition-all duration-200',
                      formData.gender === 'male'
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-pet-border text-pet-textLight hover:border-pet-border/80'
                    )}
                  >
                    ♂ 公
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border font-medium transition-all duration-200',
                      formData.gender === 'female'
                        ? 'border-pink-400 bg-pink-50 text-pink-600'
                        : 'border-pet-border text-pet-textLight hover:border-pet-border/80'
                    )}
                  >
                    ♀ 母
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-pet-text">
                  生日
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full rounded-xl border border-pet-border bg-white px-4 py-2.5 text-pet-text focus:border-pet-sidebar/50 focus:outline-none focus:ring-2 focus:ring-pet-sidebar/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-pet-text">
                  体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-pet-border bg-white px-4 py-2.5 text-pet-text placeholder:text-pet-textLight/50 focus:border-pet-sidebar/50 focus:outline-none focus:ring-2 focus:ring-pet-sidebar/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium',
                    'bg-gray-100 text-gray-600',
                    'hover:bg-gray-200 active:scale-[0.98] transition-all duration-200'
                  )}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium',
                    'bg-pet-sidebar text-white',
                    'hover:bg-pet-sidebar/90 active:scale-[0.98] transition-all duration-200'
                  )}
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
