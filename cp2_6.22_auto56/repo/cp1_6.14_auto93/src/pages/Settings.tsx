import { useEffect, useState } from 'react';
import { useNutritionStore } from '@/store/nutrition';
import { User, Target, Activity, Save, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { profile, loading, fetchProfile, updateProfile } = useNutritionStore();

  const [form, setForm] = useState({
    name: '用户',
    age: 25,
    gender: 'male' as 'male' | 'female',
    height: 170,
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: 3,
    goal: 'lose' as 'lose' | 'gain' | 'maintain',
  });

  const [calculated, setCalculated] = useState<{
    bmr: number;
    tdee: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        currentWeight: profile.currentWeight,
        targetWeight: profile.targetWeight,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
      setCalculated({
        bmr: 0,
        tdee: 0,
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fat: profile.targetFat,
      });
    }
  }, [profile]);

  const handleCalculate = async () => {
    try {
      const res = await fetch('/api/profile/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setCalculated(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    await updateProfile(form);
  };

  const activityLevels = [
    { value: 1, label: '久坐', desc: '几乎不运动' },
    { value: 2, label: '轻度', desc: '每周1-3次' },
    { value: 3, label: '中度', desc: '每周3-5次' },
    { value: 4, label: '高度', desc: '每周6-7次' },
    { value: 5, label: '极高', desc: '体力工作/每日训练' },
  ];

  const goals = [
    { value: 'lose', label: '减脂', color: 'text-[#FF6B9D]' },
    { value: 'maintain', label: '维持', color: 'text-[#7CB342]' },
    { value: 'gain', label: '增肌', color: 'text-[#FFB74D]' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">个人设置</h1>
        <p className="mt-1 text-sm text-gray-500">管理您的个人档案和营养目标</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card-base">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E1]">
                <User className="h-5 w-5 text-[#7CB342]" />
              </div>
              <h3 className="font-semibold text-gray-800">基本信息</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">昵称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-[#7CB342] focus:bg-white focus:ring-2 focus:ring-[#7CB342]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">年龄</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-[#7CB342] focus:bg-white focus:ring-2 focus:ring-[#7CB342]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">性别</label>
                  <div className="flex h-[42px] gap-2">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, gender: g })}
                        className={cn(
                          'flex-1 rounded-xl border text-sm font-medium transition',
                          form.gender === g
                            ? 'border-[#7CB342] bg-[#7CB342]/10 text-[#7CB342]'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {g === 'male' ? '男' : '女'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">身高 (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-[#7CB342] focus:bg-white focus:ring-2 focus:ring-[#7CB342]/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">当前体重 (kg)</label>
                  <input
                    type="number"
                    value={form.currentWeight}
                    onChange={(e) => setForm({ ...form, currentWeight: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-[#7CB342] focus:bg-white focus:ring-2 focus:ring-[#7CB342]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">目标体重 (kg)</label>
                <input
                  type="number"
                  value={form.targetWeight}
                  onChange={(e) => setForm({ ...form, targetWeight: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-800 outline-none transition focus:border-[#7CB342] focus:bg-white focus:ring-2 focus:ring-[#7CB342]/20"
                />
              </div>
            </div>
          </div>

          <div className="card-base">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E1]">
                <Activity className="h-5 w-5 text-[#7CB342]" />
              </div>
              <h3 className="font-semibold text-gray-800">活动水平</h3>
            </div>
            <div className="space-y-2">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setForm({ ...form, activityLevel: level.value })}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                    form.activityLevel === level.value
                      ? 'border-[#7CB342] bg-[#7CB342]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div>
                    <div className={cn('font-medium', form.activityLevel === level.value ? 'text-[#7CB342]' : 'text-gray-800')}>
                      {level.label}
                    </div>
                    <div className="text-xs text-gray-500">{level.desc}</div>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2',
                      form.activityLevel === level.value
                        ? 'border-[#7CB342] bg-[#7CB342]'
                        : 'border-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="card-base">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E1]">
                <Target className="h-5 w-5 text-[#7CB342]" />
              </div>
              <h3 className="font-semibold text-gray-800">健身目标</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setForm({ ...form, goal: g.value as any })}
                  className={cn(
                    'rounded-xl border px-4 py-4 text-center font-medium transition',
                    form.goal === g.value
                      ? 'border-[#7CB342] bg-[#7CB342]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className={g.color}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-base">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E1]">
                  <Calculator className="h-5 w-5 text-[#7CB342]" />
                </div>
                <h3 className="font-semibold text-gray-800">营养计算</h3>
              </div>
              <button
                onClick={handleCalculate}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-[#7CB342] hover:text-[#7CB342]"
              >
                重新计算
              </button>
            </div>

            {calculated ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">基础代谢 BMR</div>
                    <div className="mt-1 text-xl font-bold text-gray-800">
                      {calculated.bmr || '—'}
                      <span className="ml-1 text-xs font-normal text-gray-500">kcal</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">总消耗 TDEE</div>
                    <div className="mt-1 text-xl font-bold text-gray-800">
                      {calculated.tdee || '—'}
                      <span className="ml-1 text-xs font-normal text-gray-500">kcal</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-[#7CB342] to-[#8BC34A] p-5 text-white">
                  <div className="text-sm opacity-80">每日目标热量</div>
                  <div className="mt-1 text-3xl font-bold">
                    {calculated.calories}
                    <span className="ml-2 text-base font-normal opacity-80">kcal</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--protein)' }} />
                      <span className="text-sm font-medium text-gray-700">蛋白质</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--protein)' }}>
                      {calculated.protein}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--carbs)' }} />
                      <span className="text-sm font-medium text-gray-700">碳水化合物</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--carbs)' }}>
                      {calculated.carbs}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--fat)' }} />
                      <span className="text-sm font-medium text-gray-700">脂肪</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--fat)' }}>
                      {calculated.fat}g
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calculator className="h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">点击上方按钮计算营养目标</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7CB342] px-5 py-3.5 font-semibold text-white shadow-lg shadow-[#7CB342]/25 transition-all hover:bg-[#689F38] hover:shadow-xl active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
