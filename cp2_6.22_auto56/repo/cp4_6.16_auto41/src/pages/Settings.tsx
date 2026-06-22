import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Target, Database, Trash2, Award, Check, RefreshCw } from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import ProgressRing from '@/components/common/ProgressRing';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatNumber } from '@/utils/calculations';

const PRESET_TARGETS = [50, 80, 100, 150, 200, 300];

const Settings = () => {
  const {
    userSettings,
    targetProgress,
    monthEmission,
    achievements,
    setMonthlyTarget,
    clearAllData,
    regenerateSuggestions,
    loadMockData,
    activities,
  } = useCarbonStore();

  const [targetInput, setTargetInput] = useState(String(userSettings.monthlyTarget));
  const [saving, setSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setTargetInput(String(userSettings.monthlyTarget));
  }, [userSettings.monthlyTarget]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveTarget = async () => {
    const v = parseFloat(targetInput);
    if (isNaN(v) || v <= 0) {
      showToast('请输入有效的目标值');
      return;
    }
    setSaving(true);
    await setMonthlyTarget(v);
    setTimeout(() => {
      setSaving(false);
      showToast('目标已更新');
    }, 300);
  };

  const handlePreset = (v: number) => {
    setTargetInput(String(v));
  };

  const handleClearData = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    showToast('数据已清除');
  };

  const handleRegenerate = () => {
    regenerateSuggestions();
    showToast('建议已重新生成');
  };

  const totalSaved = achievements.reduce(
    (s, a) => s + a.potentialSaving,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          设置
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          自定义您的减排目标和偏好设置
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">月度减排目标</h3>
            <p className="text-xs text-gray-500">
              设定本月的碳排放上限，系统将自动追踪完成进度
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标值 (kg CO₂ / 月)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="input-field max-w-[200px] text-xl font-bold"
                />
                <button
                  onClick={handleSaveTarget}
                  disabled={saving || targetInput === String(userSettings.monthlyTarget)}
                  className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                建议范围：一般成年人月均碳排放约 100-200 kg，建议设定一个具有挑战性但可实现的目标
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">快速选择</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_TARGETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => handlePreset(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      targetInput === String(v)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {v} kg
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 bg-gray-50 border border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">本月已排放</div>
                  <div className="text-lg font-bold text-gray-800 tabular-nums">
                    {formatNumber(monthEmission, 1)}
                    <span className="text-sm font-normal text-gray-500 ml-1">kg</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">剩余额度</div>
                  <div
                    className={`text-lg font-bold tabular-nums ${
                      userSettings.monthlyTarget - monthEmission < 0
                        ? 'text-danger-500'
                        : 'text-primary-700'
                    }`}
                  >
                    {formatNumber(
                      Math.max(0, userSettings.monthlyTarget - monthEmission),
                      1,
                    )}
                    <span className="text-sm font-normal text-gray-500 ml-1">kg</span>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs text-gray-500 mb-0.5">活动记录数</div>
                  <div className="text-lg font-bold text-gray-800 tabular-nums">
                    {activities.length}
                    <span className="text-sm font-normal text-gray-500 ml-1">条</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 text-white shadow-lg">
              <ProgressRing
                progress={targetProgress}
                size={160}
                strokeWidth={12}
                label="目标完成度"
                fontSize={34}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">我的成就</h3>
            <p className="text-xs text-gray-500">
              已采纳 {achievements.length} 条减排建议 · 累计预计减少{' '}
              <span className="font-semibold text-primary-700">
                {formatNumber(totalSaved, 1)} kg
              </span>{' '}
              CO₂
            </p>
          </div>
        </div>

        {achievements.length === 0 ? (
          <div className="rounded-xl p-8 border-2 border-dashed border-gray-100 text-center">
            <div className="text-4xl mb-3 opacity-40">🌟</div>
            <h4 className="font-medium text-gray-700 mb-1">还没有成就</h4>
            <p className="text-sm text-gray-500">
              前往仪表盘采纳减排建议，开始积累您的环保成就吧！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-primary-50/50 border border-primary-100"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                  ✅
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-800 text-sm truncate">
                    {a.title}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {format(new Date(a.adoptedAt), 'MM月dd日 HH:mm', {
                        locale: zhCN,
                      })}
                    </span>
                    <span className="text-xs font-semibold text-primary-700 whitespace-nowrap">
                      -{formatNumber(a.potentialSaving, 1)} kg / 周
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">数据管理</h3>
            <p className="text-xs text-gray-500">
              所有数据存储在本地浏览器（IndexedDB），不会上传到服务器
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadMockData()}
            className="btn-secondary flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            加载示例数据
          </button>
          <button
            onClick={handleRegenerate}
            className="btn-secondary flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            重新生成建议
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn-danger flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            清除所有数据
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-50 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-danger-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                清除所有数据？
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                此操作将删除所有活动记录、设置、成就和建议历史。
                <br />
                <span className="font-medium text-danger-500">
                  此操作无法撤销！
                </span>
              </p>
            </div>
            <div className="px-6 pb-6 flex items-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 btn-danger"
                autoFocus
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-5 py-3 rounded-xl bg-gray-900 text-white shadow-2xl flex items-center gap-2">
            <Check className="w-4 h-4 text-primary-300" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
