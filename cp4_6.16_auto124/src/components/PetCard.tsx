import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePetStore } from '@/stores/petStore';
import type { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onVaccinate?: (petId: string) => void;
  onFeed?: (petId: string) => void;
  onWalk?: (petId: string) => void;
  onEdit?: (petId: string) => void;
}

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

function calculateAge(birthday: string): string {
  const birthDate = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) {
    return `${years}岁${months > 0 ? months + '个月' : ''}`;
  }
  return `${months}个月`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PetCard({
  pet,
  onVaccinate,
  onFeed,
  onWalk,
  onEdit,
}: PetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const addVaccine = usePetStore((state) => state.addVaccine);
  const addDietRecord = usePetStore((state) => state.addDietRecord);
  const addWalkRecord = usePetStore((state) => state.addWalkRecord);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleVaccinate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVaccinate) {
      onVaccinate(pet.id);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      addVaccine({
        petId: pet.id,
        name: '常规疫苗',
        date: today,
        nextDueDate: nextDue.toISOString().split('T')[0],
        type: 'vaccine',
        isDone: true,
      });
    }
  };

  const handleFeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFeed) {
      onFeed(pet.id);
    } else {
      addDietRecord({
        petId: pet.id,
        type: 'dry',
        brand: '默认品牌',
        grams: 50,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleWalk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWalk) {
      onWalk(pet.id);
    } else {
      addWalkRecord({
        petId: pet.id,
        startLocation: { lat: 0, lng: 0 },
        endLocation: { lat: 0, lng: 0 },
        duration: 30,
        notes: '',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(pet.id);
    }
  };

  const genderText = pet.gender === 'male' ? '♂ 公' : '♀ 母';
  const ageText = calculateAge(pet.birthday);
  const emoji = getPetEmoji(pet.breed);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${hexToRgba(pet.colorScheme, 0.15)} 0%, #FFFFFF 100%)`,
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-pet-border bg-white',
        'cursor-pointer transition-all duration-300 ease-in-out',
        'hover:-translate-y-2 hover:shadow-xl',
        isExpanded ? 'shadow-lg' : 'shadow-sm'
      )}
      style={{
        ...gradientStyle,
        height: isExpanded ? 480 : 160,
        transition: 'height 300ms ease-in-out, transform 300ms ease-in-out, box-shadow 300ms ease-in-out',
      }}
      onClick={handleCardClick}
    >
      <div className="h-full w-full">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center',
                'rounded-full border-2 border-white text-3xl',
                'shadow-md transition-shadow duration-300'
              )}
              style={{ backgroundColor: hexToRgba(pet.colorScheme, 0.3) }}
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

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold text-pet-text">{pet.name}</h3>
              <p className="mt-1 text-sm text-pet-textLight">{pet.breed}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-pet-text">{genderText}</span>
                <span className="text-pet-textLight">·</span>
                <span className="text-pet-text">{ageText}</span>
                <span className="text-pet-textLight">·</span>
                <span className="text-pet-text">{pet.weight}kg</span>
              </div>
            </div>

            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'text-pet-textLight transition-transform duration-300',
                isExpanded ? 'rotate-180' : ''
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          <div className="px-5">
            <div className="rounded-xl bg-white/60 p-4 backdrop-blur-sm">
              <h4 className="mb-3 text-sm font-semibold text-pet-text">宠物档案</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-pet-textLight">昵称</span>
                  <p className="font-medium text-pet-text">{pet.name}</p>
                </div>
                <div>
                  <span className="text-pet-textLight">品种</span>
                  <p className="font-medium text-pet-text">{pet.breed}</p>
                </div>
                <div>
                  <span className="text-pet-textLight">性别</span>
                  <p className="font-medium text-pet-text">{pet.gender === 'male' ? '公' : '母'}</p>
                </div>
                <div>
                  <span className="text-pet-textLight">年龄</span>
                  <p className="font-medium text-pet-text">{ageText}</p>
                </div>
                <div>
                  <span className="text-pet-textLight">体重</span>
                  <p className="font-medium text-pet-text">{pet.weight} kg</p>
                </div>
                <div>
                  <span className="text-pet-textLight">生日</span>
                  <p className="font-medium text-pet-text">{pet.birthday}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-pet-border bg-white/90 p-4 backdrop-blur-sm">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleVaccinate}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-3',
                  'bg-blue-50 text-blue-600 transition-all duration-200',
                  'hover:bg-blue-100 hover:shadow-md active:scale-95'
                )}
              >
                <span className="text-xl">💉</span>
                <span className="text-xs font-medium">打疫苗</span>
              </button>

              <button
                onClick={handleFeed}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-3',
                  'bg-amber-50 text-amber-600 transition-all duration-200',
                  'hover:bg-amber-100 hover:shadow-md active:scale-95'
                )}
              >
                <span className="text-xl">🍖</span>
                <span className="text-xs font-medium">喂食</span>
              </button>

              <button
                onClick={handleWalk}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-3',
                  'bg-green-50 text-green-600 transition-all duration-200',
                  'hover:bg-green-100 hover:shadow-md active:scale-95'
                )}
              >
                <span className="text-xl">🐾</span>
                <span className="text-xs font-medium">遛狗</span>
              </button>

              <button
                onClick={handleEdit}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-3',
                  'bg-gray-50 text-gray-600 transition-all duration-200',
                  'hover:bg-gray-100 hover:shadow-md active:scale-95'
                )}
              >
                <span className="text-xl">✏️</span>
                <span className="text-xs font-medium">编辑</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
