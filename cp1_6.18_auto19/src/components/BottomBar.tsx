import { ArrowLeft, Lightbulb, LogOut } from 'lucide-react'

interface BottomBarProps {
  onBack: () => void
  onHint: () => void
  onExit: () => void
}

export default function BottomBar({ onBack, onHint, onExit }: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-[60px] bg-white/90 backdrop-blur-sm border-t border-black/5 z-50">
      <div className="flex items-center justify-center h-full max-w-[1200px] mx-auto gap-4">
        <button
          onClick={onBack}
          className="flex items-center h-10 rounded-full px-6 bg-wood text-white transition-colors hover:bg-wood-light"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          返回
        </button>
        <button
          onClick={onHint}
          className="flex items-center h-10 rounded-full px-6 bg-gold text-wood transition-colors hover:bg-gold-dark"
        >
          <Lightbulb className="w-4 h-4 mr-1.5" />
          提示
        </button>
        <button
          onClick={onExit}
          className="flex items-center h-10 rounded-full px-6 border border-wood text-wood bg-transparent transition-colors hover:bg-wood/5"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          退出
        </button>
      </div>
    </div>
  )
}
