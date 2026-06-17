import {
  useDesignTokenStore,
  hslToCss,
  shadowToCss,
} from '@/store/designTokenStore';

function PrimaryButton() {
  const colors = useDesignTokenStore((s) => s.colors);
  const spacing = useDesignTokenStore((s) => s.spacing);
  const borderRadius = useDesignTokenStore((s) => s.borderRadius);

  const bgColor = hslToCss(colors.primary);
  const px = spacing.md.value;
  const radius = borderRadius.md.value;

  return (
    <div className="preview-component">
      <div className="preview-label">主按钮</div>
      <div className="preview-body">
        <button
          style={{
            background: bgColor,
            color: '#fff',
            border: 'none',
            padding: `10px ${px}px`,
            borderRadius: `${radius}px`,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          Primary Button
        </button>
      </div>
      <div className="preview-token-info">
        <span>背景: {colors.primary.label}</span>
        <span>圆角: radius-{borderRadius.md.label}</span>
        <span>内边距: spacing-{spacing.md.label}</span>
      </div>
    </div>
  );
}

function SecondaryButton() {
  const colors = useDesignTokenStore((s) => s.colors);
  const borderRadius = useDesignTokenStore((s) => s.borderRadius);

  const bgColor = hslToCss(colors.secondary);
  const radius = borderRadius.sm.value;

  return (
    <div className="preview-component">
      <div className="preview-label">辅按钮</div>
      <div className="preview-body">
        <button
          style={{
            background: bgColor,
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: `${radius}px`,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Secondary Button
        </button>
      </div>
      <div className="preview-token-info">
        <span>背景: {colors.secondary.label}</span>
        <span>圆角: radius-{borderRadius.sm.label}</span>
      </div>
    </div>
  );
}

function InputField() {
  const colors = useDesignTokenStore((s) => s.colors);
  const borderRadius = useDesignTokenStore((s) => s.borderRadius);

  const borderColor = hslToCss(colors.gray3);
  const radius = borderRadius.sm.value;

  return (
    <div className="preview-component">
      <div className="preview-label">输入框</div>
      <div className="preview-body">
        <input
          type="text"
          placeholder="请输入内容..."
          style={{
            border: `1px solid ${borderColor}`,
            borderRadius: `${radius}px`,
            padding: '10px 14px',
            fontSize: '14px',
            width: '100%',
            outline: 'none',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div className="preview-token-info">
        <span>边框: {colors.gray3.label}</span>
        <span>圆角: radius-{borderRadius.sm.label}</span>
      </div>
    </div>
  );
}

function CardPreview() {
  const colors = useDesignTokenStore((s) => s.colors);
  const spacing = useDesignTokenStore((s) => s.spacing);
  const borderRadius = useDesignTokenStore((s) => s.borderRadius);
  const shadows = useDesignTokenStore((s) => s.shadows);

  const bgColor = hslToCss(colors.background);
  const padding = spacing.lg.value;
  const radius = borderRadius.md.value;
  const shadow = shadowToCss(shadows.md);

  return (
    <div className="preview-component">
      <div className="preview-label">卡片</div>
      <div className="preview-body">
        <div
          style={{
            background: bgColor,
            padding: `${padding}px`,
            borderRadius: `${radius}px`,
            boxShadow: shadow,
            border: '1px solid #e2e2e2',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            Card Title
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
            这是一张应用了设计令牌的示例卡片组件。
          </div>
        </div>
      </div>
      <div className="preview-token-info">
        <span>背景: {colors.background.label}</span>
        <span>圆角: radius-{borderRadius.md.label}</span>
        <span>内边距: spacing-{spacing.lg.label}</span>
        <span>阴影: shadow-{shadows.md.label}</span>
      </div>
    </div>
  );
}

function Navbar() {
  const colors = useDesignTokenStore((s) => s.colors);

  const bgColor = hslToCss(colors.gray3);

  return (
    <div className="preview-component">
      <div className="preview-label">导航栏</div>
      <div className="preview-body">
        <nav
          style={{
            background: bgColor,
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            gap: '24px',
          }}
        >
          <span>首页</span>
          <span>产品</span>
          <span>关于</span>
          <span>联系</span>
        </nav>
      </div>
      <div className="preview-token-info">
        <span>背景: {colors.gray3.label}</span>
        <span>高度: 48px</span>
      </div>
    </div>
  );
}

export default function ComponentPreview() {
  return (
    <div className="component-preview">
      <div className="preview-grid">
        <PrimaryButton />
        <SecondaryButton />
        <InputField />
        <CardPreview />
        <Navbar />
      </div>
    </div>
  );
}
