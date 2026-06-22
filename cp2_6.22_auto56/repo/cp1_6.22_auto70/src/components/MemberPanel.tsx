import { useState, useEffect, useCallback } from 'react';
import { Plus, X, User, Clock, MapPin } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchUsers, addUser as addUserApi, deleteUser as deleteUserApi } from '@/modules/user/userService';
import { timezones, getCityTimezone } from '@/data/timezones';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/shared/types';

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#EC4899', '#F43F5E', '#0EA5E9', '#10B981',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  const intPart = Math.floor(Math.abs(offset));
  const decPart = Math.abs(offset) % 1 === 0.5 ? ':30' : '';
  return `UTC${sign}${offset < 0 ? '-' : ''}${intPart}${decPart}`;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

interface FormState {
  name: string;
  city: string;
  workStart: string;
  workEnd: string;
}

const initialForm: FormState = { name: '', city: '', workStart: '09:00', workEnd: '18:00' };

export default function MemberPanel() {
  const users = useStore((s) => s.users);
  const setUsers = useStore((s) => s.setUsers);
  const addUserToStore = useStore((s) => s.addUser);
  const removeUser = useStore((s) => s.removeUser);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [fadeInIds, setFadeInIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, [setUsers]);

  const selectedTz = form.city ? getCityTimezone(form.city) : null;

  const handleCityChange = useCallback((city: string) => {
    setForm((prev) => ({ ...prev, city }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.city || !selectedTz) return;
    setSubmitting(true);
    try {
      const newUser = await addUserApi({
        name: form.name.trim(),
        city: form.city,
        timezone: selectedTz.timezone,
        utcOffset: selectedTz.utcOffset,
        workStart: form.workStart,
        workEnd: form.workEnd,
        online: true,
      });
      addUserToStore(newUser);
      setFadeInIds((prev) => new Set(prev).add(newUser.id));
      setTimeout(() => {
        setFadeInIds((prev) => {
          const next = new Set(prev);
          next.delete(newUser.id);
          return next;
        });
      }, 500);
      setForm(initialForm);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedTz, addUserToStore]);

  const handleDelete = useCallback(async (user: UserType) => {
    try {
      await deleteUserApi(user.id);
      removeUser(user.id);
    } catch (err) {
      console.error(err);
    }
  }, [removeUser]);

  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-semibold text-gray-800">团队成员</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          showForm ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="mx-3 mb-2 space-y-2 rounded-lg bg-white p-3 shadow-sm">
          <input
            type="text"
            placeholder="姓名"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          />
          <select
            value={form.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="">选择城市</option>
            {timezones.map((tz) => (
              <option key={tz.city} value={tz.city}>
                {tz.city} ({formatOffset(tz.utcOffset)})
              </option>
            ))}
          </select>
          {selectedTz && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />
              <span>{selectedTz.timezone} · {formatOffset(selectedTz.utcOffset)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={form.workStart}
              onChange={(e) => setForm((p) => ({ ...p, workStart: e.target.value }))}
              className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="self-center text-xs text-gray-400">—</span>
            <select
              value={form.workEnd}
              onChange={(e) => setForm((p) => ({ ...p, workEnd: e.target.value }))}
              className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !form.city}
            className="w-full rounded bg-blue-500 py-1.5 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? '添加中...' : '添加成员'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                'group relative flex items-start gap-3 rounded-lg bg-white px-3 py-2.5 transition-all duration-200 hover:border-l-[3px] hover:border-l-blue-500 hover:bg-[#E3F2FD]',
                fadeInIds.has(user.id) && 'animate-[fadeIn_0.5s_ease-out]'
              )}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getAvatarColor(user.name) }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-gray-800">{user.name}</span>
                  <span
                    className={cn(
                      'h-2 w-2 flex-shrink-0 rounded-full',
                      user.online ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} />
                  <span>{user.city}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User size={11} />
                  <span>{formatOffset(user.utcOffset)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={11} />
                  <span>{user.workStart} - {user.workEnd}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(user)}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-red-500 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
