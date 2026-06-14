import { Sparkles, BookOpen, Palette, Download } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "海量模板",
    description: "精选数百种复古、现代、简约风格封面模板",
  },
  {
    icon: Palette,
    title: "自由定制",
    description: "字体、颜色、布局随心调整，打造专属风格",
  },
  {
    icon: Download,
    title: "一键导出",
    description: "支持高清图片、PDF格式，多尺寸适配",
  },
];

export default function Home() {
  return (
    <div className="paper-texture min-h-screen">
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 tag-vintage mb-6 animate-fadeIn">
            <Sparkles className="w-4 h-4" />
            <span>AI 智能封面生成工具</span>
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6 animate-slideUp"
          >
            让你的作品
            <br />
            <span className="text-vintage-red relative inline-block">
              拥有独一无二的封面
              <span className="absolute -bottom-2 left-0 w-full h-3 bg-gold/30 -z-10 rounded-full" />
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl text-ink/70 font-serif mb-10 animate-slideUp animation-delay-200"
          >
            封面工坊 —— 专业的书籍封面设计平台，
            只需几分钟，让创意跃然纸上
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp animation-delay-300"
          >
            <button className="btn-primary w-full sm:w-auto">
              <Sparkles className="w-5 h-5" />
              开始创作
            </button>
            <button className="btn-secondary w-full sm:w-auto">
              <BookOpen className="w-5 h-5" />
              浏览模板
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="section-title animate-fadeIn">核心功能</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`card-vintage p-8 text-center hover:-translate-y-2 transition-all duration-300 animate-slideUp`}
                style={{ animationDelay: `${(index + 1) * 150}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-vintage-red/10 to-gold/20 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-vintage-red" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-3">
                  {feature.title}
                </h3>
                <p className="text-ink/60 font-sans leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
