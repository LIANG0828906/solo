export interface QA {
  id: string
  question: string
  answer: string
  createdAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  qa: QA[]
}
