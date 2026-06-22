import { createContext, useContext } from 'react'

export interface ScrollContextType {
  scrollProgress: number
  currentScene: number
  totalScenes: number
  viewportHeight: number
}

export const ScrollContext = createContext<ScrollContextType>({
  scrollProgress: 0,
  currentScene: 0,
  totalScenes: 6,
  viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
})

export const useScrollContext = () => useContext(ScrollContext)
