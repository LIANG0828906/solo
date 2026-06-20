import { get, set, del, keys } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import type { StoryNode, Connection } from '../stores/storyStore'

export interface StoryData {
  id: string
  name: string
  nodes: StoryNode[]
  connections: Connection[]
  createdAt: number
  updatedAt: number
}

const STORY_PREFIX = 'story_'

export const saveStory = async (data: {
  name: string
  nodes: StoryNode[]
  connections: Connection[]
}): Promise<StoryData> => {
  const now = Date.now()
  const id = `${STORY_PREFIX}${uuidv4()}`
  const story: StoryData = {
    id,
    name: data.name,
    nodes: data.nodes,
    connections: data.connections,
    createdAt: now,
    updatedAt: now,
  }
  await set(id, story)
  return story
}

export const loadStory = async (id: string): Promise<StoryData | undefined> => {
  const story = await get<StoryData>(id)
  return story
}

export const listStories = async (): Promise<
  { id: string; name: string; updatedAt: number }[]
> => {
  const allKeys = await keys()
  const storyKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(STORY_PREFIX)
  ) as string[]

  const stories: { id: string; name: string; updatedAt: number }[] = []
  for (const key of storyKeys) {
    const story = await get<StoryData>(key)
    if (story) {
      stories.push({
        id: story.id,
        name: story.name,
        updatedAt: story.updatedAt,
      })
    }
  }
  stories.sort((a, b) => b.updatedAt - a.updatedAt)
  return stories
}

export const deleteStory = async (id: string): Promise<void> => {
  await del(id)
}
