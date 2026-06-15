import { useState, useEffect, useCallback } from 'react';
import BenchmarkPanel from './components/BenchmarkPanel';
import ResultPanel from './components/ResultPanel';
import { TestCase, BenchmarkResult, runBenchmark } from './utils/benchmark';

const STORAGE_KEY = 'js-benchmark-state';

interface AppState {
  testCases: TestCase[];
  results: BenchmarkResult[];
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        testCases: Array.isArray(parsed.testCases) ? parsed.testCases : [],
        results: Array.isArray(parsed.results) ? parsed.results : [],
      };
    }
  } catch { /* ignore */ }
  return { testCases: [], results: [] };
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

let idCounter = 0;
function genId() {
  return `tc_${Date.now()}_${++idCounter}`;
}

export default function App() {
  const [testCases, setTestCases] = useState<TestCase[]>(() => loadState().testCases);
  const [results, setResults] = useState<BenchmarkResult[]>(() => loadState().results);
  const [isRunning, setIsRunning] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [mobileResultsExpanded, setMobileResultsExpanded] = useState(false);

  useEffect(() => {
    saveState({ testCases, results });
  }, [testCases, results]);

  const handleAddTestCase = useCallback(() => {
    const tc: TestCase = {
      id: genId(),
      name: `Test Case ${testCases.length + 1}`,
      code: 'return null;',
      iterations: 1000,
      enabled: true,
    };
    setTestCases(prev => [...prev, tc]);
  }, [testCases.length]);

  const handleUpdateTestCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, ...updates } : tc));
  }, []);

  const handleDeleteTestCase = useCallback((id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    setResults(prev => prev.filter(r => r.id !== id));
  }, []);

  const handleCopyTestCase = useCallback((id: string) => {
    setTestCases(prev => {
      const tc = prev.find(t => t.id === id);
      if (!tc) return prev;
      const copy: TestCase = {
        id: genId(),
        name: `${tc.name} (copy)`,
        code: tc.code,
        iterations: tc.iterations,
        enabled: tc.enabled,
      };
      return [...prev, copy];
    });
  }, []);

  const handleRunBenchmark = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setMobileResultsExpanded(true);

    const enabledCases = testCases.filter(tc => tc.enabled);
    if (enabledCases.length === 0) {
      setIsRunning(false);
      return;
    }

    const allResults: BenchmarkResult[] = [];

    for (const tc of enabledCases) {
      setRunningId(tc.id);
      await new Promise(resolve => setTimeout(resolve, 30));

      const singleResult = runBenchmark([tc]);
      if (singleResult.length > 0) {
        allResults.push(singleResult[0]);
      }
      setResults([...allResults].sort((a, b) => a.avgTime - b.avgTime));
    }

    setRunningId(null);
    setIsRunning(false);
  }, [testCases]);

  const handleSave = useCallback(() => {
    const json = JSON.stringify({ testCases, results }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benchmark-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [testCases, results]);

  const handleLoad = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data.testCases)) setTestCases(data.testCases);
          if (Array.isArray(data.results)) setResults(data.results);
        } catch { /* ignore invalid JSON */ }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleToggleMobileResults = useCallback(() => {
    setMobileResultsExpanded(prev => !prev);
  }, []);

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#e0e0ff',
      }}
    >
      <BenchmarkPanel
        testCases={testCases}
        results={results}
        isRunning={isRunning}
        runningId={runningId}
        onAdd={handleAddTestCase}
        onUpdate={handleUpdateTestCase}
        onDelete={handleDeleteTestCase}
        onCopy={handleCopyTestCase}
        onRun={handleRunBenchmark}
        onSave={handleSave}
        onLoad={handleLoad}
        onToggleMobileResults={handleToggleMobileResults}
        mobileResultsExpanded={mobileResultsExpanded}
      />
      <ResultPanel
        results={results}
        mobileExpanded={mobileResultsExpanded}
        onMobileClose={handleToggleMobileResults}
      />
    </div>
  );
}
