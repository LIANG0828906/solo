import html2canvas from 'html2canvas'

export async function generatePoster(element: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0A1A3D',
    scale: 2,
    useCORS: true,
    logging: false,
  })
  return canvas
}

export async function downloadPoster(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await generatePoster(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
