import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  const minDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  }, []);

  const daysRemaining = useMemo(() => {
    if (!value) return null;
    const target = new Date(value);
    if (isNaN(target.getTime())) return null;
    return differenceInCalendarDays(target, new Date());
  }, [value]);

  const formattedDate = useMemo(() => {
    if (!value) return null;
    return format(new Date(value), 'yyyy年M月d日 HH:mm', { locale: zhCN });
  }, [value]);

  return (
    <div className="date-picker-wrapper">
      <input
        type="datetime-local"
        className="form-input"
        min={minDateTime}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && daysRemaining !== null && (
        <div className="date-info">
          {formattedDate} · {daysRemaining > 0 ? `距离开启还有 ${daysRemaining} 天` : daysRemaining === 0 ? '今天即可开启' : '已可开启'}
        </div>
      )}
      <input type="hidden" name="min-date" value={today} />
    </div>
  );
}
