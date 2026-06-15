import { v4 } from 'uuid'

export interface Card {
  id: string
  title: string
  tags: string[]
  body: string
  createdAt: string
}

export interface Edge {
  source: string
  target: string
  weight: number
}

const cards = new Map<string, Card>()
const edges: Edge[] = []

const seedCards: Omit<Card, 'id' | 'createdAt'>[] = [
  {
    title: 'Django',
    tags: ['python', 'web-framework', 'backend'],
    body: 'Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. It follows the model-template-views architectural pattern and provides built-in admin panel, ORM, and authentication.',
  },
  {
    title: 'React',
    tags: ['javascript', 'frontend', 'ui-library'],
    body: 'React is a JavaScript library for building user interfaces. It uses a component-based architecture with virtual DOM for efficient rendering. React works well with TypeScript and Node.js ecosystems.',
  },
  {
    title: 'TypeScript',
    tags: ['javascript', 'typing', 'language'],
    body: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static typing, interfaces, and advanced tooling support. Widely used with React and Node.js projects.',
  },
  {
    title: 'Node.js',
    tags: ['javascript', 'runtime', 'backend'],
    body: 'Node.js is a JavaScript runtime built on Chrome V8 engine. It enables server-side JavaScript execution and is commonly paired with Express for building REST APIs and web services.',
  },
  {
    title: 'Express',
    tags: ['javascript', 'web-framework', 'backend'],
    body: 'Express is a minimal and flexible Node.js web application framework. It provides robust features for web and mobile applications, including routing, middleware support, and integration with PostgreSQL via ORMs.',
  },
  {
    title: 'PostgreSQL',
    tags: ['database', 'sql', 'backend'],
    body: 'PostgreSQL is a powerful open-source relational database system. It supports advanced data types, full-text search, and JSON. Commonly used with Django, Express, and other backend frameworks.',
  },
  {
    title: 'Docker',
    tags: ['devops', 'containerization', 'deployment'],
    body: 'Docker is a platform for containerizing applications. It ensures consistent environments across development and production. Commonly used to deploy Node.js, PostgreSQL, and Django applications.',
  },
  {
    title: 'GraphQL',
    tags: ['api', 'query-language', 'frontend'],
    body: 'GraphQL is a query language for APIs that allows clients to request exactly the data they need. It works well with React and TypeScript on the frontend and can be served by Node.js and Express on the backend.',
  },
]

const seedEdges: { source: number; target: number; weight: number }[] = [
  { source: 1, target: 2, weight: 3 },
  { source: 1, target: 5, weight: 2 },
  { source: 2, target: 3, weight: 4 },
  { source: 2, target: 4, weight: 2 },
  { source: 3, target: 4, weight: 5 },
  { source: 4, target: 5, weight: 4 },
  { source: 5, target: 6, weight: 3 },
  { source: 1, target: 6, weight: 2 },
  { source: 7, target: 4, weight: 3 },
  { source: 7, target: 6, weight: 2 },
  { source: 2, target: 8, weight: 3 },
  { source: 4, target: 8, weight: 4 },
]

function initSeedData(): void {
  const ids: string[] = []
  for (const data of seedCards) {
    const card: Card = {
      id: v4(),
      title: data.title,
      tags: data.tags,
      body: data.body,
      createdAt: new Date().toISOString(),
    }
    cards.set(card.id, card)
    ids.push(card.id)
  }
  for (const e of seedEdges) {
    edges.push({
      source: ids[e.source],
      target: ids[e.target],
      weight: e.weight,
    })
  }
}

initSeedData()

export function getAllCards(): Card[] {
  return Array.from(cards.values())
}

export function getCardById(id: string): Card | undefined {
  return cards.get(id)
}

export function createCard(
  data: Omit<Card, 'id' | 'createdAt'>,
): Card {
  const card: Card = {
    id: v4(),
    title: data.title,
    tags: data.tags,
    body: data.body,
    createdAt: new Date().toISOString(),
  }
  cards.set(card.id, card)
  return card
}

export function updateCard(
  id: string,
  data: Partial<Omit<Card, 'id' | 'createdAt'>>,
): Card | null {
  const existing = cards.get(id)
  if (!existing) return null
  const updated: Card = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
  }
  cards.set(id, updated)
  return updated
}

export function deleteCard(id: string): boolean {
  const deleted = cards.delete(id)
  if (deleted) {
    for (let i = edges.length - 1; i >= 0; i--) {
      if (edges[i].source === id || edges[i].target === id) {
        edges.splice(i, 1)
      }
    }
  }
  return deleted
}

export function getRecommendations(id: string): Card[] {
  const card = cards.get(id)
  if (!card) return []

  const keywords = new Set<string>([
    ...card.tags.map((t) => t.toLowerCase()),
    ...card.body
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .map((w) => w.toLowerCase()),
    ...card.title.toLowerCase().split(/\s+/),
  ])

  const scores: { card: Card; score: number }[] = []

  for (const other of cards.values()) {
    if (other.id === id) continue

    let score = 0
    const otherTitleLower = other.title.toLowerCase()
    const otherTagsLower = other.tags.map((t) => t.toLowerCase())
    const otherBodyLower = other.body.toLowerCase()

    for (const kw of keywords) {
      if (otherTitleLower.includes(kw)) score += 3
      for (const tag of otherTagsLower) {
        if (tag.includes(kw) || kw.includes(tag)) score += 2
      }
      if (otherBodyLower.includes(kw)) score += 1
    }

    for (const e of edges) {
      if (
        (e.source === id && e.target === other.id) ||
        (e.target === id && e.source === other.id)
      ) {
        score += e.weight
      }
    }

    if (score > 0) {
      scores.push({ card: other, score })
    }
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, 5).map((s) => s.card)
}

export function addEdge(source: string, target: string, weight: number): Edge {
  const edge: Edge = { source, target, weight }
  edges.push(edge)
  return edge
}

export function getGraphData(): { nodes: Card[]; edges: Edge[] } {
  return {
    nodes: Array.from(cards.values()),
    edges: [...edges],
  }
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>()
  for (const card of cards.values()) {
    for (const tag of card.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}
