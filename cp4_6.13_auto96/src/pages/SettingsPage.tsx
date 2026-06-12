import { useEffect, useState } from 'react';
import { useFoodStore } from '../store/useFoodStore';
import type { UserSettings } from '../types';
import styles from './SettingsPage.module.css';

type RatioKey = 'proteinRatio' | 'fatRatio' | 'carbRatio';

const ratioConfig: Record<RatioKey, { min: number; max: number; step: number; label: string; icon: string; color: string }> = {
  proteinRatio: { min: 10, max: 40, step: 5, label: '蛋白质', icon: '💪', color: '#e67e22' },
  fatRatio: { min: 20, max: 40, step: 5, label: '脂肪', icon: '🥑', color: '#8e44ad' },
  carbRatio: { min: 40, max: 60, step: 5, label: '碳水化合物', icon: '🍚', color: '#2d5a27' },
};

const goalConfig: Record<UserSettings['goalType'], { label: string; desc: string; icon: string }> = {
  muscle: { label: '增肌模式', desc: '高蛋白质摄入，帮助肌肉生长', icon: '🏋️' },
  fatLoss: { label: '减脂模式', desc: '控制热量，低碳水高蛋白', icon: '🔥' },
  balanced: { label: '均衡模式', desc: '均衡营养，维持健康体态', icon: '⚖️' },
};

const SliderWithLabel = ({
  value,
  min,
  max,
  step,
  onChange,
  color,
  label,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
  label: string;
  unit: string;
}) => {
  const [showFloat, setShowFloat] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.sliderWrapper}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue} style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div
        className={styles.sliderContainer}
        onMouseEnter={() => setShowFloat(true)}
        onMouseLeave={() => setShowFloat(false)}
      >
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderFill}
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`,
            }}
          />
        </div>
        <div
          className={`${styles.floatLabel} ${showFloat ? styles.floatVisible : ''}`}
          style={{ left: `${percent}%` }}
        >
          {value}
          {unit}
        </div>
        <input
          type="range"
          className={styles.sliderInput}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, #e0d8cc ${percent}%, #e0d8cc 100%)`,
          }}
        />
      </div>
      <div className={styles.sliderRange}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { settings, fetchSettings, updateSettings } = useFoodStore();
  const [localCalories, setLocalCalories] = useState(settings.dailyCalories);
  const [localProtein, setLocalProtein] = useState(settings.proteinRatio);
  const [localFat, setLocalFat] = useState(settings.fatRatio);
  const [localCarb, setLocalCarb] = useState(settings.carbRatio);
  const [localGoal, setLocalGoal] = useState<UserSettings['goalType']>(settings.goalType);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setLocalCalories(settings.dailyCalories);
    setLocalProtein(settings.proteinRatio);
    setLocalFat(settings.fatRatio);
    setLocalCarb(settings.carbRatio);
    setLocalGoal(settings.goalType);
  }, [settings]);

  const compensateRatios = (changedKey: RatioKey, newValue: number) => {
    const total = 100;
    const otherKeys = (Object.keys(ratioConfig) as RatioKey[]).filter((k) => k !== changedKey);
    const currentValues: Record<RatioKey, number> = {
      proteinRatio: localProtein,
      fatRatio: localFat,
      carbRatio: localCarb,
    };

    const clampedNewValue = Math.min(
      ratioConfig[changedKey].max,
      Math.max(ratioConfig[changedKey].min, newValue)
    );

    const otherTotal = total - clampedNewValue;
    const otherCurrentTotal = otherKeys.reduce((sum, k) => sum + currentValues[k], 0);

    const newValues: Record<RatioKey, number> = { ...currentValues, [changedKey]: clampedNewValue };

    if (otherCurrentTotal === 0) {
      const equalShare = otherTotal / otherKeys.length;
      otherKeys.forEach((k) => {
        newValues[k] = Math.round(equalShare / ratioConfig[k].step) * ratioConfig[k].step;
      });
    } else {
      otherKeys.forEach((k) => {
        const ratio = currentValues[k] / otherCurrentTotal;
        const raw = otherTotal * ratio;
        newValues[k] = Math.round(raw / ratioConfig[k].step) * ratioConfig[k].step;
      });
    }

    let actualTotal = Object.values(newValues).reduce((a, b) => a + b, 0);
    while (actualTotal !== total) {
      const diff = total - actualTotal;
      const sortedKeys = [...otherKeys].sort((a, b) => {
        const aConfig = ratioConfig[a];
        const bConfig = ratioConfig[b];
        if (diff > 0) {
          return bConfig.max - newValues[b] - (aConfig.max - newValues[a]);
        }
        return newValues[a] - aConfig.min - (newValues[b] - bConfig.min);
      });
      const keyToAdjust = sortedKeys[0];
      const step = ratioConfig[keyToAdjust].step * (diff > 0 ? 1 : -1);
      const newValueFor = newValues[keyToAdjust] + step;
      if (
        newValueFor >= ratioConfig[keyToAdjust].min &&
        newValueFor <= ratioConfig[keyToAdjust].max
      ) {
        newValues[keyToAdjust] = newValueFor;
      }
      actualTotal = Object.values(newValues).reduce((a, b) => a + b, 0);
      if (Math.abs(actualTotal - total) < 1) break;
    }

    setLocalProtein(newValues.proteinRatio);
    setLocalFat(newValues.fatRatio);
    setLocalCarb(newValues.carbRatio);
  };

  const handleRatioChange = (key: RatioKey, value: number) => {
    compensateRatios(key, value);
  };

  const handleGoalChange = (goal: UserSettings['goalType']) => {
    setLocalGoal(goal);
    switch (goal) {
      case 'muscle':
        setLocalProtein(35);
        setLocalFat(25);
        setLocalCarb(40);
        setLocalCalories(3000);
        break;
      case 'fatLoss':
        setLocalProtein(30);
        setLocalFat(25);
        setLocalCarb(45);
        setLocalCalories(2000);
        break;
      case 'balanced':
      default:
        setLocalProtein(20);
        setLocalFat(30);
        setLocalCarb(50);
        setLocalCalories(2500);
        break;
    }
  };

  const handleSave = async () => {
    await updateSettings({
      goalType: localGoal,
      dailyCalories: localCalories,
      proteinRatio: localProtein,
      fatRatio: localFat,
      carbRatio: localCarb,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalRatio = localProtein + localFat + localCarb;
  const isRatioValid = totalRatio === 100;

  const calorieGrams = {
    protein: Math.round((localCalories * (localProtein / 100)) / 4),
    fat: Math.round((localCalories * (localFat / 100)) / 9),
    carb: Math.round((localCalories * (localCarb / 100)) / 4),
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>营养设置</h1>
          <p className={styles.pageSubtitle}>自定义你的每日营养目标</p>
        </div>
      </header>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>🎯 营养目标模式</h2>
        <div className={styles.goalGrid}>
          {(Object.keys(goalConfig) as UserSettings['goalType'][]).map((goal) => {
            const cfg = goalConfig[goal];
            const isActive = localGoal === goal;
            return (
              <button
                key={goal}
                className={`${styles.goalCard} ${isActive ? styles.goalActive : ''}`}
                onClick={() => handleGoalChange(goal)}
              >
                <span className={styles.goalIcon}>{cfg.icon}</span>
                <span className={styles.goalLabel}>{cfg.label}</span>
                <span className={styles.goalDesc}>{cfg.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>🔥 每日热量摄入</h2>
          <span className={styles.calorieBadge}>{localCalories} kcal</span>
        </div>
        <SliderWithLabel
          value={localCalories}
          min={2000}
          max={3500}
          step={50}
          onChange={setLocalCalories}
          color="#e67e22"
          label="目标热量"
          unit=" kcal"
        />
        <p className={styles.hintText}>
          建议：成年女性 1800-2200 kcal，成年男性 2200-2800 kcal
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>📊 营养素比例分配</h2>
          <span
            className={`${styles.totalBadge} ${
              isRatioValid ? styles.totalValid : styles.totalInvalid
            }`}
          >
            {totalRatio}% / 100%
          </span>
        </div>

        <div className={styles.macroBar}>
          <div
            className={styles.macroSegment}
            style={{
              width: `${localProtein}%`,
              background: ratioConfig.proteinRatio.color,
            }}
            title={`蛋白质 ${localProtein}%`}
          />
          <div
            className={styles.macroSegment}
            style={{
              width: `${localFat}%`,
              background: ratioConfig.fatRatio.color,
            }}
            title={`脂肪 ${localFat}%`}
          />
          <div
            className={styles.macroSegment}
            style={{
              width: `${localCarb}%`,
              background: ratioConfig.carbRatio.color,
            }}
            title={`碳水 ${localCarb}%`}
          />
        </div>
        <div className={styles.macroLegend}>
          {(Object.keys(ratioConfig) as RatioKey[]).map((key) => {
            const cfg = ratioConfig[key];
            const val = key === 'proteinRatio' ? localProtein : key === 'fatRatio' ? localFat : localCarb;
            const grams = key === 'proteinRatio' ? calorieGrams.protein : key === 'fatRatio' ? calorieGrams.fat : calorieGrams.carb;
            return (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: cfg.color }} />
                <span className={styles.legendLabel}>{cfg.icon} {cfg.label}</span>
                <span className={styles.legendValue}>
                  {val}% ≈ {grams}g
                </span>
              </div>
            );
          })}
        </div>

        {(Object.keys(ratioConfig) as RatioKey[]).map((key) => {
          const cfg = ratioConfig[key];
          const val = key === 'proteinRatio' ? localProtein : key === 'fatRatio' ? localFat : localCarb;
          const handler = (v: number) => handleRatioChange(key, v);
          return (
            <SliderWithLabel
              key={key}
              value={val}
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              onChange={handler}
              color={cfg.color}
              label={`${cfg.icon} ${cfg.label}`}
              unit="%"
            />
          );
        })}
        <p className={styles.hintText}>
          调整任一滑块时，其他滑块会自动补偿以保持总和为 100%
        </p>
      </div>

      <div className={styles.saveBar}>
        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? '✓ 已保存' : '💾 保存设置'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
