import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SKILLS, ATTRIBUTE_RANGES } from '@/data/RaceData';
import type { RaceAttributes } from '@/data/RaceData';

type AttrKey = keyof RaceAttributes;

const DERIVED_AXES = [
  { label: '魔力', calc: (a: RaceAttributes) => a.attack * 0.5 + a.defense * 0.3, max: 65 },
  { label: '韧性', calc: (a: RaceAttributes) => a.hp * 0.2 + a.defense * 0.8, max: 80 },
];

const AXES = [
  { key: 'hp' as AttrKey, label: ATTRIBUTE_RANGES.hp.label, max: ATTRIBUTE_RANGES.hp.max },
  { key: 'attack' as AttrKey, label: ATTRIBUTE_RANGES.attack.label, max: ATTRIBUTE_RANGES.attack.max },
  { key: 'defense' as AttrKey, label: ATTRIBUTE_RANGES.defense.label, max: ATTRIBUTE_RANGES.defense.max },
  { key: 'speed' as AttrKey, label: ATTRIBUTE_RANGES.speed.label, max: ATTRIBUTE_RANGES.speed.max },
  ...DERIVED_AXES.map((d) => ({ key: null, label: d.label, max: d.max, calc: d.calc })),
];

function normalize(attr: RaceAttributes, i: number): number {
  const axis = AXES[i];
  const val = axis.calc ? axis.calc(attr) : attr[axis.key as AttrKey];
  return Math.min(1, Math.max(0, val / axis.max));
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  values: number[],
  from: string,
  to: string,
) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(cx, cy) - 36;
  const n = AXES.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, w, h);

  for (let ring = 1; ring <= 4; ring++) {
    const rr = (r * ring) / 4;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i % n) * angleStep - Math.PI / 2;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,215,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let i = 0; i < n; i++) {
    const a = i * angleStep - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.strokeStyle = 'rgba(255,215,0,0.25)';
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const idx = i % n;
    const a = idx * angleStep - Math.PI / 2;
    const vr = values[idx] * r;
    const x = cx + Math.cos(a) * vr, y = cy + Math.sin(a) * vr;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = to;
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const a = i * angleStep - Math.PI / 2;
    const lx = cx + Math.cos(a) * (r + 20), ly = cy + Math.sin(a) * (r + 20);
    ctx.fillStyle = '#ffd700';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(AXES[i].label, lx, ly);
  }
}

export default function RaceEditor() {
  const { currentRace, allRaces, setCurrentRace, updateCurrentRaceAttributes, updateCurrentRaceSkills, saveCurrentRace } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentRace.skills);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [flipping, setFlipping] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayed = useRef<Record<AttrKey, number>>({ ...currentRace.attributes });
  const radarVals = useRef<number[]>(AXES.map((_, i) => normalize(currentRace.attributes, i)));
  const rafRef = useRef<number>(0);

  const [displayAttrs, setDisplayAttrs] = useState<Record<AttrKey, number>>({ ...currentRace.attributes });

  useEffect(() => {
    setSelectedSkills(currentRace.skills);
  }, [currentRace.id, currentRace.skills]);

  const animateLoop = useCallback(() => {
    const attr = currentRace.attributes;
    const target = AXES.map((_, i) => normalize(attr, i));
    let needsUpdate = false;

    (Object.keys(attr) as AttrKey[]).forEach((k) => {
      const diff = attr[k] - displayed.current[k];
      if (Math.abs(diff) > 0.5) {
        displayed.current[k] += diff * 0.15;
        needsUpdate = true;
      } else {
        displayed.current[k] = attr[k];
      }
    });

    radarVals.current = radarVals.current.map((v, i) => {
      const diff = target[i] - v;
      if (Math.abs(diff) > 0.002) {
        needsUpdate = true;
        return v + diff * 0.12;
      }
      return target[i];
    });

    if (needsUpdate) {
      setDisplayAttrs({ ...displayed.current });
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      drawRadar(ctx, canvasRef.current!.width, canvasRef.current!.height, radarVals.current, currentRace.colorScheme.gradientFrom, currentRace.colorScheme.gradientTo);
    }

    rafRef.current = requestAnimationFrame(animateLoop);
  }, [currentRace.attributes, currentRace.colorScheme]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animateLoop]);

  const handleSlider = useCallback((key: AttrKey, val: number) => {
    updateCurrentRaceAttributes({ [key]: val });
  }, [updateCurrentRaceAttributes]);

  const toggleSkill = useCallback((skillId: string) => {
    setFlipping((p) => ({ ...p, [skillId]: true }));
    setTimeout(() => setFlipping((p) => ({ ...p, [skillId]: false })), 500);

    setSelectedSkills((prev) => {
      const next = prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId];
      updateCurrentRaceSkills(next);
      return next;
    });
  }, [updateCurrentRaceSkills]);

  const sliderClass: Record<AttrKey, string> = {
    hp: 'slider-hp',
    attack: 'slider-attack',
    defense: 'slider-defense',
    speed: 'slider-speed',
  };

  return (
    <div className="glass-panel noise-overlay relative p-6 rounded-xl border border-yellow-900/50">
      <div className="flex gap-6">
        {/* Left: race template dropdown */}
        <div className="w-64 shrink-0">
          <h3 className="text-yellow-400 font-bold mb-3 text-sm tracking-wider uppercase">种族模板</h3>
          <div className="relative">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-4 py-2 bg-gray-900/80 border border-yellow-900/50 rounded text-left text-gray-200 hover:border-yellow-600 transition-colors"
            >
              {currentRace.name} ▾
            </button>
            {expanded && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-yellow-900/50 rounded shadow-lg max-h-64 overflow-y-auto">
                {allRaces.map((race) => (
                  <button
                    key={race.id}
                    onClick={() => { setCurrentRace(race); setExpanded(false); }}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-yellow-900/30 hover:text-yellow-300 transition-colors"
                  >
                    {race.name}{race.isCustom ? ' ★' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 px-1">
            <p className="text-xs text-gray-500 mb-1">当前种族</p>
            <p className="text-lg font-bold" style={{ color: currentRace.colorScheme.primary }}>{currentRace.name}</p>
          </div>
        </div>

        {/* Right: attribute sliders + radar chart */}
        <div className="flex-1 flex gap-6">
          <div className="flex-1 space-y-4">
            {(Object.keys(ATTRIBUTE_RANGES) as AttrKey[]).map((key) => {
              const range = ATTRIBUTE_RANGES[key];
              const shown = Math.round(displayAttrs[key]);
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: range.color }}>{range.label}</span>
                    <span className="text-sm text-gray-300 tabular-nums font-mono">{shown}</span>
                  </div>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    value={currentRace.attributes[key]}
                    onChange={(e) => handleSlider(key, Number(e.target.value))}
                    className={`w-full h-2 rounded-full appearance-none cursor-pointer ${sliderClass[key]}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Radar chart */}
          <div className="shrink-0">
            <canvas ref={canvasRef} width={220} height={220} className="rounded-lg" />
          </div>
        </div>
      </div>

      {/* Skill selection area */}
      <div className="mt-6">
        <h3 className="text-yellow-400 font-bold mb-3 text-sm tracking-wider uppercase">技能选择</h3>
        <div className="grid grid-cols-5 gap-3">
          {SKILLS.map((skill) => {
            const isSelected = selectedSkills.includes(skill.id);
            return (
              <div
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-all select-none ${
                  flipping[skill.id] ? 'animate-skill-flip' : ''
                } ${
                  isSelected
                    ? 'border-yellow-500 bg-gray-800/80'
                    : 'border-gray-700/50 bg-gray-900/60 hover:border-gray-500'
                }`}
                style={isSelected ? { borderColor: currentRace.colorScheme.primary, boxShadow: `0 0 12px ${currentRace.colorScheme.glow}` } : undefined}
              >
                <p className="text-sm font-bold text-gray-200 mb-1" style={isSelected ? { color: currentRace.colorScheme.primary } : undefined}>
                  {skill.name}
                </p>
                {isSelected && (
                  <>
                    <p className="text-xs text-gray-400 mb-2 leading-relaxed">{skill.description}</p>
                    <label className="text-xs text-gray-500">
                      冷却:
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cooldowns[skill.id] ?? skill.defaultCooldown}
                        onChange={(e) => setCooldowns((p) => ({ ...p, [skill.id]: Number(e.target.value) }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 ml-1 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-center text-xs text-gray-300"
                      />
                      回合
                    </label>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button onClick={saveCurrentRace} className="btn-gold px-8 py-2 rounded-lg font-bold text-sm tracking-wider">
          保存自定种族
        </button>
      </div>
    </div>
  );
}
