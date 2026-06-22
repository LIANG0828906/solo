export interface TestCase {
  id: string;
  name: string;
  code: string;
  iterations: number;
  enabled: boolean;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  totalTime: number;
  avgTime: number;
  iterations: number;
}

export function runBenchmark(testCases: TestCase[]): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  for (const tc of testCases) {
    if (!tc.enabled) continue;

    let fn: Function;
    try {
      fn = new Function(tc.code);
    } catch {
      results.push({
        id: tc.id,
        name: tc.name,
        totalTime: -1,
        avgTime: -1,
        iterations: tc.iterations,
      });
      continue;
    }

    try {
      const start = performance.now();
      for (let i = 0; i < tc.iterations; i++) {
        fn();
      }
      const end = performance.now();

      const totalTime = end - start;
      const avgTime = totalTime / tc.iterations;

      results.push({
        id: tc.id,
        name: tc.name,
        totalTime: Math.round(totalTime * 1000) / 1000,
        avgTime: Math.round(avgTime * 10000) / 10000,
        iterations: tc.iterations,
      });
    } catch {
      results.push({
        id: tc.id,
        name: tc.name,
        totalTime: -1,
        avgTime: -1,
        iterations: tc.iterations,
      });
    }
  }

  return results.sort((a, b) => a.avgTime - b.avgTime);
}
