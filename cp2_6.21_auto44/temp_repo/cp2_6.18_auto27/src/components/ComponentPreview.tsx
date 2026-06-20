/**
 * ComponentPreview 组件：组件预览区
 *
 * 模块职责：
 * - 实时渲染一组标准组件（主按钮、辅按钮、输入框、卡片、导航栏）
 * - 将设计令牌动态应用到组件样式上
 * - 展示每个组件所使用的令牌名称和值
 *
 * 调用关系：
 * - 读取 store：通过 useDesignTokenStore(selector) 订阅令牌变化
 * - 数据流向：store 更新 → selector 触发 → 组件重新渲染 → 样式实时更新
 */

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
        <span>主色令牌: {bgColor}</span>
        <span>圆角令牌: {radius}px</span>
        <span>间距令牌: {px}px</span>
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
        <span>辅色令牌: {bgColor}</span>
        <span>圆角令牌: {radius}px</span>
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
        <span>灰色阶3令牌: {borderColor}</span>
        <span>圆角令牌: {radius}px</span>
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
        <span>背景色令牌: {bgColor}</span>
        <span>圆角令牌: {radius}px</span>
        <span>间距令牌: {padding}px</span>
        <span>阴影令牌: {shadow}</span>
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
        <span>灰色阶3令牌: {bgColor}</span>
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
