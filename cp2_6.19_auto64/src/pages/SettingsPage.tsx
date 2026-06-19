import { useState } from 'react';
import { Settings, Bell, Clock, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useSettings, useStore, useProducts, useUsageLogs } from '@/store/useStore';
import { useNotification } from '@/hooks/useNotification';

export const SettingsPage = () => {
  const settings = useSettings();
  const updateSettings = useStore((state) => state.updateSettings);
  const products = useProducts();
  const usageLogs = useUsageLogs();
  const clearAllData = useStore((state) => {
    state.products = [];
    state.usageLogs = [];
  });

  const { requestPermission, permission, isSupported } = useNotification();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ reminderTime: e.target.value });
  };

  const handleEnableNotification = async () => {
    const perm = await requestPermission();
    if (perm === 'granted') {
      updateSettings({ notificationEnabled: true });
    }
  };

  const handleDisableNotification = () => {
    updateSettings({ notificationEnabled: false });
  };

  const handleClearData = () => {
    localStorage.removeItem('skincare-inventory-storage');
    window.location.reload();
  };

  const exportData = () => {
    const data = {
      products,
      usageLogs,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skincare-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">设置</h1>
        <p className="text-gray-500">管理应用偏好和通知设置</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">每日提醒</h3>
              <p className="text-sm text-gray-500">设置提醒时间记录使用进度</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">启用提醒</p>
                <p className="text-sm text-gray-500">每日定时发送护肤提醒</p>
              </div>
              {settings.notificationEnabled ? (
                <button
                  onClick={handleDisableNotification}
                  className="px-4 py-2 bg-warning/10 text-warning rounded-xl font-medium hover:bg-warning/20 transition-colors"
                >
                  关闭
                </button>
              ) : (
                <button
                  onClick={handleEnableNotification}
                  disabled={!isSupported || permission === 'denied'}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {permission === 'denied' ? '已被阻止' : '开启'}
                </button>
              )}
            </div>

            {!isSupported && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-warning">您的浏览器不支持通知功能</p>
              </div>
            )}

            {permission === 'denied' && isSupported && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-warning">
                  通知权限已被阻止，请在浏览器设置中手动开启
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                提醒时间
              </label>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={handleTimeChange}
                disabled={!settings.notificationEnabled}
                className="w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-2">
                到达设定时间时，将弹出通知提醒您记录今日使用进度
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">数据管理</h3>
              <p className="text-sm text-gray-500">导出或清除您的数据</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-700">产品数量</p>
                <p className="text-2xl font-bold text-primary">{products.length}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">使用记录</p>
                <p className="text-2xl font-bold text-primary">{usageLogs.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={exportData}
                className="py-3 px-4 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                导出数据
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="py-3 px-4 bg-warning/10 text-warning rounded-xl font-medium hover:bg-warning/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清除所有数据
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">关于</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <p>护肤管家 v1.0.0</p>
            <p>帮助您科学管理护肤品库存，追踪使用进度，避免过期浪费。</p>
            <p className="text-gray-400">数据保存在本地浏览器中，不会上传到任何服务器。</p>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 animate-scaleIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认清除</h3>
            <p className="text-gray-600 mb-6">
              确定要清除所有数据吗？此操作将删除所有产品和使用记录，且不可恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-2.5 rounded-xl bg-warning text-white font-medium hover:bg-warning/90 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
