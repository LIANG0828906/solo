import { AuraBackground } from './components/AuraBackground';
import { ColorPanel } from './components/ColorPanel';
import { hslToHexString } from './utils/colorEngine';
import { useAuraStore } from './store/store';

function App() {
  const auraColor = useAuraStore((s) => s.auraColor);
  const accentHex = auraColor ? hslToHexString(auraColor.primary) : '#0ABDE3';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      <AuraBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 800,
          margin: '0 auto',
          padding: '0 20px',
          paddingTop: 80,
          paddingBottom: 120,
        }}
      >
        <header style={{ marginBottom: 60, textAlign: 'center' }}>
          <h1
            style={{
              color: '#fff',
              fontSize: 42,
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            滚动联动色彩光晕
          </h1>
          <p
            style={{
              color: '#888',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            滚动页面，背景光晕将随滚动位置在六种经典色相间平滑过渡。移动鼠标，光晕会跟随你的光标。
          </p>
          {auraColor && (
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#999',
                  fontFamily: 'monospace',
                }}
              >
                主色: {hslToHexString(auraColor.primary)}
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#999',
                  fontFamily: 'monospace',
                }}
              >
                辅色: {hslToHexString(auraColor.secondary)}
              </div>
            </div>
          )}
        </header>

        <article style={{ color: '#E0E0E0' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((section) => (
            <section key={section} style={{ marginBottom: 48 }}>
              <h2
                style={{
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: `1px solid ${accentHex}33`,
                }}
              >
                第 {section} 章 · {['引言', '色彩的流动', '光与影的舞蹈', '交互的诗意', '代码的韵律', '收藏美好', '性能之道', '结尾随想'][section - 1]}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
                在数字世界的深处，色彩不仅仅是视觉的表达，它是情感的载体，是信息的语言。当我们滚动这篇文章时，背景的光晕在六种经典色相间轻盈地跳跃——从炽热的朱红到温暖的橙黄，从明亮的柠檬到清新的青绿，再从深邃的湖蓝过渡到梦幻的紫罗兰。
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
                每一次滚动都是一次微小的旅行。正弦插值算法让色彩的变化如同呼吸般自然，没有突兀的跳变，只有柔和的渐变。这背后是HSL色彩空间的精妙运用——色相沿着色环缓缓旋转，饱和度和亮度保持协调，确保每一个中间色都赏心悦目。
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
                三层径向渐变的叠加创造出深邃的空间感。最内层的光晕浓郁而明确，中间层柔和而弥散，最外层则如薄雾般轻盈。它们随着鼠标的移动轻轻漂流，仿佛是屏幕背后有一束生命之光，在好奇地追逐着你的每一个动作。
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
                当你遇到让人心动的色彩组合时，点击右下角的加号按钮，将它永久收藏。每一次收藏都是对美的一次定格。在收藏面板中，你可以随时回溯那些让你驻足的瞬间，点击任意色块，整个背景便会瞬间切换——时间在这一刻凝固。
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7 }}>
                所有这些交互都在无声地进行。requestAnimationFrame确保滚动事件被优雅地节流，30fps的Canvas渲染在性能与视觉之间找到了完美平衡。即使在性能有限的设备上，这份流动的诗意也不会被打断。这正是前端工程的魅力——用技术编织出看不见的丝绒。
              </p>
            </section>
          ))}
        </article>

        <footer style={{ textAlign: 'center', marginTop: 80, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#555', fontSize: 13 }}>
            向下滚动继续体验色彩的流动 · 移动鼠标观察光晕的跟随
          </p>
        </footer>
      </div>

      <ColorPanel />
    </div>
  );
}

export default App;
