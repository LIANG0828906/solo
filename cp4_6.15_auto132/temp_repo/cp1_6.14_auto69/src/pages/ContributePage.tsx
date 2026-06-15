import { Sparkles } from 'lucide-react'
import UploadForm from '@/components/UploadForm'

export default function ContributePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="text-center mb-10 animate-fadeInUp">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 text-terracotta-dark text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>社区共建</span>
        </div>
        <h1 className="font-serif text-4xl font-bold text-navy mb-4">
          为非遗档案贡献一份力量
        </h1>
        <p className="max-w-2xl mx-auto text-navy-light text-lg leading-relaxed">
          每一项非遗技艺都承载着千年的文化记忆。分享你所了解的传统手工艺，让更多人看到中华传统文化的魅力。
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-terracotta to-transparent mx-auto mt-6" />
      </div>

      <UploadForm />
    </div>
  )
}
