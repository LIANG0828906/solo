import { hexToHsl, hslToHex } from '../utils/colorUtils'

interface PreviewPanelProps {
  primaryColor: string
}

export default function PreviewPanel({ primaryColor }: PreviewPanelProps) {
  const hsl = hexToHsl(primaryColor)

  const lightBg = hslToHex(hsl.h, Math.min(100, hsl.s * 0.3), 95)
  const darkBg = hslToHex(hsl.h, Math.min(100, hsl.s * 0.5), 15)
  const lightText = hslToHex(hsl.h, 20, 15)
  const accentColor = hslToHex(hsl.h, hsl.s, 45)
  const hoverColor = hslToHex(hsl.h, hsl.s, 55)
  const borderColor = hslToHex(hsl.h, Math.min(100, hsl.s * 0.6), 60)

  const cardBg = 'rgba(26, 26, 46, 0.6)'

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        实时预览
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        <div style={{
          background: lightBg,
          borderRadius: '12px',
          padding: '24px',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ fontSize: '12px', color: lightText, marginBottom: '12px', transition: 'color 0.3s ease' }}>
            浅色主题
          </div>

          <button
            style={{
              backgroundColor: primaryColor,
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
              boxShadow: `0 2px 8px ${primaryColor}40`,
              marginBottom: '16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverColor
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            主要按钮
          </button>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '16px',
            border: `1px solid ${borderColor}40`,
            transition: 'border-color 0.3s ease',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: primaryColor,
              marginBottom: '12px',
              transition: 'background-color 0.3s ease',
            }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: lightText, marginBottom: '4px', transition: 'color 0.3s ease' }}>
              卡片标题
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              这是一张示例卡片
            </div>
          </div>
        </div>

        <div style={{
          background: darkBg,
          borderRadius: '12px',
          padding: '24px',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ fontSize: '12px', color: '#a0a0b8', marginBottom: '12px' }}>
            深色主题
          </div>

          <div style={{
            position: 'relative',
            borderRadius: '12px',
            padding: '2px',
            background: `linear-gradient(135deg, ${primaryColor}, ${hslToHex((hsl.h + 60) % 360, hsl.s, 55)})`,
            marginBottom: '16px',
            transition: 'background 0.3s ease',
          }}>
            <div style={{
              backgroundColor: cardBg,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                毛玻璃卡片
              </div>
              <div style={{ fontSize: '12px', color: '#a0a0b8' }}>
                渐变边框 + 模糊效果
              </div>
            </div>
          </div>

          <button
            style={{
              backgroundColor: 'transparent',
              color: accentColor,
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              border: `2px solid ${accentColor}`,
              transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentColor
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = accentColor
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            轮廓按钮
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((shade) => {
          const shadeNum = parseInt(shade)
          const lightness = 97 - (shadeNum / 1000) * 85
          const satAdj = shadeNum < 500 ? 0.3 + (shadeNum / 500) * 0.7 : 1 - ((shadeNum - 500) / 400) * 0.15
          const shadeColor = hslToHex(hsl.h, hsl.s * satAdj, lightness)
          const isDark = lightness < 50

          return (
            <div
              key={shade}
              style={{
                flex: 1,
                minWidth: '40px',
                aspectRatio: '1 / 1.2',
                borderRadius: '8px',
                backgroundColor: shadeColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '8px',
                transition: 'background-color 0.3s ease, transform 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              title={shadeColor}
            >
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: isDark ? '#fff' : '#333',
                transition: 'color 0.3s ease',
              }}>
                {shade}
              </span>
              <span style={{
                fontSize: '9px',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                marginTop: '2px',
                transition: 'color 0.3s ease',
                textTransform: 'lowercase',
              }}>
                {shadeColor.slice(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
