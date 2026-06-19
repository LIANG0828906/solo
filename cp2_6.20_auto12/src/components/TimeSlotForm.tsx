import { memo } from 'react';
import { X, Plus, Clock, Calendar } from 'lucide-react';

export interface TimeSlotInput {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotFormProps {
  slots: TimeSlotInput[];
  onChange: (slots: TimeSlotInput[]) => void;
}

const TimeSlotForm = memo(function TimeSlotForm({
  slots,
  onChange,
}: TimeSlotFormProps) {
  const addSlot = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    onChange([
      ...slots,
      {
        id: `slot_${Date.now()}`,
        date: today,
        startTime: '09:00',
        endTime: '11:00',
      },
    ]);
  };

  const removeSlot = (id: string) => {
    onChange(slots.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: keyof TimeSlotInput, value: string) => {
    onChange(
      slots.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          <span className="text-sm font-medium text-dark-200">候选时间段</span>
          <span className="text-xs text-dark-500">({slots.length} 个)</span>
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-600/10 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          添加时段
        </button>
      </div>

      <div className="space-y-3">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg border border-dark-700 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-medium">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-dark-500 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    日期
                  </label>
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => updateSlot(slot.id, 'date', e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    开始
                  </label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.id, 'startTime', e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-500 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    结束
                  </label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.id, 'endTime', e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeSlot(slot.id)}
              disabled={slots.length <= 1}
              className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-8 text-dark-500 border-2 border-dashed border-dark-700 rounded-lg">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">点击上方按钮添加候选时间段</p>
        </div>
      )}
    </div>
  );
});

export default TimeSlotForm;
