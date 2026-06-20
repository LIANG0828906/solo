import { useState, useEffect, useRef, useCallback } from 'react';
import { Mountain, DoorOpen, Ban, Flower2 } from 'lucide-react';
import {
  DEFAULT_PREFERENCES,
  DESK_ORIENTATION_OPTIONS,
  PLANT_OPTIONS,
  SNACK_OPTIONS,
  LIGHT_OPTIONS,
  REST_OPTIONS,
  type UserPreferences,
} from '@/types';
import { useAppStore } from '@/store';
import { submitPreference } from '@/utils/api';

interface Props {
  onSaved?: () => void;
}

export default function PreferenceForm({ onSaved }: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const preferences = useAppStore((s) => s.preferences);
  const addOrUpdate = useAppStore((s) => s.addOrUpdatePreference);

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [toast, setToast] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const existing = preferences.find((r) => r.userId === currentUser.id);
    if (existing) {
      setPrefs(existing.preferences);
    }
  }, [currentUser, preferences]);

  const triggerSave = useCallback(async (next: UserPreferences) => {
    if (!currentUser) return;
    try {
      const record = await submitPreference({
        userId: currentUser.id,
        preferences: next,
      });
      addOrUpdate(record);
      showToast();
      onSaved?.();
    } catch (err) {
      console.error('保存失败', err);
    }
  }, [currentUser, addOrUpdate, onSaved]);

  const debouncedSave = useCallback((next: UserPreferences) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => triggerSave(next), 300);
  }, [triggerSave]);

  const showToast = () => {
    setToastFading(false);
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastFading(true);
      setTimeout(() => setToast(false), 500);
    }, 500);
  };

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    debouncedSave(next);
  };

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toastFading ? 'fade-out' : ''}`}>✓ 已保存</div>
        </div>
      )}

      <div className="pref-form">
        {/* 1. 工位朝向 */}
        <div className="pref-card">
          <div className="pref-card-title">🧭 工位朝向</div>
          <select
            className="pref-select"
            value={prefs.deskOrientation}
            onChange={(e) => updatePref('deskOrientation', e.target.value as UserPreferences['deskOrientation'])}
          >
            {DESK_ORIENTATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 2. 空调温度 */}
        <div className="pref-card">
          <div className="pref-card-title">🌡️ 空调温度</div>
          <div className="slider-wrap">
            <div className="slider-value">
              <span>温度偏好</span>
              <span>{prefs.temperature} ℃</span>
            </div>
            <input
              className="slider"
              type="range"
              min={16}
              max={30}
              step={1}
              value={prefs.temperature}
              onChange={(e) => updatePref('temperature', Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>16℃ 冷</span>
              <span>24℃ 适中</span>
              <span>30℃ 暖</span>
            </div>
          </div>
        </div>

        {/* 3. 屏幕亮度 */}
        <div className="pref-card">
          <div className="pref-card-title">💻 屏幕亮度</div>
          <div className="slider-wrap">
            <div className="slider-value">
              <span>亮度偏好</span>
              <span>{prefs.screenBrightness} %</span>
            </div>
            <input
              className="slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={prefs.screenBrightness}
              onChange={(e) => updatePref('screenBrightness', Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>0% 暗</span>
              <span>50% 适中</span>
              <span>100% 亮</span>
            </div>
          </div>
        </div>

        {/* 4. 植物偏好 */}
        <div className="pref-card">
          <div className="pref-card-title">🪴 植物偏好</div>
          <div className="radio-group">
            {PLANT_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-item">
                <input
                  type="radio"
                  name="plant"
                  value={opt.value}
                  checked={prefs.plantPreference === opt.value}
                  onChange={() => updatePref('plantPreference', opt.value)}
                />
                <div className="radio-item-inner">
                  <span className="emoji">{opt.emoji}</span>
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 5. 零食口味 */}
        <div className="pref-card">
          <div className="pref-card-title">🍬 零食口味</div>
          <div className="radio-group">
            {SNACK_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-item">
                <input
                  type="radio"
                  name="snack"
                  value={opt.value}
                  checked={prefs.snackFlavor === opt.value}
                  onChange={() => updatePref('snackFlavor', opt.value)}
                />
                <div className="radio-item-inner">
                  <span className="emoji">{opt.emoji}</span>
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 6. 噪音容忍度 */}
        <div className="pref-card">
          <div className="pref-card-title">🔊 噪音容忍度</div>
          <div className="slider-wrap">
            <div className="slider-value">
              <span>容忍水平</span>
              <span>{prefs.noiseTolerance} / 7</span>
            </div>
            <input
              className="slider"
              type="range"
              min={1}
              max={7}
              step={1}
              value={prefs.noiseTolerance}
              onChange={(e) => updatePref('noiseTolerance', Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>1 安静</span>
              <span>4 适中</span>
              <span>7 吵闹</span>
            </div>
          </div>
        </div>

        {/* 7. 灯光类型 */}
        <div className="pref-card">
          <div className="pref-card-title">💡 灯光类型</div>
          <div className="light-group">
            {LIGHT_OPTIONS.map((opt) => (
              <label key={opt.value} className="light-item">
                <input
                  type="radio"
                  name="light"
                  value={opt.value}
                  checked={prefs.lightType === opt.value}
                  onChange={() => updatePref('lightType', opt.value)}
                />
                <div className="light-item-inner">
                  <div
                    className="light-color-box"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 8. 休息偏好 */}
        <div className="pref-card">
          <div className="pref-card-title">☕ 休息偏好</div>
          <div className="rest-group">
            {REST_OPTIONS.map((opt) => {
              const Icon =
                opt.value === 'window' ? Flower2 :
                opt.value === 'door'   ? DoorOpen : Ban;
              return (
                <label key={opt.value} className="rest-item">
                  <input
                    type="radio"
                    name="rest"
                    value={opt.value}
                    checked={prefs.restPreference === opt.value}
                    onChange={() => updatePref('restPreference', opt.value)}
                  />
                  <div className="rest-card">
                    <Icon className="icon" strokeWidth={1.8} />
                    {opt.label}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
