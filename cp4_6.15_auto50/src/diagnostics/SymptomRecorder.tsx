import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Stethoscope, Check } from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import { diagnose, getSymptomEmoji } from '@/diagnostics/DiagnosisEngine';
import type { SymptomType, MatchedCause } from '@/utils/db';
import RippleButton from '@/components/RippleButton';

const SYMPTOM_TYPES: SymptomType[] = ['叶片发黄', '枯萎', '虫害', '霉斑', '生长缓慢', '烂根'];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors ${on ? 'bg-olive-500' : 'bg-olive-100'}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

function Slider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={10}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-olive-500 disabled:opacity-40 disabled:cursor-not-allowed bg-olive-100"
    />
  );
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
    <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-olive-100">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={20} className="text-olive-500" />
        <h3 className="font-display font-bold text-lg">诊断结果</h3>
      </div>

      <div className="space-y-4">
        {topCauses.map((cause, i) => (
          <div key={i} className="border border-olive-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body font-medium">{cause.name}</span>
              <span className="font-display font-bold text-olive-500">
                {Math.round(cause.probability * 100)}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-olive-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${cause.probability * 100}%`,
                  background: `linear-gradient(to right, #F59E0B, #F97316, #EF4444)`,
                }}
              />
            </div>

            <p className="text-sm text-olive-600 mb-2">{cause.description}</p>

            <ul className="space-y-1">
              {cause.careMeasures.map((measure, j) => (
                <li key={j} className="flex items-start gap-1.5 text-sm text-olive-500">
                  <Check size={14} className="mt-0.5 shrink-0 text-olive-400" />
                  {measure}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <RippleButton variant="primary" size="lg" className="w-full" onClick={onConfirm}>
          确认并归档
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

  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [occurredDate, setOccurredDate] = useState(new Date().toISOString().split('T')[0]);
  const [wateringOn, setWateringOn] = useState(true);
  const [wateringLevel, setWateringLevel] = useState(50);
  const [fertilizingOn, setFertilizingOn] = useState(true);
  const [fertilizingLevel, setFertilizingLevel] = useState(50);
  const [lightOn, setLightOn] = useState(true);
  const [lightLevel, setLightLevel] = useState(50);
  const [notes, setNotes] = useState('');
  const [diagnosisCauses, setDiagnosisCauses] = useState<MatchedCause[] | null>(null);
  const [currentDiagnosisId, setCurrentDiagnosisId] = useState<string | null>(null);
  const [currentSymptomRecordId, setCurrentSymptomRecordId] = useState<string | null>(null);

  const toggleSymptom = (symptom: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0 || !plantId) return;

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
    const diagnosisId = uuidv4();
    addDiagnosisResult({
      id: diagnosisId,
      symptomRecordId,
      plantId,
      causes,
      createdAt: new Date().toISOString(),
      confirmed: false,
    });

    setCurrentDiagnosisId(diagnosisId);
    setCurrentSymptomRecordId(symptomRecordId);
    setDiagnosisCauses(causes);
  };

  const handleConfirm = () => {
    if (currentDiagnosisId) {
      confirmDiagnosis(currentDiagnosisId);
    }
    navigate(`/plant/${plantId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-olive-50 transition"
          >
            <ArrowLeft size={20} className="text-olive-600" />
          </button>
          <h1 className="font-display font-bold text-xl">记录症状</h1>
        </div>

        <div className="mb-6">
          <h2 className="font-display font-bold text-sm text-olive-600 mb-3">症状类型</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SYMPTOM_TYPES.map((symptom) => {
              const selected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-xl p-4 border-2 transition-all cursor-pointer text-center ${
                    selected
                      ? 'border-olive-500 bg-olive-50 shadow-md'
                      : 'border-olive-100 bg-white hover:border-olive-200'
                  }`}
                >
                  <span className="text-2xl block">{getSymptomEmoji(symptom)}</span>
                  <span className="text-sm font-body mt-1 block">{symptom}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-display font-bold text-sm text-olive-600 mb-3">发生日期</h2>
          <input
            type="date"
            value={occurredDate}
            onChange={(e) => setOccurredDate(e.target.value)}
            className="w-full rounded-xl border border-olive-100 bg-white px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300 transition"
          />
        </div>

        <div className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-olive-100 space-y-5">
          <h2 className="font-display font-bold text-sm text-olive-600">养护状况</h2>

          <div className="flex items-center gap-4">
            <span className="text-sm font-body w-20 shrink-0">浇水情况</span>
            <Toggle on={wateringOn} onToggle={() => setWateringOn(!wateringOn)} />
            <Slider
              value={wateringLevel}
              onChange={setWateringLevel}
              disabled={!wateringOn}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-body w-20 shrink-0">施肥情况</span>
            <Toggle on={fertilizingOn} onToggle={() => setFertilizingOn(!fertilizingOn)} />
            <Slider
              value={fertilizingLevel}
              onChange={setFertilizingLevel}
              disabled={!fertilizingOn}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-body w-20 shrink-0">光照情况</span>
            <Toggle on={lightOn} onToggle={() => setLightOn(!lightOn)} />
            <Slider
              value={lightLevel}
              onChange={setLightLevel}
              disabled={!lightOn}
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-display font-bold text-sm text-olive-600 mb-3">备注</h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-olive-100 bg-white px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300 transition resize-none"
            placeholder="描述植物的其他状况..."
          />
        </div>

        {!diagnosisCauses && (
          <RippleButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={selectedSymptoms.length === 0}
          >
            提交诊断
          </RippleButton>
        )}

        {diagnosisCauses && (
          <DiagnosisPanel causes={diagnosisCauses} onConfirm={handleConfirm} />
        )}
      </div>
    </div>
  );
}
