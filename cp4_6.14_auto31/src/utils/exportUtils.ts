import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import axios from 'axios'

const HTML2CANVAS_OPTIONS = {
  useCORS: true,
  scale: 2,
  backgroundColor: '#ffffff',
}

function generateTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

function generateFileName(extension: 'png' | 'pdf'): string {
  return `resume_${generateTimestamp()}.${extension}`
}

export async function exportToPNG(element: HTMLElement, onLoadingChange?: (loading: boolean) => void): Promise<void> {
  try {
    onLoadingChange?.(true)

    const canvas = await html2canvas(element, {
      ...HTML2CANVAS_OPTIONS,
      width: 1200,
      windowWidth: 1200,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const fileName = generateFileName('png')

    saveAs(dataUrl, fileName)
  } finally {
    onLoadingChange?.(false)
  }
}

export async function exportToPDF(element: HTMLElement, onLoadingChange?: (loading: boolean) => void): Promise<void> {
  try {
    onLoadingChange?.(true)

    // 步骤1：使用 html2canvas 将 HTML 元素转换为 canvas 图像
    // scale: 2 保证图片清晰度
    const canvas = await html2canvas(element, {
      ...HTML2CANVAS_OPTIONS,
      width: 1200,
      windowWidth: 1200,
    })

    // 步骤2：获取 canvas 的图像数据（PNG 格式）
    const imgData = canvas.toDataURL('image/png')

    // 步骤3：创建 A4 尺寸的 PDF 文档
    // orientation: 'portrait' 纵向
    // unit: 'mm' 单位为毫米
    // format: 'a4' A4 纸张尺寸
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // A4 页面尺寸（单位：mm）
    const pageWidth = 210
    const pageHeight = 297

    // 步骤4：计算图片在 PDF 中的尺寸，保持宽高比例
    // 图片宽度撑满页面宽度
    const imgWidth = pageWidth
    // 按比例计算图片高度
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 步骤5：分页处理
    // position 表示图片在当前 PDF 页面中的 y 轴偏移量
    let position = 0
    // 剩余未绘制的图片高度
    let heightLeft = imgHeight

    // 添加第一页的图片
    // addImage(imageData, format, x, y, width, height)
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 如果内容超过一页，循环添加新页面
    while (heightLeft > 0) {
      // 计算下一页图片的起始位置（负值表示图片向上偏移）
      position -= pageHeight
      // 添加新页面
      pdf.addPage()
      // 在新页面中绘制图片的下一部分
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // 步骤6：保存 PDF 文件
    const fileName = generateFileName('pdf')
    pdf.save(fileName)
  } finally {
    onLoadingChange?.(false)
  }
}

export interface ShareLinkResponse {
  success: boolean
  shareUrl: string
  message?: string
}

export async function generateShareLink(resumeData: unknown, onLoadingChange?: (loading: boolean) => void): Promise<string> {
  try {
    onLoadingChange?.(true)

    const response = await axios.post<ShareLinkResponse>('/api/resumes/share', {
      resume: resumeData,
    })

    if (!response.data.success) {
      throw new Error(response.data.message || '生成分享链接失败')
    }

    return response.data.shareUrl
  } finally {
    onLoadingChange?.(false)
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (!successful) {
        throw new Error('复制失败')
      }
    } catch (err) {
      document.body.removeChild(textArea)
      throw err
    }
    return
  }

  await navigator.clipboard.writeText(text)
}
