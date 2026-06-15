import { useState, useEffect, useMemo } from 'react';
import { Plus, X, MapPin, BookText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriftStore } from '@/stores/driftStore';
import { useBookStore } from '@/stores/bookStore';
import { useUserStore } from '@/stores/userStore';
import type { DriftRecord } from '@/types';
import DriftTimeline from './DriftTimeline';
import DriftMap from './DriftMap';

interface TimelineMapProps {
  bookId: string;
}

export default function TimelineMap({ bookId }: TimelineMapProps) {
  const { getRecordsByBook, fetchRecordsForBook, addManualRecord } = useDriftStore();
  const { getBookById } = useBookStore();
  const { user } = useUserStore();
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    toLocation: '',
    toLat: '',
    toLng: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const records = useMemo(() => getRecordsByBook(bookId), [bookId, getRecordsByBook]);
  const book = useMemo(() => getBookById(bookId), [bookId, getBookById]);

  useEffect(() => {
    void fetchRecordsForBook(bookId);
  }, [bookId, fetchRecordsForBook]);

  const handleSelectRecord = (record: DriftRecord) => {
    setSelectedRecordId(record.id === selectedRecordId ? undefined : record.id);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.toLocation.trim()) {
      errors.toLocation = '请输入地点名称';
    }
    if (!formData.toLat.trim()) {
      errors.toLat = '请输入纬度';
    } else if (isNaN(Number(formData.toLat)) || Number(formData.toLat) < -90 || Number(formData.toLat) > 90) {
      errors.toLat = '纬度范围 -90 到 90';
    }
    if (!formData.toLng.trim()) {
      errors.toLng = '请输入经度';
    } else if (isNaN(Number(formData.toLng)) || Number(formData.toLng) < -180 || Number(formData.toLng) > 180) {
      errors.toLng = '经度范围 -180 到 180';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setSubmitting(true);
    try {
      await addManualRecord(
        bookId,
        formData.toLocation.trim(),
        Number(formData.toLat),
        Number(formData.toLng),
        formData.note.trim(),
        user.name
      );
      setShowForm(false);
      setFormData({ toLocation: '', toLat: '', toLng: '', note: '' });
      setFormErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  const canAddRecord = records.length > 0 && book?.status === 'drifting';

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-oak-200 bg-cornsilk/60 shadow-card">
      <div className="flex items-center justify-between border-b-2 border-oak-200 bg-oak-100/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <BookText className="h-6 w-6 text-oak-600" />
          <h2 className="font-serif text-xl font-semibold text-oak-800">
            漂流轨迹
          </h2>
          <span className="rounded-full bg-oak-200 px-3 py-0.5 text-sm text-oak-700">
            {records.length} 个站点
          </span>
        </div>
        {canAddRecord && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-oak-500 px-4 py-2 text-sm font-medium text-cornsilk shadow-md transition-all hover:bg-oak-600 hover:shadow-lg active:scale-95"
          >
            <Plus className="h-4 w-4" />
            添加中转站
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-2/5 h-[400px] lg:h-auto border-b-2 lg:border-b-0 lg:border-r-2 border-oak-200">
          <DriftTimeline
            bookId={bookId}
            selectedRecordId={selectedRecordId}
            onSelectRecord={handleSelectRecord}
          />
        </div>

        <div className="w-full lg:w-3/5 h-[300px] lg:h-auto min-h-[300px] lg:min-h-[500px]">
          <DriftMap
            records={records}
            selectedRecordId={selectedRecordId}
            onSelectRecord={handleSelectRecord}
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md animate-fade-in-up rounded-2xl border-2 border-oak-300 bg-cornsilk shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-oak-200 px-6 py-4">
              <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-oak-800">
                <MapPin className="h-5 w-5 text-oak-500" />
                添加中转站记录
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormErrors({});
                }}
                className="rounded-lg p-1.5 text-oak-400 hover:bg-oak-100 hover:text-oak-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-oak-700">
                  地点名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.toLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, toLocation: e.target.value }))
                  }
                  placeholder="例如：北京咖啡馆"
                  className={cn(
                    'w-full rounded-lg border-2 bg-white px-4 py-2.5 text-oak-800 placeholder-oak-300 focus:outline-none focus:ring-2 focus:ring-oak-400/50 transition-all',
                    formErrors.toLocation
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-oak-200 focus:border-oak-400'
                  )}
                />
                {formErrors.toLocation && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.toLocation}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-oak-700">
                    纬度 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.toLat}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, toLat: e.target.value }))
                    }
                    placeholder="例如：39.9042"
                    className={cn(
                      'w-full rounded-lg border-2 bg-white px-4 py-2.5 text-oak-800 placeholder-oak-300 focus:outline-none focus:ring-2 focus:ring-oak-400/50 transition-all',
                      formErrors.toLat
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-oak-200 focus:border-oak-400'
                    )}
                  />
                  {formErrors.toLat && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.toLat}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-oak-700">
                    经度 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.toLng}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, toLng: e.target.value }))
                    }
                    placeholder="例如：116.4074"
                    className={cn(
                      'w-full rounded-lg border-2 bg-white px-4 py-2.5 text-oak-800 placeholder-oak-300 focus:outline-none focus:ring-2 focus:ring-oak-400/50 transition-all',
                      formErrors.toLng
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-oak-200 focus:border-oak-400'
                    )}
                  />
                  {formErrors.toLng && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.toLng}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-oak-700">
                  备注
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="记录漂流途中的故事..."
                  rows={3}
                  className="w-full resize-none rounded-lg border-2 border-oak-200 bg-white px-4 py-2.5 text-oak-800 placeholder-oak-300 focus:outline-none focus:ring-2 focus:ring-oak-400/50 focus:border-oak-400 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormErrors({});
                  }}
                  className="flex-1 rounded-lg border-2 border-oak-300 bg-white py-2.5 text-sm font-medium text-oak-600 transition-all hover:bg-oak-50 active:scale-95"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-oak-500 py-2.5 text-sm font-medium text-cornsilk shadow-md transition-all hover:bg-oak-600 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? '提交中...' : '提交记录'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
