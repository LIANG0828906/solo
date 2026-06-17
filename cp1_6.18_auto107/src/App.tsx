import { Sparkles, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import SideNav from '@/components/SideNav';
import UploadArea from '@/components/UploadArea';
import ProgressBar from '@/components/ProgressBar';
import BadSmellList from '@/components/BadSmellList';
import CodePreview from '@/components/CodePreview';
import { useAppStore } from '@/store';

function App() {
  const rawCode = useAppStore((s) => s.rawCode);
  const badSmells = useAppStore((s) => s.analysisResult.badSmells);

  const hasCode = rawCode.length > 0;
  const hasResult = badSmells.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex md:flex-row flex-col min-h-screen">
        <SideNav />

        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">代码气味辨识盒</h1>
              </div>
              <p className="text-slate-400">
                上传代码文件，快速识别代码坏味道并获取改进建议
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <Zap size={18} className="text-amber-400" />,
                  title: '快速检测',
                  desc: '秒级分析定位问题',
                  bg: 'bg-amber-500/10',
                  border: 'border-amber-500/20',
                },
                {
                  icon: <ShieldCheck size={18} className="text-emerald-400" />,
                  title: '精准定位',
                  desc: '行级高亮精准导航',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/20',
                },
                {
                  icon: <ArrowRight size={18} className="text-sky-400" />,
                  title: '改进建议',
                  desc: '可落地的重构方案',
                  bg: 'bg-sky-500/10',
                  border: 'border-sky-500/20',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={`rounded-xl p-4 border ${f.border} ${f.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-900/50">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {f.title}
                      </div>
                      <div className="text-slate-400 text-xs">{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <UploadArea />
            <ProgressBar />

            {!hasCode && (
              <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-10 text-center space-y-4">
                <div className="text-6xl mb-2">👆</div>
                <h3 className="text-white text-xl font-semibold">
                  准备开始检测
                </h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  上传你的代码文件或直接粘贴代码，点击"开始检测"即可自动识别潜在的代码坏味道，
                  帮助你提升代码质量和可维护性。
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-500">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">TypeScript</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">JavaScript</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">Python</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">Java</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">C++</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">Go</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80">Rust</span>
                </div>
              </div>
            )}

            {hasCode && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      检测结果
                    </h2>
                  </div>
                  <BadSmellList />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      代码预览
                    </h2>
                  </div>
                  <CodePreview />
                </div>
              </div>
            )}

            {hasCode && !hasResult && (
              <div className="rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 p-8 text-center">
                <div className="text-4xl mb-3">⏳</div>
                <h3 className="text-white font-semibold mb-1">
                  等待检测开始
                </h3>
                <p className="text-slate-400 text-sm">
                  点击上方"开始检测"按钮，分析结果将在此展示
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
