import { useParams, useNavigate } from 'react-router-dom';
import { usePetStore } from '@/stores/petStore';
import { ArrowLeft, Calendar, Syringe, Scale, Heart, PawPrint, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import DietChart from '@/components/DietChart';
import WalkCalendar from '@/components/WalkCalendar';
import type { VaccineRecord } from '@/types';

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

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pets = usePetStore((state) => state.pets);
  const getPetVaccines = usePetStore((state) => state.getPetVaccines);
  const updateVaccine = usePetStore((state) => state.updateVaccine);

  const pet = pets.find((p) => p.id === id);
  const vaccines = pet ? getPetVaccines(pet.id) : [];

  if (!pet) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-pet-textLight">未找到该宠物</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 rounded-xl bg-pet-sidebar px-6 py-2 text-white hover:opacity-90"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const age = calculateAge(pet.birthday);

  const handleMarkVaccineDone = (vaccineId: string) => {
    updateVaccine(vaccineId, { isDone: true });
  };

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-pet-textLight transition-colors hover:text-pet-text"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </button>

      <div className="rounded-2xl bg-white p-8 shadow-sm border border-pet-border">
        <div className="flex items-start gap-6">
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl text-5xl shadow-lg"
            style={{ backgroundColor: pet.colorScheme + '30' }}
          >
            {pet.avatar ? (
              <img
                src={pet.avatar}
                alt={pet.name}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <PawPrint className="h-12 w-12" style={{ color: pet.colorScheme }} />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-pet-text">{pet.name}</h1>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: pet.colorScheme + '20', color: pet.colorScheme }}
              >
                {pet.breed}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 rounded-xl bg-pet-bg/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                  <Heart className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-xs text-pet-textLight">性别</p>
                  <p className="font-medium text-pet-text">
                    {pet.gender === 'male' ? '公' : '母'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-pet-bg/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-pet-textLight">年龄</p>
                  <p className="font-medium text-pet-text">{age}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-pet-bg/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Scale className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-pet-textLight">体重</p>
                  <p className="font-medium text-pet-text">{pet.weight} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-pet-bg/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Syringe className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-pet-textLight">疫苗</p>
                  <p className="font-medium text-pet-text">
                    {vaccines.filter((v) => v.isDone).length}/{vaccines.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-pet-textLight">
              生日：{pet.birthday}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DietChart petId={pet.id} />
        <WalkCalendar petId={pet.id} />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-pet-border">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-pet-text">
          <Syringe className="h-5 w-5 text-purple-500" />
          疫苗记录
        </h3>

        {vaccines.length === 0 ? (
          <div className="py-8 text-center text-pet-textLight">
            暂无疫苗记录
          </div>
        ) : (
          <div className="space-y-3">
            {vaccines
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((vaccine) => (
                <VaccineCard
                  key={vaccine.id}
                  vaccine={vaccine}
                  onMarkDone={handleMarkVaccineDone}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface VaccineCardProps {
  vaccine: VaccineRecord;
  onMarkDone: (id: string) => void;
}

function VaccineCard({ vaccine, onMarkDone }: VaccineCardProps) {
  const isDone = vaccine.isDone;
  const isVaccine = vaccine.type === 'vaccine';

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border p-4 transition-all duration-200',
        isDone
          ? 'bg-gray-50 border-gray-200 opacity-70'
          : 'bg-white border-pet-border hover:shadow-md'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            isVaccine ? 'bg-purple-100' : 'bg-orange-100'
          )}
        >
          <Syringe
            className={cn('h-6 w-6', isVaccine ? 'text-purple-500' : 'text-orange-500')}
          />
        </div>

        <div>
          <h4 className={cn('font-medium', isDone ? 'text-gray-400 line-through' : 'text-pet-text')}>
            {vaccine.name}
          </h4>
          <div className="mt-1 flex items-center gap-3 text-xs text-pet-textLight">
            <span className={cn(
              'rounded-full px-2 py-0.5',
              isVaccine ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
            )}>
              {isVaccine ? '疫苗' : '驱虫'}
            </span>
            <span>接种日期：{vaccine.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-pet-textLight">下次到期</p>
          <p className={cn(
            'text-sm font-medium',
            isDone ? 'text-gray-400' : 'text-pet-text'
          )}>
            {vaccine.nextDueDate}
          </p>
        </div>

        {isDone ? (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600">
            <Check className="h-3 w-3" />
            已完成
          </span>
        ) : (
          <button
            onClick={() => onMarkDone(vaccine.id)}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            标记完成
          </button>
        )}
      </div>
    </div>
  );
}
