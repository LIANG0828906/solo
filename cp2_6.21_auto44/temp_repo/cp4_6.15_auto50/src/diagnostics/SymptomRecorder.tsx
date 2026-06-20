import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  Stethoscope,
  Check,
  Droplets,
  Sun,
  Flower2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import { diagnose, getSymptomEmoji } from '@/diagnostics/DiagnosisEngine';
import type { SymptomType, MatchedCause, SeverityLevel } from '@/utils/db';
import RippleButton from '@/components/RippleButton';

const SYMPTOM_TYPES: SymptomType[] = ['叶片发黄', '枯萎', '虫害', '霉斑', '生长缓慢', '烂根'];

function Toggle({
  on,
  onToggle,
  label,
  icon,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200 ${
        on
          ? 'bg-olive-500 text-white shadow-md shadow-olive-500/20'
          : 'bg-olive-50 text-olive-500 hover:bg-olive-100'
      }`}
    >
      <span className={on ? 'text-white/90' : 'text-olive-400'}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <span
        className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center ${
          on ? 'bg-white/25' : 'bg-white border border-olive-200'
        }`}
      >
        <span
          className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 mx-0.5 ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function CareSlider({
  value,
  onChange,
  disabled,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  labels: [string, string, string];
}) {
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[10px] font-display text-olive-400">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={disabled ? 0 : value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="text-center text-xs font-display font-bold text-olive-500">
        {disabled ? '未记录' : `${value}%`}
      </div>
    </div>
  );
}

function getSeverityGradient(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return 'linear-gradient(to right, #FEF3C7 0%, #FDE68A 30%, #FCD34D 60%, #F59E0B 100%)';
    case 'moderate':
      return 'linear-gradient(to right, #FEF3C7 0%, #FCD34D 25%, #FB923C 60%, #F97316 100%)';
    case 'severe':
      return 'linear-gradient(to right, #FED7AA 0%, #FB923C 25%, #F87171 60%, #EF4444 100%)';
  }
}

function getSeverityLabel(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return '轻微警告';
    case 'moderate':
      return '中度风险';
    case 'severe':
      return '严重危险';
  }
}

function getSeverityColor(level: SeverityLevel): string {
  switch (level) {
    case 'mild':
      return '#F59E0B';
    case 'moderate':
      return '#F97316';
    case 'severe':
      return '#EF4444';
  }
}

function DiagnosisPanel({
  causes,
  onConfirm,
}: {
  causes: MatchedCause[];
  onConfirm: () => void;
}) {
  const topCauses = causes.slice(0, 3);

  return (
    <div className="mt-6 bg-white rounded-3xl shadow-[0_8px_30px_rgba(71,97,23,0.08)] border border-olive-100 overflow-hidden animate-scale-in">
      <div
        className="px-5 py-4 bg-gradient-to-r from-olive-50 via-cream-100 to-olive-50 border-b border-olive-100 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-olive-500 flex items-center justify-center shadow-md shadow-olive-500/20">
          <Stethoscope size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-bark-500">诊断结果</h3>
          <p className="text-xs text-olive-500">
            根据症状匹配出最可能的 {topCauses.length} 种病因
          </p>
        </div>
        <Sparkles size={18} className="ml-auto text-olive-400 animate-pulse" />
      </div>

      <div className="p-5 space-y-4">
        {topCauses.map((cause, i) => {
          const probPercent = Math.max(5, Math.round(cause.probability * 100));
          const rankColors = [
            'from-rose-100 to-rose-50 border-rose-200',
            'from-amber-100 to-amber-50 border-amber-200',
            'from-sky-100 to-sky-50 border-sky-200',
          ];
          const rankBadgeColors = [
            'bg-gradient-to-r from-rose-500 to-rose-400 text-white',
            'bg-gradient-to-r from-amber-500 to-amber-400 text-white',
            'bg-gradient-to-r from-sky-500 to-sky-400 text-white',
          ];
          return (
            <div
              key={i}
              className={`rounded-2xl p-4 border bg-gradient-to-br ${rankColors[i] || 'from-white to-white border-olive-100'} animate-float-up`}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs shadow-md ${rankBadgeColors[i] || 'bg-olive-500 text-white'}`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-body font-bold text-bark-500 text-base">
                    {cause.name}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className="font-display font-extrabold text-2xl leading-none"
                    style={{ color: getSeverityColor(cause.severity) }}
                  >
                    {probPercent}%
                  </div>
                  <div className="text-[10px] font-body text-olive-500 mt-0.5">匹配概率</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle
                      size={12}
                      style={{ color: getSeverityColor(cause.severity) }}
                    />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: getSeverityColor(cause.severity) }}
                    >
                      {getSeverityLabel(cause.severity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-display text-olive-400">
                    <span>轻微</span>
                    <span>→</span>
                    <span>严重</span>
                  </div>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden border border-olive-100 shadow-inner">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to right, #FDE68A 0%, #FCD34D 20%, #FB923C 50%, #F87171 80%, #EF4444 100%)',
                    }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 bg-white/50 backdrop-blur-[1px] transition-all duration-1000 ease-out"
                    style={{ width: `${100 - probPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md border-2 transition-all duration-1000 ease-out"
                    style={{
                      left: `calc(${probPercent}% - 10px)`,
                      borderColor: getSeverityColor(cause.severity),
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-display text-olive-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <p className="text-sm text-olive-600 mb-3 leading-relaxed bg-white/60 rounded-xl p-3 border border-olive-100/50">
                {cause.description}
              </p>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldCheck
                    size={13}
                    style={{ color: getSeverityColor(cause.severity) }}
                  />
                  <span className="text-[11px] font-display font-bold uppercase tracking-wider text-olive-500">
                    护理措施
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {cause.careMeasures.map((measure, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-bark-500 bg-white/50 rounded-lg px-3 py-2 border border-olive-100/30"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: getSeverityGradient(cause.severity) }}
                      >
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed">{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 bg-cream-50/80 border-t border-olive-100">
        <RippleButton variant="primary" size="lg" className="w-full" onClick={onConfirm}>
          <span className="flex items-center justify-center gap-2">
            <ShieldCheck size={18} />
            确认并归档到健康档案
          </span>
        </RippleButton>
      </div>
    </div>
  );
}

export default function SymptomRecorder() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const addSymptomRecord = usePlantStore((s) => s.addSymptomRecord);
  const addDiagnosisResult = usePlantStore((s) => s.addDiagnosisResult);
  const confirmDiagnosis = usePlantStore((s) => s.confirmDiagnosis);
  const plants = usePlantStore((s) => s.plants);

  const currentPlant = plants.find((p) => p.id === plantId);

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [occurredDate, setOccurredDate] = useState(new Date().toISOString().split('T')[0]);
  const [wateringOn, setWateringOn] = useState(true);
  const [wateringLevel, setWateringLevel] = useState(50);
  const [fertilizingOn, setFertilizingOn] = useState(false);
  const [fertilizingLevel, setFertilizingLevel] = useState(30);
  const [lightOn, setLightOn] = useState(true);
  const [lightLevel, setLightLevel] = useState(60);
  const [notes, setNotes] = useState('');
  const [diagnosisCauses, setDiagnosisCauses] = useState<MatchedCause[] | null>(null);
  const [currentDiagnosisId, setCurrentDiagnosisId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSymptom = (symptom: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleWatering = () => {
    if (wateringOn) {
      setWateringLevel(0);
    } else if (wateringLevel === 0) {
      setWateringLevel(50);
    }
    setWateringOn(!wateringOn);
  };

  const toggleFertilizing = () => {
    if (fertilizingOn) {
      setFertilizingLevel(0);
    } else if (fertilizingLevel === 0) {
      setFertilizingLevel(30);
    }
    setFertilizingOn(!fertilizingOn);
  };

  const toggleLight = () => {
    if (lightOn) {
      setLightLevel(0);
    } else if (lightLevel === 0) {
      setLightLevel(60);
    }
    setLightOn(!lightOn);
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0 || !plantId || isSubmitting) return;
    setIsSubmitting(true);

    const symptomRecordId = uuidv4();
    const record = {
      id: symptomRecordId,
      plantId,
      symptomTypes: selectedSymptoms,
      occurredDate,
      wateringLevel: wateringOn ? wateringLevel : 0,
      fertilizingLevel: fertilizingOn ? fertilizingLevel : 0,
      lightLevel: lightOn ? lightLevel : 0,
      notes,
      createdAt: new Date().toISOString(),
    };

    addSymptomRecord(record);

    const causes = diagnose(record);
    const savedDiagnosis = addDiagnosisResult({
      symptomRecordId,
      plantId,
      causes,
      createdAt: new Date().toISOString(),
      confirmed: false,
    });
    await new Promise((r) => setTimeout(r, 400));
    setCurrentDiagnosisId(savedDiagnosis.id);
    setDiagnosisCauses(causes.length > 0 ? causes : null);
    setIsSubmitting(false);
  };

  const handleConfirm = () => {
    if (currentDiagnosisId) {
      confirmDiagnosis(currentDiagnosisId);
    }
    navigate(`/plant/${plantId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-olive-50 transition"
          >
            <ArrowLeft size={20} className="text-olive-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl text-bark-500">记录症状</h1>
            {currentPlant && (
              <p className="text-xs text-olive-500">
                {currentPlant.name} · {currentPlant.location}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-3xl p-5 shadow-sm border border-olive-100">
          <h2 className="font-display font-bold text-base text-olive-600 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-olive-500 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            选择症状类型
            <span className="ml-auto text-xs font-normal text-olive-400">
              已选 {selectedSymptoms.length} 项
            </span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SYMPTOM_TYPES.map((symptom) => {
              const selected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-2xl p-4 border-2 transition-all duration-200 text-center group ${
                    selected
                      ? 'border-olive-500 bg-gradient-to-br from-olive-50 to-cream-50 shadow-[0_6px_20px_rgba(107,142,35,0.15)] scale-[1.02]'
                      : 'border-olive-100 bg-white hover:border-olive-200 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <span
                    className={`text-3xl block mb-1 transition-transform duration-200 ${selected ? 'scale-110' : 'group-hover:scale-110'}`}
                  >
                    {getSymptomEmoji(symptom)}
                  </span>
                  <span
                    className={`text-sm font-body mt-1 block font-medium ${selected ? 'text-olive-700' : 'text-bark-500'}`}
                  >
                    {symptom}
                  </span>
                  {selected && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-display font-bold bg-olive-500 text-white px-2 py-0.5 rounded-full">
                      <Check size={9} />
                      已选
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-3xl p-5 shadow-sm border border-olive-100">
          <h2 className="font-display font-bold text-base text-olive-600 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-olive-500 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            发病情况
          </h2>
          <div>
            <label className="text-xs font-display font-bold text-olive-500 block mb-1.5">
              症状出现日期
            </label>
            <input
              type="date"
              value={occurredDate}
              onChange={(e) => setOccurredDate(e.target.value)}
              className="w-full rounded-2xl border border-olive-200 bg-white px-4 py-3 text-sm font-body text-bark-500 focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300 transition-all"
            />
          </div>
        </div>

        <div className="mb-6 bg-white rounded-3xl p-5 shadow-sm border border-olive-100 space-y-5">
          <h2 className="font-display font-bold text-base text-olive-600 mb-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-olive-500 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            近期养护情况
            <span className="ml-auto text-xs font-normal text-olive-400">
              打开开关后可调整程度
            </span>
          </h2>

          <div className="rounded-2xl bg-cream-50/80 border border-olive-100 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                  <Droplets size={18} className="text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-bark-500">浇水情况</p>
                  <p className="text-[11px] text-olive-400">近期浇水频率</p>
                </div>
              </div>
              <Toggle
                on={wateringOn}
                onToggle={toggleWatering}
                label={wateringOn ? '已记录' : '跳过'}
                icon={<Droplets size={12} />}
              />
            </div>
            <CareSlider
              value={wateringLevel}
              onChange={setWateringLevel}
              disabled={!wateringOn}
              labels={['很少', '适中', '很多']}
            />
          </div>

          <div className="rounded-2xl bg-cream-50/80 border border-olive-100 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Flower2 size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-bark-500">施肥情况</p>
                  <p className="text-[11px] text-olive-400">近期施肥频率</p>
                </div>
              </div>
              <Toggle
                on={fertilizingOn}
                onToggle={toggleFertilizing}
                label={fertilizingOn ? '已记录' : '跳过'}
                icon={<Flower2 size={12} />}
              />
            </div>
            <CareSlider
              value={fertilizingLevel}
              onChange={setFertilizingLevel}
              disabled={!fertilizingOn}
              labels={['无', '适中', '过量']}
            />
          </div>

          <div className="rounded-2xl bg-cream-50/80 border border-olive-100 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Sun size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-bark-500">光照情况</p>
                  <p className="text-[11px] text-olive-400">每天接收光照程度</p>
                </div>
              </div>
              <Toggle
                on={lightOn}
                onToggle={toggleLight}
                label={lightOn ? '已记录' : '跳过'}
                icon={<Sun size={12} />}
              />
            </div>
            <CareSlider
              value={lightLevel}
              onChange={setLightLevel}
              disabled={!lightOn}
              labels={['阴暗', '散射光', '强光']}
            />
          </div>
        </div>

        <div className="mb-6 bg-white rounded-3xl p-5 shadow-sm border border-olive-100">
          <h2 className="font-display font-bold text-base text-olive-600 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-olive-500 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            其他备注
          </h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-2xl border border-olive-200 bg-white px-4 py-3 text-sm font-body text-bark-500 focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300 transition-all resize-none placeholder:text-olive-300"
            placeholder="描述植物的其他状况、环境变化、可疑原因等（可选）..."
          />
        </div>

        {!diagnosisCauses && (
          <div className="sticky bottom-4 bg-gradient-to-t from-cream-50 via-cream-50 to-transparent pt-6 -mx-4 px-4 pb-4">
            <RippleButton
              variant="primary"
              size="lg"
              className="w-full shadow-xl shadow-olive-500/20"
              onClick={handleSubmit}
              disabled={selectedSymptoms.length === 0 || isSubmitting}
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    正在诊断...
                  </>
                ) : (
                  <>
                    <Stethoscope size={18} />
                    提交诊断
                    {selectedSymptoms.length > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {selectedSymptoms.length} 项症状
                      </span>
                    )}
                  </>
                )}
              </span>
            </RippleButton>
          </div>
        )}

        {diagnosisCauses && <DiagnosisPanel causes={diagnosisCauses} onConfirm={handleConfirm} />}
      </div>
    </div>
  );
}
