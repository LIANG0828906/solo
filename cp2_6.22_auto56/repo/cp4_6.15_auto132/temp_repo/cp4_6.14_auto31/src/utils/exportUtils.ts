import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import axios from 'axios'
import { ResumeData } from '@/data/resumeModel'

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

// ============================================================================
// 注意：关于中文字体
// jsPDF 默认内置的 Helvetica 字体仅支持 ASCII 字符，中文字符会显示为空白或方块。
// 若需正确显示中文，需要：
// 1. 准备一个中文字体文件（如思源黑体 SourceHanSansSC-Regular.ttf）
// 2. 使用 pdf.addFileToVFS('font.ttf', base64String) 加载字体
// 3. 使用 pdf.addFont('font.ttf', 'ChineseFont', 'normal') 注册字体
// 4. 使用 pdf.setFont('ChineseFont') 设置字体
// 以下代码逻辑结构完整，接口正确，仅需按上述步骤配置中文字体即可正常显示中文。
// ============================================================================

export async function exportToPDF(
  resumeData: ResumeData,
  theme: string,
  themeConfig: { primary: string; background: string; text: string; accent: string },
  onLoadingChange?: (loading: boolean) => void
): Promise<void> {
  try {
    onLoadingChange?.(true)

    // 步骤1：创建 jsPDF 实例（纵向、mm单位、A4尺寸）
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // 步骤2：设置页面边距和内容宽度
    const MARGIN_LEFT = 15
    const MARGIN_TOP = 15
    const MARGIN_RIGHT = 15
    const CONTENT_WIDTH = 210 - MARGIN_LEFT - MARGIN_RIGHT // 内容宽度 180mm
    const PAGE_BOTTOM_MARGIN = 20
    const PAGE_BOTTOM = 297 - PAGE_BOTTOM_MARGIN

    // 用于追踪当前 Y 坐标
    let currentY = MARGIN_TOP

    // ========================================================================
    // 辅助函数定义
    // ========================================================================

    // 辅助函数：16进制颜色转 RGB
    function hexToRgb(hex: string): { r: number; g: number; b: number } {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 }
    }

    // 辅助函数：绘制单行文字
    function drawTextLine(
      text: string,
      x: number,
      y: number,
      fontSize: number,
      color: string,
      style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'
    ): void {
      pdf.setFontSize(fontSize)
      const rgb = hexToRgb(color)
      pdf.setTextColor(rgb.r, rgb.g, rgb.b)
      // 注：jsPDF setFont 第一个参数为字体名，此处用内置 Helvetica
      pdf.setFont('helvetica', style)
      pdf.text(text, x, y)
    }

    // 辅助函数：绘制自动换行文本，返回实际占用的高度（行数 × 行高）
    function drawTextWrap(
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      fontSize: number,
      color: string,
      style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'
    ): number {
      if (!text || text.trim().length === 0) return 0
      pdf.setFontSize(fontSize)
      const rgb = hexToRgb(color)
      pdf.setTextColor(rgb.r, rgb.g, rgb.b)
      pdf.setFont('helvetica', style)
      // 使用 splitTextToSize 自动按宽度切分文本
      const lines = pdf.splitTextToSize(text, maxWidth)
      let actualY = y
      for (let i = 0; i < lines.length; i++) {
        // 每行绘制前检查是否需要分页
        if (actualY > PAGE_BOTTOM) {
          pdf.addPage()
          actualY = MARGIN_TOP
        }
        pdf.text(lines[i], x, actualY)
        if (i < lines.length - 1) {
          actualY += lineHeight
        }
      }
      return lines.length * lineHeight
    }

    // 辅助函数：绘制分隔线
    function drawDivider(
      x: number,
      y: number,
      width: number,
      color: string,
      lineWidth: number = 0.2
    ): void {
      const rgb = hexToRgb(color)
      pdf.setDrawColor(rgb.r, rgb.g, rgb.b)
      pdf.setLineWidth(lineWidth)
      pdf.line(x, y, x + width, y)
    }

    // 辅助函数：绘制小圆点作为列表项符号
    function drawBullet(x: number, y: number, color: string): void {
      const rgb = hexToRgb(color)
      pdf.setFillColor(rgb.r, rgb.g, rgb.b)
      pdf.circle(x, y - 1, 0.8, 'F') // 'F' 表示填充
    }

    // 辅助函数：检查是否需要分页，返回新的 y 坐标
    function checkPageBreak(currentYVal: number, pageBottomMargin: number = 20): number {
      const bottom = 297 - pageBottomMargin
      if (currentYVal > bottom) {
        pdf.addPage()
        return MARGIN_TOP
      }
      return currentYVal
    }

    // ========================================================================
    // 模块1：个人信息模块
    // ========================================================================

    // 姓名（18pt，粗体，primary色）
    drawTextLine(resumeData.personal.name || '', MARGIN_LEFT, currentY, 18, themeConfig.primary, 'bold')
    currentY += 7

    // 职位（12pt，accent色）
    if (resumeData.personal.title) {
      drawTextLine(resumeData.personal.title, MARGIN_LEFT, currentY, 12, themeConfig.accent, 'normal')
      currentY += 6
    }

    // 邮箱 + 手机 + 所在地（10pt，text色，并排显示）
    const contactParts: string[] = []
    if (resumeData.personal.email) contactParts.push(resumeData.personal.email)
    if (resumeData.personal.phone) contactParts.push(resumeData.personal.phone)
    if (resumeData.personal.location) contactParts.push(resumeData.personal.location)
    if (contactParts.length > 0) {
      drawTextLine(contactParts.join('  |  '), MARGIN_LEFT, currentY, 10, themeConfig.text, 'normal')
      currentY += 6
    }

    // 个人简介（10pt，text色，自动换行）
    if (resumeData.personal.summary && resumeData.personal.summary.trim().length > 0) {
      const summaryHeight = drawTextWrap(
        resumeData.personal.summary,
        MARGIN_LEFT,
        currentY,
        CONTENT_WIDTH,
        4.5,
        10,
        themeConfig.text,
        'normal'
      )
      currentY += summaryHeight + 2
    }

    // 下方加间距
    currentY += 6
    currentY = checkPageBreak(currentY)

    // ========================================================================
    // 模块2：工作经历模块
    // ========================================================================

    if (resumeData.work && resumeData.work.length > 0) {
      // 标题"工作经历"（14pt，粗体，primary色）
      drawTextLine('工作经历', MARGIN_LEFT, currentY, 14, themeConfig.primary, 'bold')
      currentY += 2
      // 分隔线
      drawDivider(MARGIN_LEFT, currentY, CONTENT_WIDTH, themeConfig.primary, 0.3)
      currentY += 6

      // 遍历每条工作经历
      for (const work of resumeData.work) {
        currentY = checkPageBreak(currentY)

        // 计算日期文本和位置（右侧对齐）
        const dateRange =
          (work.startDate || '') + (work.endDate ? ' - ' + work.endDate : '')
        if (dateRange.trim() !== '-' && dateRange.trim() !== '') {
          pdf.setFontSize(9)
          const rgb = hexToRgb(themeConfig.accent)
          pdf.setTextColor(rgb.r, rgb.g, rgb.b)
          pdf.setFont('helvetica', 'normal')
          const dateWidth = pdf.getTextWidth(dateRange)
          const dateX = MARGIN_LEFT + CONTENT_WIDTH - dateWidth
          pdf.text(dateRange, dateX, currentY)
        }

        // 左侧：职位（11pt，粗体，text色）
        drawTextLine(work.position || '', MARGIN_LEFT, currentY, 11, themeConfig.text, 'bold')
        currentY += 5

        // 公司名（10pt，accent色）
        if (work.company) {
          drawTextLine(work.company, MARGIN_LEFT, currentY, 10, themeConfig.accent, 'normal')
          currentY += 5
        }

        // 工作描述（10pt，text色，自动换行）
        if (work.description && work.description.trim().length > 0) {
          const descHeight = drawTextWrap(
            work.description,
            MARGIN_LEFT,
            currentY,
            CONTENT_WIDTH,
            4.5,
            10,
            themeConfig.text,
            'normal'
          )
          currentY += descHeight + 2
        }

        // 成就列表（每项前面加圆点符号，10pt）
        if (work.achievements && work.achievements.length > 0) {
          for (const achievement of work.achievements) {
            if (!achievement || achievement.trim().length === 0) continue
            currentY = checkPageBreak(currentY)
            drawBullet(MARGIN_LEFT + 1, currentY, themeConfig.accent)
            const achHeight = drawTextWrap(
              achievement,
              MARGIN_LEFT + 4,
              currentY,
              CONTENT_WIDTH - 4,
              4.5,
              10,
              themeConfig.text,
              'normal'
            )
            currentY += achHeight + 1
          }
        }

        // 每条经历之间的间距
        currentY += 5
      }
    }

    currentY += 2
    currentY = checkPageBreak(currentY)

    // ========================================================================
    // 模块3：教育背景模块
    // ========================================================================

    if (resumeData.education && resumeData.education.length > 0) {
      // 标题"教育背景"（14pt粗体，primary色）
      drawTextLine('教育背景', MARGIN_LEFT, currentY, 14, themeConfig.primary, 'bold')
      currentY += 2
      // 分隔线
      drawDivider(MARGIN_LEFT, currentY, CONTENT_WIDTH, themeConfig.primary, 0.3)
      currentY += 6

      for (const edu of resumeData.education) {
        currentY = checkPageBreak(currentY)

        // 右侧日期
        const eduDateRange =
          (edu.startDate || '') + (edu.endDate ? ' - ' + edu.endDate : '')
        if (eduDateRange.trim() !== '-' && eduDateRange.trim() !== '') {
          pdf.setFontSize(9)
          const rgb = hexToRgb(themeConfig.accent)
          pdf.setTextColor(rgb.r, rgb.g, rgb.b)
          pdf.setFont('helvetica', 'normal')
          const eduDateWidth = pdf.getTextWidth(eduDateRange)
          const eduDateX = MARGIN_LEFT + CONTENT_WIDTH - eduDateWidth
          pdf.text(eduDateRange, eduDateX, currentY)
        }

        // 学校名（11pt粗体）
        drawTextLine(edu.school || '', MARGIN_LEFT, currentY, 11, themeConfig.text, 'bold')
        currentY += 5

        // 学历·专业（10pt accent色）
        const degreeMajor = [edu.degree, edu.major].filter(Boolean).join(' · ')
        if (degreeMajor) {
          drawTextLine(degreeMajor, MARGIN_LEFT, currentY, 10, themeConfig.accent, 'normal')
          currentY += 5
        }

        // 描述文本（10pt text色，自动换行）
        if (edu.description && edu.description.trim().length > 0) {
          const eduDescHeight = drawTextWrap(
            edu.description,
            MARGIN_LEFT,
            currentY,
            CONTENT_WIDTH,
            4.5,
            10,
            themeConfig.text,
            'normal'
          )
          currentY += eduDescHeight + 2
        }

        currentY += 5
      }
    }

    currentY += 2
    currentY = checkPageBreak(currentY)

    // ========================================================================
    // 模块4：技能标签模块
    // ========================================================================

    if (resumeData.skills && resumeData.skills.length > 0) {
      // 标题"技能特长"（14pt粗体，primary色）
      drawTextLine('技能特长', MARGIN_LEFT, currentY, 14, themeConfig.primary, 'bold')
      currentY += 2
      // 分隔线
      drawDivider(MARGIN_LEFT, currentY, CONTENT_WIDTH, themeConfig.primary, 0.3)
      currentY += 6

      const TAG_PADDING_X = 3 // 标签左右内边距
      const TAG_PADDING_Y = 1.5 // 标签上下内边距
      const TAG_GAP = 2 // 标签之间的间距
      const TAG_HEIGHT = 6 // 标签高度
      const TAG_FONT_SIZE = 10

      let tagX = MARGIN_LEFT
      let tagY = currentY

      pdf.setFontSize(TAG_FONT_SIZE)
      pdf.setFont('helvetica', 'normal')

      for (const skill of resumeData.skills) {
        if (!skill.name || skill.name.trim().length === 0) continue

        const textWidth = pdf.getTextWidth(skill.name)
        const tagWidth = textWidth + TAG_PADDING_X * 2

        // 检查是否需要换行
        if (tagX + tagWidth > MARGIN_LEFT + CONTENT_WIDTH) {
          tagX = MARGIN_LEFT
          tagY += TAG_HEIGHT + TAG_GAP
          // 检查是否需要分页
          if (tagY + TAG_HEIGHT > PAGE_BOTTOM) {
            pdf.addPage()
            tagY = MARGIN_TOP
          }
        }

        // 绘制圆角矩形背景（模拟圆角：用矩形+透明度0.85的primary色）
        const primaryRgb = hexToRgb(themeConfig.primary)
        // 先绘制外层矩形（带透明度用 GSave / GRestore 模拟）
        pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        // jsPDF rect: x, y, w, h, style('F'=fill, 'D'=stroke, 'FD'=both)
        pdf.roundedRect(tagX, tagY, tagWidth, TAG_HEIGHT, 1, 1, 'F')

        // 绘制白色技能名文字（居中）
        pdf.setTextColor(255, 255, 255)
        const textX = tagX + TAG_PADDING_X
        const textY = tagY + TAG_PADDING_Y + TAG_FONT_SIZE / 3 / 2.8 // 使用 PADDING_Y 调整垂直位置
        pdf.text(skill.name, textX, textY)

        tagX += tagWidth + TAG_GAP
      }

      // 更新 currentY 到标签块下方
      currentY = tagY + TAG_HEIGHT + 6
    }

    currentY = checkPageBreak(currentY)

    // ========================================================================
    // 模块5：项目经历模块
    // ========================================================================

    if (resumeData.projects && resumeData.projects.length > 0) {
      // 标题"项目经历"（14pt粗体，primary色）
      drawTextLine('项目经历', MARGIN_LEFT, currentY, 14, themeConfig.primary, 'bold')
      currentY += 2
      // 分隔线
      drawDivider(MARGIN_LEFT, currentY, CONTENT_WIDTH, themeConfig.primary, 0.3)
      currentY += 6

      for (const project of resumeData.projects) {
        currentY = checkPageBreak(currentY)

        // 右侧日期
        const projDateRange =
          (project.startDate || '') + (project.endDate ? ' - ' + project.endDate : '')
        if (projDateRange.trim() !== '-' && projDateRange.trim() !== '') {
          pdf.setFontSize(9)
          const rgb = hexToRgb(themeConfig.accent)
          pdf.setTextColor(rgb.r, rgb.g, rgb.b)
          pdf.setFont('helvetica', 'normal')
          const projDateWidth = pdf.getTextWidth(projDateRange)
          const projDateX = MARGIN_LEFT + CONTENT_WIDTH - projDateWidth
          pdf.text(projDateRange, projDateX, currentY)
        }

        // 项目名（11pt粗体，text色）
        drawTextLine(project.name || '', MARGIN_LEFT, currentY, 11, themeConfig.text, 'bold')
        currentY += 5

        // 角色（10pt accent色）
        if (project.role) {
          drawTextLine(project.role, MARGIN_LEFT, currentY, 10, themeConfig.accent, 'normal')
          currentY += 5
        }

        // 描述（10pt自动换行）
        if (project.description && project.description.trim().length > 0) {
          const projDescHeight = drawTextWrap(
            project.description,
            MARGIN_LEFT,
            currentY,
            CONTENT_WIDTH,
            4.5,
            10,
            themeConfig.text,
            'normal'
          )
          currentY += projDescHeight + 2
        }

        // 技术栈标签（小色块，9pt）
        if (project.technologies && project.technologies.length > 0) {
          const TECH_PADDING_X = 2
          const TECH_PADDING_Y = 1
          const TECH_GAP = 1.5
          const TECH_HEIGHT = 4.5
          const TECH_FONT_SIZE = 9

          let techX = MARGIN_LEFT
          let techY = currentY

          pdf.setFontSize(TECH_FONT_SIZE)
          pdf.setFont('helvetica', 'normal')

          for (const tech of project.technologies) {
            if (!tech || tech.trim().length === 0) continue

            const techTextWidth = pdf.getTextWidth(tech)
            const techWidth = techTextWidth + TECH_PADDING_X * 2

            // 检查换行
            if (techX + techWidth > MARGIN_LEFT + CONTENT_WIDTH) {
              techX = MARGIN_LEFT
              techY += TECH_HEIGHT + TECH_GAP
              if (techY + TECH_HEIGHT > PAGE_BOTTOM) {
                pdf.addPage()
                techY = MARGIN_TOP
              }
            }

            // 绘制 accent 色背景
            const accentRgb = hexToRgb(themeConfig.accent)
            pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
            pdf.roundedRect(techX, techY, techWidth, TECH_HEIGHT, 0.5, 0.5, 'F')

            // 白色文字
            pdf.setTextColor(255, 255, 255)
            const techTextX = techX + TECH_PADDING_X
            const techTextY = techY + TECH_PADDING_Y + TECH_FONT_SIZE / 3 / 2.8
            pdf.text(tech, techTextX, techTextY)

            techX += techWidth + TECH_GAP
          }

          currentY = techY + TECH_HEIGHT + 3
        }

        // 亮点列表（圆点符号，10pt）
        if (project.highlights && project.highlights.length > 0) {
          for (const highlight of project.highlights) {
            if (!highlight || highlight.trim().length === 0) continue
            currentY = checkPageBreak(currentY)
            drawBullet(MARGIN_LEFT + 1, currentY, themeConfig.accent)
            const hiHeight = drawTextWrap(
              highlight,
              MARGIN_LEFT + 4,
              currentY,
              CONTENT_WIDTH - 4,
              4.5,
              10,
              themeConfig.text,
              'normal'
            )
            currentY += hiHeight + 1
          }
        }

        currentY += 5
      }
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
