import { useState, useEffect, useRef } from 'react';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/lib/utils';
import { Syringe, Clock, Check } from 'lucide-react';
import type { VaccineRecord, Pet } from '@/types';

export default function VaccineReminder() {
  const { pets, checkDueVaccines, updateVaccine } = usePetStore();
  const [currentReminder, setCurrentReminder] = useState<VaccineRecord | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [postponedIds, setPostponedIds] = useState<Set<string>>(new Set());
  const checkedRef = useRef(false);

  const findPet = (petId: string): Pet | undefined => {
    return pets.find((p) => p.id === petId);
  };

  const getDaysUntilDue = (nextDueDate: string): number => {
    const now = new Date();
    const due = new Date(nextDueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const checkVaccines = () => {
    const dueVaccines = checkDueVaccines(3);
    const available = dueVaccines.filter((v) => !postponedIds.has(v.id));

    if (available.length > 0) {
      const nextVaccine = available[0];
      setCurrentReminder(nextVaccine);
      setIsAnimating(true);
      setTimeout(() => setIsVisible(true), 10);
    }
  };

  useEffect(() => {
    if (!checkedRef.current) {
      checkedRef.current = true;
      const timer = setTimeout(() => {
        checkVaccines();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkVaccines();
    }, 30000);

    return () => clearInterval(interval);
  }, [postponedIds]);

  const handleMarkDone = () => {
    if (!currentReminder) return;

    updateVaccine(currentReminder.id, { isDone: true });
    setIsVisible(false);
    setTimeout(() => {
      setIsAnimating(false);
      setCurrentReminder(null);
    }, 300);
  };

  const handlePostpone = () => {
    if (!currentReminder) return;

    setPostponedIds((prev) => new Set(prev).add(currentReminder.id));
    setIsVisible(false);
    setTimeout(() => {
      setIsAnimating(false);
      setCurrentReminder(null);
    }, 300);
  };

  const pet = currentReminder ? findPet(currentReminder.petId) : undefined;
  const daysLeft = currentReminder ? getDaysUntilDue(currentReminder.nextDueDate) : 0;

  if (!isAnimating || !currentReminder) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/40 backdrop-blur-sm',
        'transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-[20px] p-6',
          'bg-white/80 backdrop-blur-xl',
          'shadow-2xl shadow-black/20',
          'transform transition-all duration-300 ease-out',
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: pet?.colorScheme || '#BCAAA4' }}
          >
            {pet?.avatar ? (
              <img
                src={pet.avatar}
                alt={pet.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <Syringe className="h-7 w-7 text-white" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">疫苗到期提醒</h3>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-800">{pet?.name || '未知宠物'}</span>
              <span> 的 </span>
              <span className="font-medium text-gray-800">{currentReminder.name}</span>
              <span> 将于 </span>
              <span className="font-bold text-orange-500">{daysLeft}</span>
              <span> 天后到期</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="text-xs text-orange-700">
            到期日期：{new Date(currentReminder.nextDueDate).toLocaleDateString('zh-CN')}
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePostpone}
            className={cn(
              'flex-1 rounded-xl px-4 py-3 text-sm font-medium',
              'bg-gray-100 text-gray-700',
              'hover:bg-gray-200 active:bg-gray-300',
              'transition-colors duration-200'
            )}
          >
            稍后提醒
          </button>
          <button
            onClick={handleMarkDone}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium',
              'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
              'hover:from-green-600 hover:to-emerald-600',
              'active:from-green-700 active:to-emerald-700',
              'shadow-lg shadow-green-500/30',
              'transition-all duration-200'
            )}
          >
            <Check className="h-4 w-4" />
            已处理
          </button>
        </div>
      </div>
    </div>
  );
}
