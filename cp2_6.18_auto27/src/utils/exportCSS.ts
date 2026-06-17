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
