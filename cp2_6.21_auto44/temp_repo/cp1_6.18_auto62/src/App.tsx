import CodeEditor from '@/components/CodeEditor';
import StepVisualizer from '@/components/StepVisualizer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0]">
      <header className="border-b border-[#2D3A5C] px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #4ECDC4, #3BA6A0)' }}>
          ⚡
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[#4ECDC4]">Code</span> Execution Sandbox
        </h1>
      </header>
      <main className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 52px)' }}>
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-[#2D3A5C]">
          <CodeEditor />
        </div>
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-full">
          <StepVisualizer />
        </div>
      </main>
    </div>
  );
}
