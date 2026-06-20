import { useState } from 'react';
import { usePetStore } from '@/store/petStore';
import type { Breed, AvatarEmoji } from '@/types';
import { BREEDS, AVATAR_EMOJIS } from '@/types';

export default function PetProfileGrid() {
  const { pets, selectedPetId, selectPet, addPet, removePet, appointments, services, reviews } = usePetStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState<Breed>(BREEDS[0]);
  const [age, setAge] = useState(1);
  const [avatar, setAvatar] = useState<AvatarEmoji>('🐶');

  const isNameValid = name.length >= 2 && name.length <= 10;
  const isAgeValid = age >= 1 && age <= 20;

  const handleAdd = () => {
    if (!isNameValid || !isAgeValid) return;
    addPet({ name, breed, age, avatar });
    setName('');
    setBreed(BREEDS[0]);
    setAge(1);
    setAvatar('🐶');
    setShowForm(false);
  };

  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const petAppointments = selectedPet
    ? appointments
        .filter((a) => a.petId === selectedPet.id)
        .sort((a, b) => `${a.date}${a.timeSlot}`.localeCompare(`${b.date}${b.timeSlot}`))
    : [];
  const petReviews = selectedPet
    ? reviews.filter((r) =>
        petAppointments.some((a) => a.id === r.appointmentId)
      )
    : [];

  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name ?? '未知';

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-white border-r border-[#e0d6c8]">
      <div className="border-b border-[#e0d6c8] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#3e3228]">🐾 我的宠物</h2>
          <button
            className="ripple-btn rounded-lg bg-[#4caf50] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#388e3c]"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '取消' : '+ 添加'}
          </button>
        </div>

        {showForm && (
          <div className="mt-3 space-y-2 rounded-lg border border-[#e0d6c8] bg-[#fef9f2] p-3">
            <input
              className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
              placeholder="宠物名 (2-10字符)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={10}
            />
            {!isNameValid && name.length > 0 && (
              <p className="text-xs text-red-400">名称需2-10字符</p>
            )}
            <select
              className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
              value={breed}
              onChange={(e) => setBreed(e.target.value as Breed)}
            >
              {BREEDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <input
              type="number"
              className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
              placeholder="年龄 (1-20)"
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(20, Number(e.target.value))))}
              min={1}
              max={20}
            />
            <div className="flex gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className={`ripple-btn flex h-8 w-8 items-center justify-center rounded-lg border-2 text-sm transition-all ${
                    avatar === emoji ? 'border-[#4caf50] bg-[#e8f5e9]' : 'border-[#e0d6c8] bg-white'
                  }`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              className="ripple-btn w-full rounded-lg bg-[#4caf50] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#388e3c] disabled:opacity-50"
              onClick={handleAdd}
              disabled={!isNameValid || !isAgeValid}
            >
              确认添加
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className={`ripple-btn cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                selectedPetId === pet.id
                  ? 'border-[#4caf50] bg-[#e8f5e9] shadow-sm'
                  : 'border-[#e0d6c8] bg-white hover:border-[#4caf50]'
              }`}
              onClick={() => selectPet(pet.id === selectedPetId ? null : pet.id)}
            >
              <div className="mb-1 text-2xl">{pet.avatar}</div>
              <div className="text-sm font-bold text-[#3e3228]">{pet.name}</div>
              <div className="text-xs text-[#a09488]">{pet.breed} · {pet.age}岁</div>
              <button
                className="ripple-btn mt-1.5 text-xs text-red-300 transition-colors hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removePet(pet.id);
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>

        {pets.length === 0 && (
          <div className="py-8 text-center text-sm text-[#a09488]">
            还没有宠物档案<br />点击上方"添加"开始
          </div>
        )}
      </div>

      {selectedPet && (
        <div className="border-t border-[#e0d6c8] bg-[#fef9f2] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">{selectedPet.avatar}</span>
            <h3 className="text-sm font-bold text-[#3e3228]">{selectedPet.name} 的记录</h3>
          </div>
          {petAppointments.length === 0 ? (
            <p className="text-xs text-[#a09488]">暂无预约记录</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {petAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-lg p-2 text-xs ${
                    apt.status === 'completed' ? 'bg-[#e8f5e9]' : 'bg-[#fff3e0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#3e3228]">{getServiceName(apt.serviceId)}</span>
                    {apt.status === 'completed' && (
                      <span className="rounded-[3px] bg-[#4caf50] px-1 py-0.5 text-[9px] text-white">
                        已完成
                      </span>
                    )}
                  </div>
                  <div className="text-[#a09488]">{apt.date} {apt.timeSlot}</div>
                  {petReviews.find((r) => r.appointmentId === apt.id) && (
                    <div className="mt-1 text-[#7a6e62]">
                      ⭐ {petReviews.find((r) => r.appointmentId === apt.id)!.rating}分
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
