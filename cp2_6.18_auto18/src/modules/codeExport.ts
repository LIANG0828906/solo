import { useColorStore } from '@/store/useColorStore'
import { getDarkVariant, getLightVariant } from '@/modules/colorHarmony'
import chroma from 'chroma-js'

export function generateCSSVariables(): string {
  const colorScheme = useColorStore.getState().colorScheme
  const primary = colorScheme.primary
  const secondary1 = colorScheme.secondary[0] || '#888888'
  const secondary2 = colorScheme.secondary[1] || secondary1
  const darkVariant = getDarkVariant(primary)
  const lightBg = getLightVariant()
  const primaryLight = chroma(primary).brighten(1.5).hex()

  return `:root {
  --primary-color: ${primary};
  --primary-light: ${primaryLight};
  --secondary-color: ${secondary1};
  --secondary-color-2: ${secondary2};
  --bg-dark: ${darkVariant};
  --bg-light: ${lightBg};
  --text-on-primary: #FFFFFF;
  --text-on-dark: #FFFFFF;
  --border-dashed: ${secondary1};
}`
}

export async function copyCSSToClipboard(): Promise<void> {
  const css = generateCSSVariables()
  try {
    await navigator.clipboard.writeText(css)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = css
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}
