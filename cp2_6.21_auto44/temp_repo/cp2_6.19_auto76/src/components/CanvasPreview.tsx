import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  useTokenStore,
  getColorById,
  getSpacingById,
  getShadowById,
  getRadiusById,
  getBorderById,
  getBorderWidthById,
  getBorderColorById,
  getBorderStyleById,
  darkenColor,
} from '../store/tokenStore'

const transitionStyle = {
  transition: 'all 200ms ease-out',
} as const

const SampleCard: React.FC<{
  colors: ReturnType<typeof useTokenStore.getState>['colors']
  spacing: ReturnType<typeof useTokenStore.getState>['spacing']
  fonts: ReturnType<typeof useTokenStore.getState>['fonts']
  shadows: ReturnType<typeof useTokenStore.getState>['shadows']
  radii: ReturnType<typeof useTokenStore.getState>['radii']
  borders: ReturnType<typeof useTokenStore.getState>['borders']
}> = React.memo(({ colors, spacing, fonts, shadows, radii, borders }) => {
  const [btnHover, setBtnHover] = useState<'primary' | 'secondary' | null>(null)
  const [btnActive, setBtnActive] = useState<'primary' | 'secondary' | null>(null)

  const bg = getColorById(colors, 'background')
  const text = getColorById(colors, 'text')
  const primary = getColorById(colors, 'primary')
  const secondary = getColorById(colors, 'secondary')
  const sm = getSpacingById(spacing, 'sm')
  const md = getSpacingById(spacing, 'md')
  const lg = getSpacingById(spacing, 'lg')
  const cardShadow = getShadowById(shadows, 'small')
  const cardRadius = getRadiusById(radii, 'md')
  const btnRadius = getRadiusById(radii, 'sm')
  const avatarRadius = getRadiusById(radii, 'full')
  const cardBorder = getBorderById(borders, 'thin')
  const btnBorderColor = getBorderColorById(borders, 'thin')
  const btnBorderWidth = getBorderWidthById(borders, 'thin')
  const btnBorderStyle = getBorderStyleById(borders, 'thin')

  const styles = useMemo(() => {
    const primaryBg =
      btnActive === 'primary'
        ? darkenColor(primary, 0.25)
        : btnHover === 'primary'
        ? darkenColor(primary, 0.15)
        : primary
    const secondaryBg =
      btnActive === 'secondary'
        ? darkenColor(secondary, 0.25)
        : btnHover === 'secondary'
        ? darkenColor(secondary, 0.15)
        : 'transparent'
    const secondaryBorder =
      btnActive === 'secondary'
        ? darkenColor(secondary, 0.25)
        : btnHover === 'secondary'
        ? darkenColor(secondary, 0.15)
        : btnBorderColor || secondary

    return {
      card: {
        background: bg,
        color: text,
        borderRadius: cardRadius,
        padding: `${lg}px`,
        boxShadow: cardShadow,
        fontFamily: fonts.fontFamily,
        fontSize: `${fonts.baseSize}px`,
        lineHeight: fonts.lineHeight,
        width: '360px',
        maxWidth: '100%',
        boxSizing: 'border-box' as const,
        border: cardBorder,
        ...transitionStyle,
      },
      header: {
        display: 'flex' as const,
        alignItems: 'center' as const,
        gap: `${md}px`,
        marginBottom: `${md}px`,
      },
      avatar: {
        width: '48px',
        height: '48px',
        borderRadius: avatarRadius,
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        display: 'flex' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        color: '#fff',
        fontSize: '18px',
        fontWeight: 700,
        flexShrink: 0,
        ...transitionStyle,
      },
      title: {
        margin: 0,
        fontSize: `${fonts.h5}px`,
        fontWeight: 700,
        color: text,
        lineHeight: 1.3,
        ...transitionStyle,
      },
      subtitle: {
        margin: '2px 0 0 0',
        fontSize: '12px',
        color: darkenColor(text, -0.4),
        ...transitionStyle,
      },
      description: {
        margin: `0 0 ${md}px 0`,
        color: darkenColor(text, -0.2),
        fontSize: `${fonts.baseSize}px`,
        lineHeight: fonts.lineHeight,
        ...transitionStyle,
      },
      actions: {
        display: 'flex' as const,
        gap: `${sm}px`,
        flexWrap: 'wrap' as const,
      },
      primaryBtn: {
        background: primaryBg,
        color: '#ffffff',
        borderWidth: `${btnBorderWidth}px`,
        borderStyle: btnBorderStyle,
        borderColor: 'transparent',
        padding: `${sm}px ${md}px`,
        borderRadius: btnRadius,
        fontSize: `${fonts.baseSize}px`,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: fonts.fontFamily,
        boxShadow: getShadowById(shadows, 'small'),
        ...transitionStyle,
      },
      secondaryBtn: {
        background: secondaryBg,
        color: btnHover === 'secondary' || btnActive === 'secondary' ? '#ffffff' : secondary,
        borderWidth: `${Math.max(btnBorderWidth, 1.5)}px`,
        borderStyle: btnBorderStyle,
        borderColor: secondaryBorder,
        padding: `${sm}px ${md}px`,
        borderRadius: btnRadius,
        fontSize: `${fonts.baseSize}px`,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: fonts.fontFamily,
        ...transitionStyle,
      },
    }
  }, [
    bg, text, primary, secondary, sm, md, lg, cardShadow, fonts,
    cardRadius, btnRadius, avatarRadius, cardBorder,
    btnBorderColor, btnBorderWidth, btnBorderStyle, shadows,
    btnHover, btnActive,
  ])

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>DT</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.title}>设计令牌卡片</h3>
          <p style={styles.subtitle}>Design Token Preview Card</p>
        </div>
      </div>
      <p style={styles.description}>
        这是一个示例卡片组件，用于展示当前设计令牌（颜色、间距、字体、阴影、圆角、边框）在真实
        UI 上的渲染效果。所有样式均实时响应令牌变化。
      </p>
      <div style={styles.actions}>
        <button
          style={styles.primaryBtn}
          onMouseEnter={() => setBtnHover('primary')}
          onMouseLeave={() => {
            setBtnHover(null)
            setBtnActive(null)
          }}
          onMouseDown={() => setBtnActive('primary')}
          onMouseUp={() => setBtnActive(null)}
        >
          主按钮
        </button>
        <button
          style={styles.secondaryBtn}
          onMouseEnter={() => setBtnHover('secondary')}
          onMouseLeave={() => {
            setBtnHover(null)
            setBtnActive(null)
          }}
          onMouseDown={() => setBtnActive('secondary')}
          onMouseUp={() => setBtnActive(null)}
        >
          辅助按钮
        </button>
      </div>
    </div>
  )
})

const ButtonShowcase: React.FC<{
  colors: ReturnType<typeof useTokenStore.getState>['colors']
  spacing: ReturnType<typeof useTokenStore.getState>['spacing']
  fonts: ReturnType<typeof useTokenStore.getState>['fonts']
  shadows: ReturnType<typeof useTokenStore.getState>['shadows']
  radii: ReturnType<typeof useTokenStore.getState>['radii']
  borders: ReturnType<typeof useTokenStore.getState>['borders']
}> = React.memo(({ colors, spacing, fonts, shadows, radii, borders }) => {
  const [hoverState, setHoverState] = useState<'p' | 's' | null>(null)
  const [activeState, setActiveState] = useState<'p' | 's' | null>(null)

  const primary = getColorById(colors, 'primary')
  const secondary = getColorById(colors, 'secondary')
  const sm = getSpacingById(spacing, 'sm')
  const md = getSpacingById(spacing, 'md')
  const lg = getSpacingById(spacing, 'lg')
  const bg = getColorById(colors, 'background')
  const text = getColorById(colors, 'text')
  const containerShadow = getShadowById(shadows, 'small')
  const containerRadius = getRadiusById(radii, 'md')
  const btnRadius = getRadiusById(radii, 'sm')
  const containerBorder = getBorderById(borders, 'thin')
  const btnBorderWidth = getBorderWidthById(borders, 'thin')
  const btnBorderColor = getBorderColorById(borders, 'thin')
  const btnBorderStyle = getBorderStyleById(borders, 'thin')

  const btnStyles = useMemo(() => {
    const pBg =
      activeState === 'p'
        ? darkenColor(primary, 0.25)
        : hoverState === 'p'
        ? darkenColor(primary, 0.15)
        : primary
    const sBg =
      activeState === 's'
        ? darkenColor(secondary, 0.25)
        : hoverState === 's'
        ? darkenColor(secondary, 0.15)
        : 'transparent'
    const sBorder =
      activeState === 's'
        ? darkenColor(secondary, 0.25)
        : hoverState === 's'
        ? darkenColor(secondary, 0.15)
        : btnBorderColor || secondary

    return {
      primary: {
        background: pBg,
        color: '#fff',
        borderWidth: `${btnBorderWidth}px`,
        borderStyle: btnBorderStyle,
        borderColor: 'transparent',
        padding: `${sm}px ${md}px`,
        borderRadius: btnRadius,
        fontSize: `${fonts.baseSize}px`,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: fonts.fontFamily,
        boxShadow: containerShadow,
        flex: 1,
        minWidth: '100px',
        ...transitionStyle,
      },
      secondary: {
        background: sBg,
        color: hoverState === 's' || activeState === 's' ? '#fff' : secondary,
        borderWidth: `${Math.max(btnBorderWidth, 1.5)}px`,
        borderStyle: btnBorderStyle,
        borderColor: sBorder,
        padding: `${sm}px ${md}px`,
        borderRadius: btnRadius,
        fontSize: `${fonts.baseSize}px`,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: fonts.fontFamily,
        flex: 1,
        minWidth: '100px',
        ...transitionStyle,
      },
    }
  }, [
    primary, secondary, sm, md, fonts.baseSize, fonts.fontFamily,
    containerShadow, hoverState, activeState,
    btnRadius, btnBorderWidth, btnBorderColor, btnBorderStyle,
  ])

  return (
    <div
      style={{
        background: bg,
        padding: `${lg}px ${lg}px`,
        borderRadius: containerRadius,
        boxShadow: containerShadow,
        fontFamily: fonts.fontFamily,
        width: '360px',
        maxWidth: '100%',
        boxSizing: 'border-box' as const,
        border: containerBorder,
        ...transitionStyle,
      }}
    >
      <h4
        style={{
          margin: `0 0 ${md}px 0`,
          fontSize: `${fonts.h6}px`,
          fontWeight: 600,
          color: darkenColor(text, -0.3),
          ...transitionStyle,
        }}
      >
        按钮展示
      </h4>
      <div
        style={{
          display: 'flex',
          gap: `${md}px`,
        }}
      >
        <button
          style={btnStyles.primary}
          onMouseEnter={() => setHoverState('p')}
          onMouseLeave={() => {
            setHoverState(null)
            setActiveState(null)
          }}
          onMouseDown={() => setActiveState('p')}
          onMouseUp={() => setActiveState(null)}
        >
          Primary
        </button>
        <button
          style={btnStyles.secondary}
          onMouseEnter={() => setHoverState('s')}
          onMouseLeave={() => {
            setHoverState(null)
            setActiveState(null)
          }}
          onMouseDown={() => setActiveState('s')}
          onMouseUp={() => setActiveState(null)}
        >
          Secondary
        </button>
      </div>
    </div>
  )
})

const FormInput: React.FC<{
  colors: ReturnType<typeof useTokenStore.getState>['colors']
  spacing: ReturnType<typeof useTokenStore.getState>['spacing']
  fonts: ReturnType<typeof useTokenStore.getState>['fonts']
  shadows: ReturnType<typeof useTokenStore.getState>['shadows']
  radii: ReturnType<typeof useTokenStore.getState>['radii']
  borders: ReturnType<typeof useTokenStore.getState>['borders']
}> = React.memo(({ colors, spacing, fonts, shadows, radii, borders }) => {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')

  const bg = getColorById(colors, 'background')
  const text = getColorById(colors, 'text')
  const primary = getColorById(colors, 'primary')
  const success = getColorById(colors, 'success')
  const sm = getSpacingById(spacing, 'sm')
  const md = getSpacingById(spacing, 'md')
  const lg = getSpacingById(spacing, 'lg')
  const inputBg = getColorById(colors, 'background')
  const containerShadow = getShadowById(shadows, 'small')
  const containerRadius = getRadiusById(radii, 'md')
  const inputRadius = getRadiusById(radii, 'sm')
  const btnRadius = getRadiusById(radii, 'sm')
  const containerBorder = getBorderById(borders, 'thin')
  const baseBorderWidth = getBorderWidthById(borders, 'medium')
  const baseBorderColor = getBorderColorById(borders, 'medium')
  const baseBorderStyle = getBorderStyleById(borders, 'medium')
  const btnBorderStyle = getBorderStyleById(borders, 'thin')

  const styles = useMemo(() => {
    const borderWidth = Math.max(baseBorderWidth, 1.5)
    const borderColor = focused ? primary : baseBorderColor

    return {
      container: {
        background: bg,
        padding: `${lg}px ${lg}px`,
        borderRadius: containerRadius,
        boxShadow: containerShadow,
        fontFamily: fonts.fontFamily,
        fontSize: `${fonts.baseSize}px`,
        width: '360px',
        maxWidth: '100%',
        boxSizing: 'border-box' as const,
        border: containerBorder,
        ...transitionStyle,
      },
      label: {
        display: 'block',
        marginBottom: `${sm}px`,
        fontSize: '12px',
        fontWeight: 600,
        color: darkenColor(text, -0.2),
        ...transitionStyle,
      },
      inputWrap: {
        position: 'relative' as const,
        marginBottom: `${md}px`,
      },
      input: {
        width: '100%',
        boxSizing: 'border-box' as const,
        padding: `${sm}px ${md}px`,
        borderRadius: inputRadius,
        borderWidth: `${borderWidth}px`,
        borderStyle: baseBorderStyle,
        borderColor: borderColor,
        background: inputBg,
        color: text,
        fontSize: `${fonts.baseSize}px`,
        fontFamily: fonts.fontFamily,
        outline: 'none',
        lineHeight: fonts.lineHeight,
        boxShadow: focused ? `0 0 0 3px ${primary}22` : 'none',
        ...transitionStyle,
      },
      submit: {
        width: '100%',
        background: primary,
        color: '#fff',
        borderWidth: `${baseBorderWidth}px`,
        borderStyle: btnBorderStyle,
        borderColor: 'transparent',
        padding: `${sm}px ${md}px`,
        borderRadius: btnRadius,
        fontSize: `${fonts.baseSize}px`,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: fonts.fontFamily,
        marginTop: `${sm}px`,
        ...transitionStyle,
      },
      hint: {
        fontSize: '11px',
        color: success,
        marginTop: `${sm / 2}px`,
        fontWeight: 500,
        ...transitionStyle,
      },
      title: {
        margin: `0 0 ${md}px 0`,
        fontSize: `${fonts.h6}px`,
        fontWeight: 600,
        color: darkenColor(text, -0.3),
        ...transitionStyle,
      },
    }
  }, [
    bg, text, primary, success, sm, md, lg, inputBg,
    containerShadow, fonts,
    containerRadius, inputRadius, btnRadius,
    containerBorder, baseBorderWidth, baseBorderColor,
    baseBorderStyle, btnBorderStyle,
    focused, value,
  ])

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>表单输入框</h4>
      <div style={styles.inputWrap}>
        <label style={styles.label}>用户名</label>
        <input
          type="text"
          style={styles.input}
          placeholder="请输入您的用户名..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value && <span style={styles.hint}>✓ 输入有效</span>}
      </div>
      <div style={styles.inputWrap}>
        <label style={styles.label}>密码</label>
        <input
          type="password"
          style={styles.input}
          placeholder="请输入密码..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <button style={styles.submit}>提 交</button>
    </div>
  )
})

const CanvasPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    let raf = 0
    const check = () => {
      if (containerRef.current) {
        setNarrow(containerRef.current.offsetWidth < 768)
      }
    }
    check()
    window.addEventListener('resize', check)
    raf = requestAnimationFrame(check)
    return () => {
      window.removeEventListener('resize', check)
      cancelAnimationFrame(raf)
    }
  }, [])

  const colors = useTokenStore((s) => s.colors)
  const spacing = useTokenStore((s) => s.spacing)
  const fonts = useTokenStore((s) => s.fonts)
  const shadows = useTokenStore((s) => s.shadows)
  const radii = useTokenStore((s) => s.radii)
  const borders = useTokenStore((s) => s.borders)
  const isResetting = useTokenStore((s) => s.isResetting ?? false)

  const bgColor = useMemo(() => {
    const bg = getColorById(colors, 'background')
    try {
      const hex = bg.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.9 ? '#ececec' : '#f5f5f5'
    } catch {
      return '#f5f5f5'
    }
  }, [colors])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: '100vh',
        overflow: 'auto',
        background: bgColor,
        transition: isResetting ? 'all 500ms ease' : undefined,
      }}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: narrow ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: narrow ? '16px' : '16px',
          padding: '40px 24px',
          boxSizing: 'border-box',
        }}
      >
        {narrow ? (
          <>
            <div
              style={{
                width: '90%',
                maxWidth: '420px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <SampleCard
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
            </div>
            <div
              style={{
                width: '90%',
                maxWidth: '420px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ButtonShowcase
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
            </div>
            <div
              style={{
                width: '90%',
                maxWidth: '420px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <FormInput
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <SampleCard
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <ButtonShowcase
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
              <FormInput
                colors={colors}
                spacing={spacing}
                fonts={fonts}
                shadows={shadows}
                radii={radii}
                borders={borders}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(CanvasPreview)
