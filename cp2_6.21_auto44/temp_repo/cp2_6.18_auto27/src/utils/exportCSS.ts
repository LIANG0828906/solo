/**
 * exportCSS 工具函数：导出 CSS 自定义属性
 *
 * 模块职责：
 * - 从 Zustand store 读取当前设计令牌
 * - 格式化生成标准的 CSS 自定义属性代码段
 * - 按令牌类别分组并添加注释
 *
 * 调用关系：
 * - 读取 store：通过 useDesignTokenStore.getState() 同步读取所有令牌值
 * - 被 ExportModal 组件调用，在模态框中展示代码
 */

import { useDesignTokenStore, hslToCss, shadowToCss } from '@/store/designTokenStore';

export function exportCSS(): string {
  const state = useDesignTokenStore.getState();

  const lines: string[] = [];
  lines.push(':root {');
  lines.push('');

  lines.push('  /* ===== Color Tokens ===== */');
  for (const token of Object.values(state.colors)) {
    const cssValue = hslToCss(token);
    lines.push(`  --color-${token.name}: ${cssValue};`);
  }
  lines.push('');

  lines.push('  /* ===== Spacing Tokens ===== */');
  for (const token of Object.values(state.spacing)) {
    lines.push(`  --spacing-${token.name}: ${token.value}px;`);
  }
  lines.push('');

  lines.push('  /* ===== Border Radius Tokens ===== */');
  for (const token of Object.values(state.borderRadius)) {
    const val = token.value >= 9999 ? '9999px' : `${token.value}px`;
    lines.push(`  --radius-${token.name}: ${val};`);
  }
  lines.push('');

  lines.push('  /* ===== Shadow Tokens ===== */');
  for (const token of Object.values(state.shadows)) {
    const cssValue = shadowToCss(token);
    lines.push(`  --shadow-${token.name}: ${cssValue};`);
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
