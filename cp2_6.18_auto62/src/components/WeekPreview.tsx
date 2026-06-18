import React, { useMemo, useState, useCallback } from 'react'
import { useWeekStore, TEMPLATES } from '../store/weekStore'

const WeekPreview: React.FC = () => {
  const { template, getCurrentWeek } = useWeekStore()
  const [copyStatus, setCopyStatus] = useState<string>('')
  const currentWeek = getCurrentWeek()
  const colors = TEMPLATES[template]

  const generateHTML = useCallback((): string => {
    if (!currentWeek) return ''

    const dividerStyle = template === 'creative'
      ? `background: ${colors.divider}; height: 2px; border: none;`
      : `border: none; border-top: 1px solid ${colors.divider};`

    const listMarker = template === 'professional' ? '•' : '✓'

    const workItems = currentWeek.currentWork
      .filter((i) => i.content.trim())
      .map((i) => `<li style="margin: 8px 0; line-height: 1.6;"><span style="color: ${colors.listMarker}; font-weight: bold; margin-right: 8px;">${listMarker}</span>${i.content}</li>`)
      .join('')

    const planItems = currentWeek.nextPlan
      .filter((i) => i.content.trim())
      .map((i) => `<li style="margin: 8px 0; line-height: 1.6;"><span style="color: ${colors.listMarker}; font-weight: bold; margin-right: 8px;">${listMarker}</span>${i.content}</li>`)
      .join('')

    const reflectionHTML = currentWeek.reflection.trim()
      ? `<div style="margin-top: 12px; line-height: 1.8; white-space: pre-wrap;">${currentWeek.reflection}</div>`
      : ''

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>周报 - ${currentWeek.year}年第${currentWeek.weekNumber}周</title>
</head>
<body style="margin: 0; padding: 32px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 720px; margin: 0 auto; background: #ffffff; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 8px;">
    <h1 style="color: ${colors.title}; font-size: 24px; margin: 0 0 8px 0;">周报</h1>
    <p style="color: ${colors.body}; font-size: 14px; margin: 0 0 20px 0;">${currentWeek.year}年 第${currentWeek.weekNumber}周 · ${currentWeek.dateRange}</p>
    <hr style="${dividerStyle} margin: 20px 0;" />

    <h2 style="color: ${colors.title}; font-size: 18px; margin: 24px 0 12px 0;">一、本周工作</h2>
    <ul style="list-style: none; padding-left: 0; color: ${colors.body}; font-size: 14px;">
      ${workItems || '<li style="color: #999;">暂无内容</li>'}
    </ul>

    <hr style="${dividerStyle} margin: 24px 0;" />

    <h2 style="color: ${colors.title}; font-size: 18px; margin: 24px 0 12px 0;">二、下周计划</h2>
    <ul style="list-style: none; padding-left: 0; color: ${colors.body}; font-size: 14px;">
      ${planItems || '<li style="color: #999;">暂无内容</li>'}
    </ul>

    ${currentWeek.reflection.trim() ? `<hr style="${dividerStyle} margin: 24px 0;" />` : ''}
    ${reflectionHTML ? `<h2 style="color: ${colors.title}; font-size: 18px; margin: 24px 0 12px 0;">三、问题与反思</h2>${reflectionHTML}` : ''}
  </div>
</body>
</html>`
  }, [currentWeek, template, colors])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateHTML())
      setCopyStatus('已复制')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('复制失败')
      setTimeout(() => setCopyStatus(''), 2000)
    }
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

  const listMarker = template === 'professional' ? '•' : '✓'

  const dividerStyle = useMemo(() => {
    if (template === 'creative') {
      return {
        background: colors.divider,
        height: '2px',
        border: 'none',
      }
    }
    return {
      border: 'none',
      borderTop: `1px solid ${colors.divider}`,
    }
  }, [template, colors.divider])

  if (!currentWeek) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="week-preview-wrapper">
      <div className="week-preview">
        <div className="preview-paper">
          <h1 style={{ color: colors.title }}>周报</h1>
          <p className="preview-subtitle" style={{ color: colors.body }}>
            {currentWeek.year}年 第{currentWeek.weekNumber}周 · {currentWeek.dateRange}
          </p>
          <hr className="preview-divider" style={dividerStyle} />

          <h2 style={{ color: colors.title }}>一、本周工作</h2>
          <ul className="preview-list" style={{ color: colors.body }}>
            {currentWeek.currentWork.filter((i) => i.content.trim()).length > 0 ? (
              currentWeek.currentWork
                .filter((i) => i.content.trim())
                .map((item) => (
                  <li key={item.id}>
                    <span className="list-marker" style={{ color: colors.listMarker }}>
                      {listMarker}
                    </span>
                    {item.content}
                  </li>
                ))
            ) : (
              <li className="empty-item">暂无内容</li>
            )}
          </ul>

          <hr className="preview-divider" style={dividerStyle} />

          <h2 style={{ color: colors.title }}>二、下周计划</h2>
          <ul className="preview-list" style={{ color: colors.body }}>
            {currentWeek.nextPlan.filter((i) => i.content.trim()).length > 0 ? (
              currentWeek.nextPlan
                .filter((i) => i.content.trim())
                .map((item) => (
                  <li key={item.id}>
                    <span className="list-marker" style={{ color: colors.listMarker }}>
                      {listMarker}
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
              <h2 style={{ color: colors.title }}>三、问题与反思</h2>
              <div className="preview-reflection" style={{ color: colors.body }}>
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
