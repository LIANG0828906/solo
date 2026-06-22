import { useMemo } from 'react';
import { useTokenStore } from '../store/tokenStore';
import './PreviewCard.css';

export function PreviewCard() {
  const tokens = useTokenStore((state) => state.tokens);
  const resetAnimationKey = useTokenStore((state) => state.resetAnimationKey);

  const cardStyle = useMemo(() => {
    const getValue = (name: string) => {
      const token = tokens.find((t) => t.name === name);
      return token?.value;
    };

    return {
      '--preview-bg': getValue('color.surface') || '#FFFFFF',
      '--preview-text': getValue('color.text') || '#1E293B',
      '--preview-text-light': getValue('color.textLight') || '#64748B',
      '--preview-primary': getValue('color.primary') || '#0EA5E9',
      '--preview-border': getValue('color.border') || '#E2E8F0',
      '--preview-padding-lg': getValue('spacing.lg') || '24px',
      '--preview-padding-md': getValue('spacing.md') || '16px',
      '--preview-padding-sm': getValue('spacing.sm') || '8px',
      '--preview-font-family': getValue('font.family.sans') || 'system-ui, sans-serif',
      '--preview-font-size-xl': getValue('font.size.xl') || '24px',
      '--preview-font-size-base': getValue('font.size.base') || '16px',
      '--preview-font-size-sm': getValue('font.size.sm') || '14px',
      '--preview-font-weight-bold': getValue('font.weight.bold') || '700',
      '--preview-font-weight-medium': getValue('font.weight.medium') || '500',
    } as React.CSSProperties;
  }, [tokens]);

  return (
    <div className="preview-wrapper">
      <h3 className="preview-title">实时预览</h3>
      <div
        key={resetAnimationKey}
        className="preview-card"
        style={cardStyle}
      >
        <div className="preview-card-header">
          <h4 className="preview-card-title">设计令牌示例卡片</h4>
          <span className="preview-card-badge">New</span>
        </div>
        <p className="preview-card-body">
          这是一个动态预览卡片。当你修改左侧的设计令牌时，
          这个卡片的颜色、间距和字体会实时更新，帮助你直观地感受设计变化。
        </p>
        <div className="preview-card-actions">
          <button className="preview-btn preview-btn-primary">
            主要按钮
          </button>
          <button className="preview-btn preview-btn-secondary">
            了解更多
          </button>
        </div>
      </div>
    </div>
  );
}
