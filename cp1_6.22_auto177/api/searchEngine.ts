import type { Note } from './seedData.js'

export function searchNotes(notes: Note[], keyword: string): Note[] {
  if (!keyword.trim()) return notes
  const lower = keyword.toLowerCase()
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(lower) ||
      n.content.toLowerCase().includes(lower)
  )
}

export function aggregateByTag(notes: Note[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const note of notes) {
    for (const tag of note.tags) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return counts
}

export function filterByTag(notes: Note[], tag: string | null): Note[] {
  if (!tag) return notes
  return notes.filter((n) => n.tags.includes(tag))
}
