import { useRef, useEffect, useState, useMemo } from 'react';
import { useSandboxStore } from '@/stores/useSandboxStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function highlightLine(code: string, activeLine: number): string {
  const lines = code.split('\n');
  return lines.map((line, idx) => {
    const lineNum = idx + 1;
    const isActive = lineNum === activeLine;
    const bg = isActive ? 'rgba(78, 205, 196, 0.12)' : 'transparent';
    const borderLeft = isActive ? '3px solid #4ECDC4' : '3px solid transparent';
    const numColor = isActive ? '#4ECDC4' : '#64748B';
    const textColor = isActive ? '#F1F5F9' : '#CBD5E1';
    return `<div style="display:flex;background:${bg};border-left:${borderLeft};min-height:1.5rem"><span style="color:${numColor};width:2.5rem;text-align:right;padding-right:0.75rem;flex-shrink:0;user-select:none;opacity:0.7">${lineNum}</span><span style="color:${textColor};white-space:pre;flex:1">${escapeHtml(line)}</span></div>`;
  }).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function VariableTable({ variables, prevVariables }: { variables: Record<string, { type: string; value: string }>; prevVariables: Record<string, { type: string; value: string }> | null }) {
  const entries = Object.entries(variables).filter(([k]) => !k.startsWith('__'));
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!prevVariables) return;
    const changed = new Set<string>();
    for (const [k, v] of entries) {
      if (!prevVariables[k] || prevVariables[k].value !== v.value) {
        changed.add(k);
      }
    }
    if (changed.size > 0) {
      setFlashing(changed);
      const timer = setTimeout(() => setFlashing(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [variables]);

  if (entries.length === 0) {
    return (
      <div className="text-[#64748B] text-sm text-center py-6">
        No variables yet
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-[#1E293B] text-[#94A3B8] text-left" style={{ fontSize: '14px' }}>
          <th className="px-3 py-2 font-medium">Name</th>
          <th className="px-3 py-2 font-medium">Type</th>
          <th className="px-3 py-2 font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([name, info], idx) => {
          const bg = idx % 2 === 0 ? '#1E293B' : '#2D3A5C';
          const isFlashing = flashing.has(name);
          return (
            <tr
              key={name}
              className="hover:bg-[#3A5A8C] transition-colors duration-150"
              style={{
                background: bg,
                borderLeft: isFlashing ? '3px solid #EF4444' : '3px solid transparent',
                transition: 'border-color 0.3s ease',
              }}
            >
              <td className="px-3 py-1.5 text-[#E2E8F0] font-mono text-xs">{name}</td>
              <td className="px-3 py-1.5 text-[#94A3B8] text-xs">{info.type}</td>
              <td className="px-3 py-1.5 text-[#34D399] font-mono text-xs max-w-[200px] truncate" title={info.value}>{info.value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ConsoleOutput({ entries }: { entries: { timestamp: string; text: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="text-[#64748B] text-sm text-center py-4">
        Console output will appear here
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-y-auto max-h-48 space-y-1 p-2">
      {entries.map((entry, idx) => (
        <div
          key={idx}
          className="flex gap-2 px-3 py-1.5 rounded font-mono text-xs"
          style={{ background: '#111827', borderRadius: '4px' }}
        >
          <span className="text-[#64748B] flex-shrink-0">{entry.timestamp}</span>
          <span className="text-[#B0C4DE] break-all">{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

export default function StepVisualizer() {
  const { code, steps, currentStepIndex, setStepIndex, nextStep, prevStep } = useSandboxStore();

  const currentStep = steps[currentStepIndex] ?? null;
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
  const activeLine = currentStep?.lineNumber ?? 0;
  const totalSteps = steps.length;

  const codeHtml = useMemo(() => highlightLine(code, activeLine), [code, activeLine]);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[#64748B]">
        <div className="text-6xl mb-4 opacity-30">⌨️</div>
        <p className="text-lg font-medium">No execution yet</p>
        <p className="text-sm mt-1">Click <span className="text-[#4ECDC4]">Run</span> to start debugging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D3A5C]">
        <span className="text-[#94A3B8] text-sm font-medium tracking-wide">Step Visualizer</span>
        <span className="text-[#4ECDC4] text-sm font-mono">
          {currentStepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-[#2D3A5C]">
          <div className="px-3 py-2 text-[#64748B] text-xs font-medium uppercase tracking-wider">Code</div>
          <div
            className="font-mono text-sm px-2 pb-2"
            dangerouslySetInnerHTML={{ __html: codeHtml }}
          />
        </div>

        <div className="border-b border-[#2D3A5C]">
          <div className="px-3 py-2 text-[#64748B] text-xs font-medium uppercase tracking-wider">Variables</div>
          <div className="px-2 pb-2">
            <VariableTable variables={currentStep?.variables ?? {}} prevVariables={prevStep?.variables ?? null} />
          </div>
        </div>

        <div>
          <div className="px-3 py-2 text-[#64748B] text-xs font-medium uppercase tracking-wider">Console</div>
          <div className="px-2 pb-2">
            <ConsoleOutput entries={currentStep?.consoleOutput ?? []} />
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#2D3A5C] space-y-3">
        <input
          type="range"
          min={0}
          max={Math.max(totalSteps - 1, 0)}
          value={currentStepIndex}
          onChange={e => setStepIndex(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #4ECDC4 ${(currentStepIndex / Math.max(totalSteps - 1, 1)) * 100}%, #2D3A5C ${(currentStepIndex / Math.max(totalSteps - 1, 1)) * 100}%)`,
            accentColor: '#4ECDC4',
          }}
        />
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={prevStep}
            disabled={currentStepIndex <= 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#0F172A] active:scale-95 transition-all duration-100 disabled:cursor-not-allowed"
            style={{
              background: currentStepIndex <= 0 ? '#2D4A6C' : '#4ECDC4',
              opacity: currentStepIndex <= 0 ? 0.5 : 1,
              borderRadius: '8px',
            }}
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <button
            onClick={nextStep}
            disabled={currentStepIndex >= totalSteps - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#0F172A] active:scale-95 transition-all duration-100 disabled:cursor-not-allowed"
            style={{
              background: currentStepIndex >= totalSteps - 1 ? '#2D4A6C' : '#4ECDC4',
              opacity: currentStepIndex >= totalSteps - 1 ? 0.5 : 1,
              borderRadius: '8px',
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
