import React, { useMemo, useState, useCallback } from 'react'
import { useWeekStore, TEMPLATES } from '../store/weekStore'

const WeekPreview: React.FC = () => {
  const { template, getCurrentWeek } = useWeekStore()
  const [copyStatus, setCopyStatus] = useState<string>('')
  const currentWeek = getCurrentWeek()
  const styles = TEMPLATES[template]
  const { colors } = styles

  const copyToClipboardFallback = (text: string): boolean => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      textarea.style.left = '-9999px'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, text.length)
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch {
      return false
    }
  }

  const generateHTML = useCallback((): string => {
    if (!currentWeek) return ''

    const dividerStyle = styles.dividerStyle === 'gradient'
      ? `background: ${colors.divider}; height: ${styles.dividerHeight}; border: none; border-radius: 2px;`
      : `border: none; border-top: ${styles.dividerHeight} solid ${colors.divider};`

    const workItems = currentWeek.currentWork
      .filter((i) => i.content.trim())
      .map((i) => `<li style="margin: ${styles.listItemSpacing} 0; line-height: ${styles.lineHeight}; display: flex; align-items: flex-start; gap: 8px;"><span style="color: ${colors.listMarker}; font-weight: bold; flex-shrink: 0;">${styles.listMarker}</span><span>${i.content}</span></li>`)
      .join('')

    const planItems = currentWeek.nextPlan
      .filter((i) => i.content.trim())
      .map((i) => `<li style="margin: ${styles.listItemSpacing} 0; line-height: ${styles.lineHeight}; display: flex; align-items: flex-start; gap: 8px;"><span style="color: ${colors.listMarker}; font-weight: bold; flex-shrink: 0;">${styles.listMarker}</span><span>${i.content}</span></li>`)
      .join('')

    const reflectionHTML = currentWeek.reflection.trim()
      ? `<div style="margin-top: 12px; line-height: ${styles.lineHeight}; white-space: pre-wrap; font-size: ${styles.bodyFontSize};">${currentWeek.reflection}</div>`
      : ''

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>周报 - ${currentWeek.year}年第${currentWeek.weekNumber}周</title>
</head>
<body style="margin: 0; padding: 32px; background: #f5f5f5; font-family: ${styles.fontFamily};">
  <div style="max-width: 720px; margin: 0 auto; background: ${colors.background}; padding: 32px; box-shadow: ${styles.paperShadow}; border-radius: ${styles.borderRadius};">
    <h1 style="color: ${colors.title}; font-size: ${styles.titleFontSize}; font-weight: 700; margin: 0 0 8px 0;">周报</h1>
    <p style="color: ${colors.subtitle}; font-size: ${styles.bodyFontSize}; margin: 0 0 20px 0;">${currentWeek.year}年 第${currentWeek.weekNumber}周 · ${currentWeek.dateRange}</p>
    <hr style="${dividerStyle} margin: ${styles.paragraphSpacing} 0;" />

    <h2 style="color: ${colors.sectionTitle}; font-size: ${styles.sectionTitleFontSize}; font-weight: 600; margin: 24px 0 12px 0;">一、本周工作</h2>
    <ul style="list-style: none; padding-left: 0; color: ${colors.body}; font-size: ${styles.bodyFontSize};">
      ${workItems || '<li style="color: #999; font-style: italic;">暂无内容</li>'}
    </ul>

    <hr style="${dividerStyle} margin: 24px 0;" />

    <h2 style="color: ${colors.sectionTitle}; font-size: ${styles.sectionTitleFontSize}; font-weight: 600; margin: 24px 0 12px 0;">二、下周计划</h2>
    <ul style="list-style: none; padding-left: 0; color: ${colors.body}; font-size: ${styles.bodyFontSize};">
      ${planItems || '<li style="color: #999; font-style: italic;">暂无内容</li>'}
    </ul>

    ${currentWeek.reflection.trim() ? `<hr style="${dividerStyle} margin: 24px 0;" />` : ''}
    ${reflectionHTML ? `<h2 style="color: ${colors.sectionTitle}; font-size: ${styles.sectionTitleFontSize}; font-weight: 600; margin: 24px 0 12px 0;">三、问题与反思</h2><div style="color: ${colors.body};">${reflectionHTML}</div>` : ''}
  </div>
</body>
</html>`
  }, [currentWeek, styles, colors])

  const handleCopy = useCallback(async () => {
    const html = generateHTML()
    if (!html) {
      setCopyStatus('无内容')
      setTimeout(() => setCopyStatus(''), 2000)
      return
    }

    let success = false

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(html)
        success = true
      } catch {
        success = copyToClipboardFallback(html)
      }
    } else {
      success = copyToClipboardFallback(html)
    }

    setCopyStatus(success ? '已复制' : '复制失败')
    setTimeout(() => setCopyStatus(''), 2000)
  }, [generateHTML])

  const handleDownload = useCallback(() => {
    if (!currentWeek) return
    const html = generateHTML()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `WeekReport_${currentWeek.year}W${String(currentWeek.weekNumber).padStart(2, '0')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [currentWeek, generateHTML])

  const paperStyle = useMemo<React.CSSProperties>(() => ({
    background: colors.background,
    fontFamily: styles.fontFamily,
    borderRadius: styles.borderRadius,
    boxShadow: styles.paperShadow,
    fontSize: styles.bodyFontSize,
    lineHeight: styles.lineHeight,
  }), [colors, styles])

  const titleStyle = useMemo<React.CSSProperties>(() => ({
    color: colors.title,
    fontSize: styles.titleFontSize,
  }), [colors, styles])

  const subtitleStyle = useMemo<React.CSSProperties>(() => ({
    color: colors.subtitle,
    fontSize: styles.bodyFontSize,
  }), [colors, styles])

  const sectionTitleStyle = useMemo<React.CSSProperties>(() => ({
    color: colors.sectionTitle,
    fontSize: styles.sectionTitleFontSize,
  }), [colors, styles])

  const listStyle = useMemo<React.CSSProperties>(() => ({
    color: colors.body,
    fontSize: styles.bodyFontSize,
  }), [colors, styles])

  const listItemStyle = useMemo<React.CSSProperties>(() => ({
    margin: `${styles.listItemSpacing} 0`,
  }), [styles])

  const reflectionStyle = useMemo<React.CSSProperties>(() => ({
    color: colors.body,
    lineHeight: styles.lineHeight,
    fontSize: styles.bodyFontSize,
  }), [colors, styles])

  const dividerStyle = useMemo<React.CSSProperties>(() => {
    if (styles.dividerStyle === 'gradient') {
      return {
        background: colors.divider,
        height: styles.dividerHeight,
        border: 'none',
        borderRadius: '2px',
      }
    }
    return {
      border: 'none',
      borderTop: `${styles.dividerHeight} solid ${colors.divider}`,
    }
  }, [styles, colors.divider])

  if (!currentWeek) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="week-preview-wrapper">
      <div className="week-preview">
        <div className="preview-paper" style={paperStyle}>
          <h1 style={titleStyle}>周报</h1>
          <p className="preview-subtitle" style={subtitleStyle}>
            {currentWeek.year}年 第{currentWeek.weekNumber}周 · {currentWeek.dateRange}
          </p>
          <hr className="preview-divider" style={dividerStyle} />

          <h2 style={sectionTitleStyle}>一、本周工作</h2>
          <ul className="preview-list" style={listStyle}>
            {currentWeek.currentWork.filter((i) => i.content.trim()).length > 0 ? (
              currentWeek.currentWork
                .filter((i) => i.content.trim())
                .map((item) => (
                  <li key={item.id} style={listItemStyle}>
                    <span className="list-marker" style={{ color: colors.listMarker }}>
                      {styles.listMarker}
                    </span>
                    {item.content}
                  </li>
                ))
            ) : (
              <li className="empty-item">暂无内容</li>
            )}
          </ul>

          <hr className="preview-divider" style={dividerStyle} />

          <h2 style={sectionTitleStyle}>二、下周计划</h2>
          <ul className="preview-list" style={listStyle}>
            {currentWeek.nextPlan.filter((i) => i.content.trim()).length > 0 ? (
              currentWeek.nextPlan
                .filter((i) => i.content.trim())
                .map((item) => (
                  <li key={item.id} style={listItemStyle}>
                    <span className="list-marker" style={{ color: colors.listMarker }}>
                      {styles.listMarker}
                    </span>
                    {item.content}
                  </li>
                ))
            ) : (
              <li className="empty-item">暂无内容</li>
            )}
          </ul>

          {currentWeek.reflection.trim() && (
            <>
              <hr className="preview-divider" style={dividerStyle} />
              <h2 style={sectionTitleStyle}>三、问题与反思</h2>
              <div className="preview-reflection" style={reflectionStyle}>
                {currentWeek.reflection}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="action-btn copy-btn"
          onClick={handleCopy}
          style={{ ['--accent' as string]: colors.accent }}
        >
          {copyStatus || '复制 HTML'}
        </button>
        <button
          type="button"
          className="action-btn download-btn"
          onClick={handleDownload}
          style={{ ['--accent' as string]: colors.accent }}
        >
          下载文件
        </button>
      </div>
    </div>
  )
}

export default WeekPreview
