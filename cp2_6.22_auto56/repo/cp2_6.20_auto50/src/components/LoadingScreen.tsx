import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0e27] z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl animate-pulse-scale" />
        <Loader2 className="relative w-16 h-16 text-blue-400 animate-spin" />
      </div>
      <p className="mt-8 text-lg text-white/70">正在加载气候数据...</p>
      <p className="mt-2 text-sm text-white/40">请稍候</p>
    </div>
  )
}
