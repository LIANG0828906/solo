import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useNutritionStore } from '@/store/useNutritionStore';
import type { UserProfile, NutritionGoals, Gender, ActivityLevel } from '@/types';
import { User, Target, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: '久坐' },
  { value: 'light', label: '轻度' },
  { value: 'moderate', label: '中度' },
  { value: 'active', label: '高度' },
  { value: 'veryActive', label: '极重度' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

function calcBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile;
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
}

function calcTDEE(profile: UserProfile): number {
  return calcBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel];
}

export default function Settings() {
  const {
    profile,
    goals,
    fetchProfile,
    fetchGoals,
    saveProfileData,
    updateGoalsData,
  } = useNutritionStore();

  const [formData, setFormData] = useState<UserProfile>({
    height: 170,
    weight: 65,
    age: 25,
    gender: 'male',
    activityLevel: 'moderate',
  });
  const [goalsForm, setGoalsForm] = useState<NutritionGoals>({
    calories: 2000,
    protein: 120,
    fat: 65,
    carbs: 250,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      await fetchProfile();
      await fetchGoals();
    };
    load();
  }, [fetchProfile, fetchGoals]);

  useEffect(() => {
    if (profile) {
      setFormData({
        height: profile.height || 170,
        weight: profile.weight || 65,
        age: profile.age || 25,
        gender: profile.gender || 'male',
        activityLevel: profile.activityLevel || 'moderate',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (goals) {
      setGoalsForm({
        calories: goals.calories,
        protein: goals.protein,
        fat: goals.fat,
        carbs: goals.carbs,
      });
    }
  }, [goals]);

  const bmr = calcBMR(formData);
  const tdee = calcTDEE(formData);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await saveProfileData(formData);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setGoalsSaved(false);
    try {
      await updateGoalsData(goalsForm);
      setGoalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2500);
    } finally {
      setSavingGoals(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800">个人设置</h1>
          <p className="text-sm text-gray-500 mt-1">
            填写基础信息，系统将为你计算个性化的营养目标
          </p>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">基础信息</h2>
              <p className="text-xs text-gray-500">用于计算 BMR 和 TDEE</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                身高 (cm)
              </label>
              <input
                type="number"
                min={100}
                max={250}
                value={formData.height}
                onChange={(e) =>
                  setFormData({ ...formData, height: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                体重 (kg)
              </label>
              <input
                type="number"
                min={30}
                max={200}
                step={0.1}
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                年龄
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                性别
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as Gender })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                活动水平
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activityLevel: e.target.value as ActivityLevel,
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all bg-white"
              >
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <div className="text-xs text-primary-600 font-medium">基础代谢率</div>
              <div className="text-2xl font-bold text-primary-700 mt-1 tabular-nums">
                {bmr.toFixed(0)}
              </div>
              <div className="text-xs text-primary-500">kcal / 天</div>
            </div>
            <div className="bg-accent-50 rounded-xl p-4 text-center">
              <div className="text-xs text-accent-600 font-medium">每日总消耗</div>
              <div className="text-2xl font-bold text-accent-700 mt-1 tabular-nums">
                {tdee.toFixed(0)}
              </div>
              <div className="text-xs text-accent-500">kcal / 天 (TDEE)</div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-white btn-ripple transition-all duration-200 active:scale-[0.98]',
              'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
              'disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
            )}
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : profileSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存基础信息
              </>
            )}
          </button>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">营养目标</h2>
              <p className="text-xs text-gray-500">
                根据基础信息自动计算，可手动调整
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                热量 (kcal)
              </label>
              <input
                type="number"
                min={500}
                max={6000}
                value={goalsForm.calories}
                onChange={(e) =>
                  setGoalsForm({ ...goalsForm, calories: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                蛋白质 (g)
              </label>
              <input
                type="number"
                min={20}
                max={500}
                value={goalsForm.protein}
                onChange={(e) =>
                  setGoalsForm({ ...goalsForm, protein: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                脂肪 (g)
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={goalsForm.fat}
                onChange={(e) =>
                  setGoalsForm({ ...goalsForm, fat: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                碳水化合物 (g)
              </label>
              <input
                type="number"
                min={50}
                max={800}
                value={goalsForm.carbs}
                onChange={(e) =>
                  setGoalsForm({ ...goalsForm, carbs: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all tabular-nums"
              />
            </div>
          </div>

          <button
            onClick={handleSaveGoals}
            disabled={savingGoals}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-white btn-ripple transition-all duration-200 active:scale-[0.98]',
              'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700',
              'disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
            )}
          >
            {savingGoals ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : goalsSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存营养目标
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
