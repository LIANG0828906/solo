import type {
  Component,
  ButtonComponent,
  CardComponent,
  InputComponent,
  NavbarComponent,
  BadgeComponent,
  CanvasComponent,
} from '../types'

interface GeneratedCode {
  html: string
  css: string
  js: string
}

const buttonVariantStyles: Record<ButtonComponent['variant'], { bg: string; color: string; border: string }> = {
  primary: { bg: '#3b82f6', color: '#ffffff', border: 'none' },
  secondary: { bg: '#6b7280', color: '#ffffff', border: 'none' },
  outline: { bg: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' },
  ghost: { bg: 'transparent', color: '#374151', border: 'none' },
  destructive: { bg: '#ef4444', color: '#ffffff', border: 'none' },
}

const buttonSizeStyles: Record<ButtonComponent['size'], { padding: string; fontSize: string }> = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '8px 16px', fontSize: '14px' },
  lg: { padding: '10px 20px', fontSize: '16px' },
}

const badgeVariantStyles: Record<BadgeComponent['variant'], { bg: string; color: string }> = {
  default: { bg: '#e5e7eb', color: '#374151' },
  primary: { bg: '#dbeafe', color: '#1d4ed8' },
  success: { bg: '#dcfce7', color: '#15803d' },
  warning: { bg: '#fef3c7', color: '#b45309' },
  danger: { bg: '#fee2e2', color: '#b91c1c' },
}

const inputVariantStyles: Record<InputComponent['variant'], { border: string; bg: string }> = {
  default: { border: '1px solid #d1d5db', bg: '#ffffff' },
  outlined: { border: '2px solid #9ca3af', bg: '#ffffff' },
  filled: { border: 'none', bg: '#f3f4f6' },
}

function generateButtonHtml(comp: ButtonComponent): string {
  return `<button id="btn-${comp.id}" class="generated-btn" ${comp.disabled ? 'disabled' : ''}>${comp.text}</button>`
}

function generateButtonCss(comp: ButtonComponent): string {
  const variant = buttonVariantStyles[comp.variant]
  const size = buttonSizeStyles[comp.size]
  return `
#btn-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  z-index: ${comp.zIndex};
  padding: ${size.padding};
  font-size: ${size.fontSize};
  background-color: ${variant.bg};
  color: ${variant.color};
  border: ${variant.border};
  border-radius: 6px;
  cursor: ${comp.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${comp.disabled ? '0.5' : '1'};
  transition: all 0.2s ease;
  font-weight: 500;
}
#btn-${comp.id}:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  filter: brightness(1.1);
}
#btn-${comp.id}:active:not(:disabled) {
  transform: translateY(0);
}
`
}

function generateButtonJs(comp: ButtonComponent): string {
  if (comp.disabled) return ''
  return `
document.getElementById('btn-${comp.id}').addEventListener('click', function() {
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    this.style.transform = '';
  }, 150);
  console.log('Button ${comp.text} clicked');
});
`
}

function generateCardHtml(comp: CardComponent): string {
  const imageHtml = comp.imageUrl ? `<img src="${comp.imageUrl}" alt="${comp.title}" class="card-img" />` : ''
  return `
<div id="card-${comp.id}" class="generated-card">
  ${imageHtml}
  <div class="card-content">
    <h3 class="card-title">${comp.title}</h3>
    <p class="card-description">${comp.description}</p>
  </div>
</div>
`
}

function generateCardCss(comp: CardComponent): string {
  return `
#card-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  z-index: ${comp.zIndex};
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}
#card-${comp.id}:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
#card-${comp.id} .card-img {
  width: 100%;
  height: 50%;
  object-fit: cover;
}
#card-${comp.id} .card-content {
  padding: 16px;
}
#card-${comp.id} .card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
#card-${comp.id} .card-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}
`
}

function generateCardJs(comp: CardComponent): string {
  return `
document.getElementById('card-${comp.id}').addEventListener('mouseenter', function() {
  this.style.transform = 'translateY(-4px)';
});
document.getElementById('card-${comp.id}').addEventListener('mouseleave', function() {
  this.style.transform = '';
});
`
}

function generateInputHtml(comp: InputComponent): string {
  const labelHtml = comp.label ? `<label for="input-${comp.id}" class="input-label">${comp.label}${comp.required ? ' *' : ''}</label>` : ''
  return `
<div class="input-wrapper">
  ${labelHtml}
  <input type="text" id="input-${comp.id}" class="generated-input" placeholder="${comp.placeholder}" ${comp.required ? 'required' : ''} />
</div>
`
}

function generateInputCss(comp: InputComponent): string {
  const variant = inputVariantStyles[comp.variant]
  return `
#input-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  z-index: ${comp.zIndex};
  padding: 8px 12px;
  font-size: 14px;
  border: ${variant.border};
  border-radius: 6px;
  background-color: ${variant.bg};
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
#input-${comp.id}:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #ffffff;
}
#input-${comp.id}::placeholder {
  color: #9ca3af;
}
`
}

function generateInputJs(comp: InputComponent): string {
  return `
document.getElementById('input-${comp.id}').addEventListener('focus', function() {
  this.style.borderColor = '#3b82f6';
  this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
});
document.getElementById('input-${comp.id}').addEventListener('blur', function() {
  this.style.borderColor = '';
  this.style.boxShadow = '';
});
`
}

function generateNavbarHtml(comp: NavbarComponent): string {
  const linksHtml = comp.links
    .map((link) => `<a href="${link.href}" class="nav-link">${link.label}</a>`)
    .join('')
  return `
<nav id="navbar-${comp.id}" class="generated-navbar">
  <div class="nav-brand">${comp.brand}</div>
  <div class="nav-links">
    ${linksHtml}
  </div>
</nav>
`
}

function generateNavbarCss(comp: NavbarComponent): string {
  const isDark = comp.theme === 'dark'
  const bgColor = isDark ? '#1f2937' : '#ffffff'
  const textColor = isDark ? '#f9fafb' : '#111827'
  const borderColor = isDark ? '#374151' : '#e5e7eb'
  return `
#navbar-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  z-index: ${comp.zIndex};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: ${bgColor};
  color: ${textColor};
  border-bottom: 1px solid ${borderColor};
  box-sizing: border-box;
}
#navbar-${comp.id} .nav-brand {
  font-size: 18px;
  font-weight: 700;
}
#navbar-${comp.id} .nav-links {
  display: flex;
  gap: 24px;
}
#navbar-${comp.id} .nav-link {
  color: ${textColor};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
#navbar-${comp.id} .nav-link:hover {
  opacity: 1;
}
`
}

function generateNavbarJs(_comp: NavbarComponent): string {
  return ''
}

function generateBadgeHtml(comp: BadgeComponent): string {
  return `<span id="badge-${comp.id}" class="generated-badge">${comp.text}</span>`
}

function generateBadgeCss(comp: BadgeComponent): string {
  const variant = badgeVariantStyles[comp.variant]
  return `
#badge-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  z-index: ${comp.zIndex};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${comp.width}px;
  height: ${comp.height}px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${variant.bg};
  color: ${variant.color};
  border-radius: 9999px;
  box-sizing: border-box;
  transition: transform 0.2s ease;
  cursor: default;
}
#badge-${comp.id}:hover {
  transform: scale(1.05);
}
`
}

function generateBadgeJs(_comp: BadgeComponent): string {
  return ''
}

function generateCanvasCss(comp: CanvasComponent): string {
  return `
#canvas-${comp.id} {
  position: absolute;
  left: ${comp.x}px;
  top: ${comp.y}px;
  width: ${comp.width}px;
  height: ${comp.height}px;
  z-index: ${comp.zIndex};
  background-color: ${comp.backgroundColor};
  border-radius: ${comp.borderRadius}px;
}
`
}

export function generateCode(components: Component[]): GeneratedCode {
  let html = ''
  let css = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f9fafb;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
`
  let js = `
document.addEventListener('DOMContentLoaded', function() {
`

  for (const comp of components) {
    switch (comp.type) {
      case 'button':
        html += generateButtonHtml(comp) + '\n'
        css += generateButtonCss(comp)
        js += generateButtonJs(comp)
        break
      case 'card':
        html += generateCardHtml(comp) + '\n'
        css += generateCardCss(comp)
        js += generateCardJs(comp)
        break
      case 'input':
        html += generateInputHtml(comp) + '\n'
        css += generateInputCss(comp)
        js += generateInputJs(comp)
        break
      case 'navbar':
        html += generateNavbarHtml(comp) + '\n'
        css += generateNavbarCss(comp)
        js += generateNavbarJs(comp)
        break
      case 'badge':
        html += generateBadgeHtml(comp) + '\n'
        css += generateBadgeCss(comp)
        js += generateBadgeJs(comp)
        break
      case 'canvas':
        html += `<div id="canvas-${comp.id}" class="generated-canvas"></div>\n`
        css += generateCanvasCss(comp)
        break
    }
  }

  js += `
});
`

  return { html, css, js }
}

export function generateFullHtml(components: Component[]): string {
  const { html, css, js } = generateCode(components)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated Design</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>
`
}
