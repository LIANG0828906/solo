export interface Milestone {
  id: string
  title: string
  dueDate: string
  completion: number
  note: string
}

export interface Project {
  id: string
  name: string
  startDate: string
  endDate: string
  color: string
  description: string
  milestones: Milestone[]
}

export interface ReportData {
  projects: Project[]
  startDate: string
  endDate: string
  completions: { projectId: string; completion: number }[]
}

export const COLOR_PALETTE = [
  '#E74C3C',
  '#E67E22',
  '#F39C12',
  '#F1C40F',
  '#2ECC71',
  '#1ABC9C',
  '#3498DB',
  '#9B59B6',
  '#E91E63',
  '#00BCD4',
  '#795548',
  '#607D8B',
]

export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateProjectCompletion(project: Project): number {
  if (project.milestones.length === 0) return 0
  const total = project.milestones.reduce((sum, m) => sum + m.completion, 0)
  return Math.round(total / project.milestones.length)
}

export function generateReportSummary(reportData: ReportData): string {
  const { projects, startDate, endDate, completions } = reportData
  let summary = `# 项目进度报告\n\n`
  summary += `**报告周期**: ${formatDate(startDate)} 至 ${formatDate(endDate)}\n\n`
  summary += `## 概览\n\n`
  summary += `共 **${projects.length}** 个项目\n\n`
  summary += `## 各项目进度\n\n`

  projects.forEach((p) => {
    const comp = completions.find((c) => c.projectId === p.id)
    const percent = comp ? comp.completion : calculateProjectCompletion(p)
    summary += `### ${p.name}\n\n`
    summary += `- 完成度: **${percent}%**\n`
    summary += `- 项目周期: ${formatDate(p.startDate)} ~ ${formatDate(p.endDate)}\n`
    summary += `- 描述: ${p.description || '无'}\n\n`
    if (p.milestones.length > 0) {
      summary += `**里程碑节点**:\n\n`
      p.milestones.forEach((m) => {
        const status = m.completion >= 100 ? '✅ 已完成' : m.completion > 0 ? '🔄 进行中' : '⏳ 未开始'
        summary += `- ${status} ${m.title} (${m.completion}%) - 截止: ${formatDate(m.dueDate)}\n`
        if (m.note) summary += `  - 备注: ${m.note}\n`
      })
      summary += `\n`
    }
  })

  const avgCompletion =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => {
            const comp = completions.find((c) => c.projectId === p.id)
            return sum + (comp ? comp.completion : calculateProjectCompletion(p))
          }, 0) / projects.length
        )
      : 0

  summary += `## 整体进度\n\n`
  summary += `所有项目平均完成度: **${avgCompletion}%**\n`

  return summary
}
