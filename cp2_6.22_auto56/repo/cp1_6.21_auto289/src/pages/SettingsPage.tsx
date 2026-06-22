import { useState, useEffect } from 'react';
import { User, DollarSign, Image, Save, Upload } from 'lucide-react';
import { getSettings, updateSettings } from '@/api/settingsApi';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Settings } from '../../shared/types';

export default function SettingsPage() {
  const { setSettings, ...settings } = useSettingsStore();
  const [formData, setFormData] = useState({
    userName: '',
    hourlyRate: 50,
    logoData: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setFormData({
        userName: data.userName,
        hourlyRate: data.hourlyRate,
        logoData: data.logoData,
      });
      setSettings(data);
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo图片大小不能超过2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData({ ...formData, logoData: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.userName.trim()) {
      alert('请输入用户名称');
      return;
    }
    if (formData.hourlyRate <= 0) {
      alert('小时费率必须大于0');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSettings({
        userName: formData.userName,
        hourlyRate: formData.hourlyRate,
        logoData: formData.logoData,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('保存设置失败:', e);
      alert('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">设置</h1>
        <p className="text-gray-500 mt-1">个性化你的工时小簿</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">个人信息</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <label className="block cursor-pointer group">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500
                              flex items-center justify-center overflow-hidden
                              group-hover:opacity-90 transition-opacity">
                  {formData.logoData ? (
                    <img 
                      src={formData.logoData} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {formData.userName?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500
                              group-hover:text-primary-600 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  上传Logo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4" />
                  用户名称
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="请输入你的名称"
                  className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  小时费率 (¥/小时)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    placeholder="50.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                             focus:border-primary-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">用于生成发票时计算金额</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: saved ? '#10B981' : '#6366F1' }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium
                     transition-all hover:opacity-90 active:scale-[0.95]
                     disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saved ? '已保存' : saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">关于</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500
                          flex items-center justify-center">
              <span className="text-white font-bold">时</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">工时小簿 快照版</h4>
              <p className="text-sm text-gray-500">版本 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            工时小簿是一款轻量级的工时追踪工具，帮助自由职业者和远程工作者
            高效记录工作时间，生成专业发票，让账单管理更简单。
          </p>
        </div>
      </div>
    </div>
  );
}
