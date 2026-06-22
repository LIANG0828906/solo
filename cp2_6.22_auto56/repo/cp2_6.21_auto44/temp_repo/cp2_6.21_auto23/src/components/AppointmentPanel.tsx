import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { usePetStore } from '@/store/petStore';
import type { Service, Breed, AvatarEmoji } from '@/types';
import { BREEDS, TIME_SLOTS } from '@/types';

interface AppointmentPanelProps {
  service: Service | null;
  onClose: () => void;
}

export default function AppointmentPanel({ service, onClose }: AppointmentPanelProps) {
  const { pets, addPet, addAppointment, isSlotOccupied, appointments } = usePetStore();
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showAddPet, setShowAddPet] = useState(false);

  const [newPetName, setNewPetName] = useState('');
  const [newPetBreed, setNewPetBreed] = useState<Breed>(BREEDS[0]);
  const [newPetAge, setNewPetAge] = useState<number>(1);
  const [newPetAvatar, setNewPetAvatar] = useState<AvatarEmoji>('🐶');

  const next7Days = useMemo(() => {
    const days: { value: string; label: string; weekday: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs().add(i, 'day');
      days.push({
        value: d.format('YYYY-MM-DD'),
        label: d.format('MM/DD'),
        weekday: d.format('ddd'),
      });
    }
    return days;
  }, []);

  const occupiedSlots = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    return new Set(
      appointments
        .filter((a) => a.date === selectedDate)
        .map((a) => a.timeSlot)
    );
  }, [selectedDate, appointments]);

  const isNameValid = newPetName.length >= 2 && newPetName.length <= 10;
  const isAgeValid = newPetAge >= 1 && newPetAge <= 20;

  const handleAddPet = () => {
    if (!isNameValid || !isAgeValid) return;
    addPet({ name: newPetName, breed: newPetBreed, age: newPetAge, avatar: newPetAvatar });
    const newId = `pet_${Date.now()}`;
    setSelectedPetId(newId);
    setShowAddPet(false);
    setNewPetName('');
    setNewPetAge(1);
  };

  const handleSubmit = () => {
    if (!service || !selectedPetId || !selectedDate || !selectedTimeSlot) return;
    if (isSlotOccupied(selectedDate, selectedTimeSlot)) return;
    addAppointment({
      petId: selectedPetId,
      serviceId: service.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      notes: notes.slice(0, 100),
      status: 'pending',
    });
    onClose();
  };

  if (!service) return null;

  const canSubmit = selectedPetId && selectedDate && selectedTimeSlot && !isSlotOccupied(selectedDate, selectedTimeSlot);

  return (
    <div className="panel-overlay fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="panel-content h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e0d6c8] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: service.color }}
              >
                {service.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#3e3228]">{service.name}</h2>
                <p className="text-xs text-[#a09488]">{service.priceRange} · {service.duration}</p>
              </div>
            </div>
            <button
              className="ripple-btn rounded-full p-2 text-[#a09488] transition-colors hover:bg-[#fef9f2] hover:text-[#3e3228]"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e3228]">选择宠物</label>
            {pets.length > 0 ? (
              <select
                className="w-full rounded-lg border border-[#e0d6c8] bg-[#fef9f2] p-2.5 text-sm outline-none focus:border-[#4caf50] focus:ring-1 focus:ring-[#4caf50]"
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
              >
                <option value="">请选择宠物</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name} ({p.breed})
                  </option>
                ))}
              </select>
            ) : null}
            <button
              className="ripple-btn mt-2 text-sm font-semibold text-[#4caf50] transition-colors hover:text-[#388e3c]"
              onClick={() => setShowAddPet(!showAddPet)}
            >
              {showAddPet ? '取消添加' : '+ 添加新宠物'}
            </button>

            {showAddPet && (
              <div className="mt-3 space-y-3 rounded-lg border border-[#e0d6c8] bg-[#fef9f2] p-4">
                <div>
                  <label className="mb-1 block text-xs text-[#7a6e62]">宠物名 (2-10字符)</label>
                  <input
                    className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    maxLength={10}
                    placeholder="输入宠物名"
                  />
                  {!isNameValid && newPetName.length > 0 && (
                    <p className="mt-1 text-xs text-red-400">名称需2-10字符</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7a6e62]">品种</label>
                  <select
                    className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value as Breed)}
                  >
                    {BREEDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7a6e62]">年龄 (1-20)</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-[#e0d6c8] bg-white p-2 text-sm outline-none focus:border-[#4caf50]"
                    value={newPetAge}
                    onChange={(e) => setNewPetAge(Math.max(1, Math.min(20, Number(e.target.value))))}
                    min={1}
                    max={20}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#7a6e62]">头像</label>
                  <div className="flex gap-2">
                    {(['🐶', '🐱', '🐰', '🐹'] as AvatarEmoji[]).map((emoji) => (
                      <button
                        key={emoji}
                        className={`ripple-btn flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-all ${
                          newPetAvatar === emoji
                            ? 'border-[#4caf50] bg-[#e8f5e9]'
                            : 'border-[#e0d6c8] bg-white hover:border-[#4caf50]'
                        }`}
                        onClick={() => setNewPetAvatar(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="ripple-btn w-full rounded-lg bg-[#4caf50] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#388e3c] disabled:opacity-50"
                  onClick={handleAddPet}
                  disabled={!isNameValid || !isAgeValid}
                >
                  添加宠物
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e3228]">选择日期</label>
            <div className="grid grid-cols-7 gap-1.5">
              {next7Days.map((d) => (
                <button
                  key={d.value}
                  className={`ripple-btn rounded-lg border p-2 text-center text-xs transition-all ${
                    selectedDate === d.value
                      ? 'border-[#4caf50] bg-[#4caf50] text-white'
                      : 'border-[#e0d6c8] bg-white text-[#3e3228] hover:border-[#4caf50]'
                  }`}
                  onClick={() => {
                    setSelectedDate(d.value);
                    setSelectedTimeSlot('');
                  }}
                >
                  <div className="font-semibold">{d.weekday}</div>
                  <div className="mt-0.5">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3e3228]">选择时段</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isOccupied = occupiedSlots.has(slot);
                  return (
                    <button
                      key={slot}
                      className={`ripple-btn rounded-lg border p-2 text-sm font-medium transition-all ${
                        isOccupied
                          ? 'cursor-not-allowed border-[#e0d6c8] bg-[#f5f0ea] text-[#c4b8aa]'
                          : selectedTimeSlot === slot
                          ? 'border-[#4caf50] bg-[#4caf50] text-white'
                          : 'border-[#e0d6c8] bg-white text-[#3e3228] hover:border-[#4caf50]'
                      }`}
                      disabled={isOccupied}
                      onClick={() => !isOccupied && setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3e3228]">备注 (可选，最多100字)</label>
            <textarea
              className="w-full rounded-lg border border-[#e0d6c8] bg-white p-2.5 text-sm outline-none focus:border-[#4caf50] focus:ring-1 focus:ring-[#4caf50]"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 100))}
              placeholder="如有特殊要求请备注..."
              maxLength={100}
            />
            <div className="mt-1 text-right text-xs text-[#a09488]">{notes.length}/100</div>
          </div>

          <button
            className="ripple-btn w-full rounded-xl bg-[#4caf50] py-3 text-base font-bold text-white transition-all hover:bg-[#388e3c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#4caf50] disabled:hover:shadow-none"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            确认预约
          </button>
        </div>
      </div>
    </div>
  );
}
