import { useState, useEffect } from 'react';
import {
  Plus,
  Syringe,
  Utensils,
  Footprints,
  Edit3,
  X,
  PawPrint,
  Calendar,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/lib/utils';
import PetCard from '@/components/PetCard';
import VaccineReminder from '@/components/VaccineReminder';
import type { Pet, VaccineRecord, DietRecord, WalkRecord } from '@/types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-pet-border">
          <h3 className="text-lg font-bold text-pet-text">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-pet-textLight hover:bg-pet-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface VaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onSubmit: (data: Omit<VaccineRecord, 'id'>) => void;
}

function VaccineModal({ isOpen, onClose, pet, onSubmit }: VaccineModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [type, setType] = useState<'vaccine' | 'deworming'>('vaccine');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !name.trim()) return;

    onSubmit({
      petId: pet.id,
      name: name.trim(),
      date,
      nextDueDate,
      type,
      isDone: true,
    });

    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setNextDueDate(d.toISOString().split('T')[0]);
    setType('vaccine');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`💉 为 ${pet?.name || ''} 接种疫苗`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            疫苗名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：狂犬疫苗、三联疫苗"
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            类型
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('vaccine')}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                type === 'vaccine'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
              )}
            >
              疫苗
            </button>
            <button
              type="button"
              onClick={() => setType('deworming')}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                type === 'deworming'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
              )}
            >
              驱虫
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            接种日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            下次到期日期
          </label>
          <input
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className={cn(
            'w-full py-3 rounded-xl text-white font-medium',
            'bg-gradient-to-r from-blue-500 to-cyan-500',
            'hover:from-blue-600 hover:to-cyan-600',
            'shadow-lg shadow-blue-500/30',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          确认接种
        </button>
      </form>
    </Modal>
  );
}

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onSubmit: (data: Omit<DietRecord, 'id'>) => void;
}

function FeedModal({ isOpen, onClose, pet, onSubmit }: FeedModalProps) {
  const [type, setType] = useState<'dry' | 'wet' | 'snack'>('dry');
  const [brand, setBrand] = useState('');
  const [grams, setGrams] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet) return;

    onSubmit({
      petId: pet.id,
      type,
      brand: brand.trim() || '默认品牌',
      grams,
      timestamp: new Date().toISOString(),
    });

    setBrand('');
    setGrams(50);
    setType('dry');
    onClose();
  };

  const typeOptions = [
    { value: 'dry' as const, label: '干粮', emoji: '🥣', color: 'amber' },
    { value: 'wet' as const, label: '湿粮', emoji: '🥫', color: 'green' },
    { value: 'snack' as const, label: '零食', emoji: '🍖', color: 'orange' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🍖 喂食 ${pet?.name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-pet-text mb-2">
            食物类型
          </label>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 rounded-xl transition-all',
                  type === opt.value
                    ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 shadow-md'
                    : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            品牌
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="可选，例如：皇家、渴望"
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            分量（克）
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
              className="flex-1 h-2 bg-pet-border rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
              className="w-20 px-3 py-2 text-center rounded-xl border border-pet-border bg-white text-pet-text focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
          <p className="mt-1 text-xs text-pet-textLight">
            建议：小型犬每次 50-100g，大型犬每次 150-300g
          </p>
        </div>

        <button
          type="submit"
          className={cn(
            'w-full py-3 rounded-xl text-white font-medium',
            'bg-gradient-to-r from-amber-500 to-orange-500',
            'hover:from-amber-600 hover:to-orange-600',
            'shadow-lg shadow-amber-500/30',
            'transition-all duration-200'
          )}
        >
          记录喂食
        </button>
      </form>
    </Modal>
  );
}

interface WalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onSubmit: (data: Omit<WalkRecord, 'id'>) => void;
}

function WalkModal({ isOpen, onClose, pet, onSubmit }: WalkModalProps) {
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet) return;

    onSubmit({
      petId: pet.id,
      startLocation: { lat: 0, lng: 0 },
      endLocation: { lat: 0, lng: 0 },
      duration,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    });

    setDuration(30);
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🐾 遛狗打卡 - ${pet?.name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            遛弯时长（分钟）
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="180"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1 h-2 bg-pet-border rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 px-3 py-2 text-center rounded-xl border border-pet-border bg-white text-pet-text focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[15, 30, 60, 90].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuration(min)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  duration === min
                    ? 'bg-green-500 text-white'
                    : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
                )}
              >
                {min}分钟
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            备注（可选）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录一下今天的表现..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all resize-none"
          />
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">健康小贴士</span>
          </div>
          <p className="mt-1 text-xs text-green-600">
            每天保证充足的运动时间，有助于宠物的身心健康哦~
          </p>
        </div>

        <button
          type="submit"
          className={cn(
            'w-full py-3 rounded-xl text-white font-medium',
            'bg-gradient-to-r from-green-500 to-emerald-500',
            'hover:from-green-600 hover:to-emerald-600',
            'shadow-lg shadow-green-500/30',
            'transition-all duration-200'
          )}
        >
          完成打卡
        </button>
      </form>
    </Modal>
  );
}

interface PetModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet?: Pet | null;
  onSubmit: (data: Omit<Pet, 'id' | 'colorScheme'> & { colorScheme?: string }) => void;
}

function PetModal({ isOpen, onClose, pet, onSubmit }: PetModalProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setBreed(pet.breed);
      setGender(pet.gender);
      setBirthday(pet.birthday);
      setWeight(String(pet.weight));
    } else {
      setName('');
      setBreed('');
      setGender('male');
      setBirthday('');
      setWeight('');
    }
  }, [pet, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !breed.trim() || !birthday || !weight) return;

    onSubmit({
      name: name.trim(),
      breed: breed.trim(),
      gender,
      birthday,
      weight: Number(weight),
    });

    onClose();
  };

  const isEdit = !!pet;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? '✏️ 编辑宠物' : '🐾 添加新宠物'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            名字 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="给你的宠物起个名字吧"
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-pet-textLight/30 focus:border-pet-textLight transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-1">
            品种 *
          </label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="例如：橘猫、金毛、柯基"
            className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-pet-textLight/30 focus:border-pet-textLight transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pet-text mb-2">
            性别 *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                gender === 'male'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
              )}
            >
              <span>♂</span> 公
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                gender === 'female'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-pet-bg text-pet-textLight hover:bg-pet-border/50'
              )}
            >
              <span>♀</span> 母
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pet-text mb-1">
              生日 *
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text focus:outline-none focus:ring-2 focus:ring-pet-textLight/30 focus:border-pet-textLight transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pet-text mb-1">
              体重 (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-2.5 rounded-xl border border-pet-border bg-white text-pet-text placeholder:text-pet-textLight focus:outline-none focus:ring-2 focus:ring-pet-textLight/30 focus:border-pet-textLight transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !breed.trim() || !birthday || !weight}
          className={cn(
            'w-full py-3 rounded-xl text-white font-medium',
            'bg-gradient-to-r from-orange-400 to-amber-500',
            'hover:from-orange-500 hover:to-amber-600',
            'shadow-lg shadow-orange-400/30',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isEdit ? '保存修改' : '添加宠物'}
        </button>
      </form>
    </Modal>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

export default function Home() {
  const {
    pets,
    vaccines,
    addVaccine,
    addDietRecord,
    addWalkRecord,
    addPet,
    updatePet,
    checkDueVaccines,
    getPetDietRecords,
    getPetWalkRecords,
  } = usePetStore();

  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [walkModalOpen, setWalkModalOpen] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const dueVaccines = checkDueVaccines(7);

  const todayDietCount = pets.reduce((count, pet) => {
    const records = getPetDietRecords(pet.id);
    const today = new Date().toDateString();
    return count + records.filter((r) => new Date(r.timestamp).toDateString() === today).length;
  }, 0);

  const todayWalkCount = pets.reduce((count, pet) => {
    const records = getPetWalkRecords(pet.id);
    const today = new Date().toDateString();
    return count + records.filter((r) => new Date(r.timestamp).toDateString() === today).length;
  }, 0);

  const handleVaccinate = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setVaccineModalOpen(true);
    }
  };

  const handleFeed = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setFeedModalOpen(true);
    }
  };

  const handleWalk = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setWalkModalOpen(true);
    }
  };

  const handleEdit = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setEditingPet(pet);
      setPetModalOpen(true);
    }
  };

  const handleAddPetClick = () => {
    setEditingPet(null);
    setPetModalOpen(true);
  };

  const handlePetSubmit = (data: Omit<Pet, 'id' | 'colorScheme'> & { colorScheme?: string }) => {
    if (editingPet) {
      updatePet(editingPet.id, data);
    } else {
      addPet(data);
    }
  };

  const today = new Date();
  const greeting = getGreeting();
  const dateStr = formatDate(today);

  return (
    <div className="min-h-screen bg-pet-bg">
      <VaccineReminder />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-pet-text sm:text-3xl">
                {greeting}，铲屎官 👋
              </h1>
              <p className="mt-1 text-pet-textLight">{dateStr}</p>
            </div>
            <button
              onClick={handleAddPetClick}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
                'hover:from-orange-500 hover:to-amber-600',
                'shadow-lg shadow-orange-400/30',
                'transition-all duration-200',
                'active:scale-95'
              )}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">添加宠物</span>
            </button>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-pet-text mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            今日概览
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-pet-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <PawPrint className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pet-text">{pets.length}</p>
                  <p className="text-xs text-pet-textLight">宠物总数</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-pet-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Syringe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pet-text">{dueVaccines.length}</p>
                  <p className="text-xs text-pet-textLight">即将到期疫苗</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-pet-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Utensils className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pet-text">{todayDietCount}</p>
                  <p className="text-xs text-pet-textLight">今日喂食次数</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-pet-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Footprints className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pet-text">{todayWalkCount}</p>
                  <p className="text-xs text-pet-textLight">今日遛狗次数</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {dueVaccines.length > 0 && (
          <section className="mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-orange-800">
                    有 {dueVaccines.length} 个疫苗即将到期
                  </h3>
                  <p className="mt-1 text-sm text-orange-700">
                    请及时带宠物去接种，保护它们的健康~
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dueVaccines.slice(0, 3).map((v) => {
                      const pet = pets.find((p) => p.id === v.petId);
                      return (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 text-xs text-orange-700"
                        >
                          <span className="font-medium">{pet?.name || '未知'}</span>
                          <span>·</span>
                          <span>{v.name}</span>
                        </span>
                      );
                    })}
                    {dueVaccines.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-white/80 text-xs text-orange-700">
                        +{dueVaccines.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-pet-text mb-4 flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            我的宠物
          </h2>

          {pets.length === 0 ? (
            <div className="rounded-2xl bg-white border border-pet-border p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-pet-bg">
                <span className="text-4xl">🐾</span>
              </div>
              <h3 className="text-lg font-bold text-pet-text">还没有宠物档案</h3>
              <p className="mt-2 text-sm text-pet-textLight">
                添加你的第一只宠物，开始记录它的健康成长吧~
              </p>
              <button
                onClick={handleAddPetClick}
                className={cn(
                  'mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                  'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
                  'hover:from-orange-500 hover:to-amber-600',
                  'shadow-lg shadow-orange-400/30',
                  'transition-all duration-200',
                  'active:scale-95'
                )}
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">添加宠物</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {pets.map((pet) => (
                <div key={pet.id} className="min-w-[280px] w-full">
                  <PetCard
                    pet={pet}
                    onVaccinate={handleVaccinate}
                    onFeed={handleFeed}
                    onWalk={handleWalk}
                    onEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <VaccineModal
        isOpen={vaccineModalOpen}
        onClose={() => setVaccineModalOpen(false)}
        pet={selectedPet}
        onSubmit={addVaccine}
      />

      <FeedModal
        isOpen={feedModalOpen}
        onClose={() => setFeedModalOpen(false)}
        pet={selectedPet}
        onSubmit={addDietRecord}
      />

      <WalkModal
        isOpen={walkModalOpen}
        onClose={() => setWalkModalOpen(false)}
        pet={selectedPet}
        onSubmit={addWalkRecord}
      />

      <PetModal
        isOpen={petModalOpen}
        onClose={() => setPetModalOpen(false)}
        pet={editingPet}
        onSubmit={handlePetSubmit}
      />
    </div>
  );
}
