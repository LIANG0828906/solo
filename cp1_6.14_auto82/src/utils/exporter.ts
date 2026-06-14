import domtoimage from 'dom-to-image'
import { jsPDF } from 'jspdf'

export async function toPng(node: HTMLElement, scale: number = 2): Promise<string> {
  try {
    const dataUrl = await domtoimage.toPng(node, {
      quality: 1,
      bgcolor: undefined,
      height: node.offsetHeight * scale,
      width: node.offsetWidth * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${node.offsetWidth}px`,
        height: `${node.offsetHeight}px`
      }
    })
    return dataUrl
  } catch (error) {
    throw new Error(`生成 PNG 失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function downloadPng(node: HTMLElement, filename?: string): Promise<void> {
  try {
    const dataUrl = await toPng(node)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename || 'newspaper-cover.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    throw new Error(`下载 PNG 失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function downloadPdf(node: HTMLElement, filename?: string): Promise<void> {
  try {
    const dataUrl = await toPng(node, 2)

    const img = new Image()
    img.src = dataUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const a4Width = 210
    const a4Height = 297
    const imgWidth = img.width
    const imgHeight = img.height
    const ratio = imgHeight / imgWidth

    const pdfWidth = a4Width
    const pdfHeight = pdfWidth * ratio

    let x = 0
    let y = 0

    if (pdfHeight > a4Height) {
      const heightRatio = a4Height / pdfHeight
      const finalWidth = pdfWidth * heightRatio
      x = (a4Width - finalWidth) / 2
      pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, a4Height)
    } else {
      y = (a4Height - pdfHeight) / 2
      pdf.addImage(dataUrl, 'PNG', x, y, pdfWidth, pdfHeight)
    }

    pdf.save(filename || 'newspaper-cover.pdf')
  } catch (error) {
    throw new Error(`生成 PDF 失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function generateThumbnail(node: HTMLElement): Promise<string> {
  try {
    const targetWidth = 400
    const scale = 0.5
    const dataUrl = await domtoimage.toPng(node, {
      quality: 1,
      bgcolor: undefined,
      width: targetWidth,
      height: (node.offsetHeight / node.offsetWidth) * targetWidth
    })
    return dataUrl
  } catch (error) {
    throw new Error(`生成缩略图失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
