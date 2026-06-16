import { saveAs } from 'file-saver'
import type { SignRecord } from '@/types'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function escapeCSV(value: string): string {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

export function generateCSV(records: SignRecord[]): Blob {
  const headers = ['运单号', '收件人', '快递员', '签收时间']
  const rows = records.map((r) => [
    escapeCSV(r.trackingNumber),
    escapeCSV(r.recipient),
    escapeCSV(r.courier),
    escapeCSV(formatTimestamp(r.timestamp)),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const BOM = '\uFEFF'
  return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
}

export function downloadCSV(records: SignRecord[]): void {
  const blob = generateCSV(records)
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const filename = `sign-records-${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}.csv`
  saveAs(blob, filename)
}
