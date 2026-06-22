import type { Note, QA } from './seedData.js'

export function addQA(note: Note, question: string): QA {
  const qa: QA = {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question,
    answer: '',
    createdAt: new Date().toISOString(),
  }
  note.qa.push(qa)
  return qa
}

export function getSortedQA(note: Note): QA[] {
  return [...note.qa].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
