import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getConfig, updateConfig } from '../../api';
import Skeleton from '../../components/Skeleton';
import type { LibraryConfig } from '../../types';

export default function OverdueConfig() {
  const [config, setConfig] = useState<LibraryConfig>({
    maxBorrowCount: 5,
    loanDays: 14,
    lateFeePerDay: 0.5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((data) => data && setConfig(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateConfig(config);
      if (res.success) {
        setToast({ type: 'success', msg: '配置已保存' });
      } else {
        setToast({ type: 'error', msg: '保存失败' });
      }
    } catch {
      setToast({ type: 'error', msg: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary/30 shadow-sm p-6">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'maxBorrowCount' as const, label: '最大借阅数量', desc: '每位读者最多可借阅的图书数量', unit: '本' },
    { key: 'loanDays' as const, label: '借阅天数', desc: '默认借阅天数', unit: '天' },
    { key: 'lateFeePerDay' as const, label: '逾期费率', desc: '每天逾期费用', unit: '元/天' },
  ];

  return (
    <div className="bg-white rounded-xl border border-secondary/30 shadow-sm">
      <div className="p-4 border-b border-secondary/30">
        <h2 className="text-lg font-bold text-accent">逾期规则配置</h2>
      </div>

      {toast && (
        <div
          className={`mx-4 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.type === 'success' ? 'toast-success' : 'toast-error'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="p-4 space-y-5">
        {fields.map(({ key, label, desc, unit }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <p className="text-xs text-gray-400 mb-2">{desc}</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={key === 'lateFeePerDay' ? 0.1 : 1}
                step={key === 'lateFeePerDay' ? 0.1 : 1}
                value={config[key]}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
                }
                className="w-32 px-4 py-2.5 rounded-lg border border-secondary/60 bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-press flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}
