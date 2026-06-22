
import { useColorStore } from '@/store/useColorStore'
import { getLightVariant } from '@/modules/colorHarmony'

export default function ComponentPreview() {
  const colorScheme = useColorStore(s => s.colorScheme)
  const primary = colorScheme.primary
  const secondary1 = colorScheme.secondary[0] || '#888888'
  const secondary2 = colorScheme.secondary[1] || secondary1
  const darkBg = '#1A1A2E'
  const lightBg = getLightVariant()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div
        style={{
          width: 200,
          height: 48,
          borderRadius: 8,
          background: primary,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          transition: 'color 0.3s ease, background-color 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          userSelect: 'none',
        }}
      >
        主按钮
      </div>

      <div
        style={{
          width: 280,
          minHeight: 180,
          borderRadius: 12,
          background: lightBg,
          border: `1px dashed ${secondary1}`,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'border-color 0.3s ease, background-color 0.3s ease',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: primary,
            transition: 'color 0.3s ease',
          }}
        >
          信息卡片标题
        </div>
        <div
          style={{
            fontSize: '14px',
            color: secondary1,
            lineHeight: 1.6,
            transition: 'color 0.3s ease',
          }}
        >
          这是配色方案在信息卡片组件上的预览效果。标题使用主色，描述文字使用辅助色，边框以虚线呈现辅助色。
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              background: secondary1,
              color: '#fff',
              fontSize: '12px',
              transition: 'background-color 0.3s ease',
            }}
          >
            标签一
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              background: secondary2,
              color: '#fff',
              fontSize: '12px',
              transition: 'background-color 0.3s ease',
            }}
          >
            标签二
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: 56,
          borderRadius: 8,
          background: darkBg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '28px',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            marginRight: '12px',
          }}
        >
          Logo
        </span>
        {['首页', '产品', '关于'].map((item, i) => (
          <span
            key={item}
            style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: i === 0 ? 600 : 400,
              position: 'relative',
              paddingBottom: i === 0 ? '4px' : '0',
              borderBottom: i === 0 ? `2px solid ${secondary1}` : 'none',
              cursor: 'pointer',
              transition: 'border-color 0.3s ease',
            }}
          >
            {item}
          </span>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: secondary1,
              transition: 'background-color 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[primary, ...colorScheme.secondary].map((color, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: color,
                transition: 'background-color 0.3s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>
              {color.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
