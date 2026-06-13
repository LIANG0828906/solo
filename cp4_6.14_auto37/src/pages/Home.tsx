import RecipeInput from '@/RecipeInput';
import FlowCanvas from '@/FlowCanvas';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-[#FFF8E1]">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-warm-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <h1 className="font-display text-xl text-warm-700">食谱流程图生成器</h1>
        </div>
        <p className="text-xs text-warm-400 hidden sm:block">将文字食谱转换为可视化烹饪流程</p>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-[340px] w-full lg:h-full h-auto flex-shrink-0 border-r border-warm-100">
          <RecipeInput />
        </div>
        <div className="flex-1 min-h-0">
          <FlowCanvas />
        </div>
      </div>
    </div>
  );
}
