import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ColorParams, ImageItem, SavedScheme, Preset, WorkerResponse } from './types'
import { DEFAULT_PARAMS, PRESETS } from './types'

const STORAGE_KEY = 'color-palette-schemes'

interface ColorState {
  params: ColorParams
  images: ImageItem[]
  presets: Preset[]
  savedSchemes: SavedScheme[]
  colorMatrix: number[][]
  cssFilter: string
  isTransitioning: boolean
  activePresetId: string | null
}

type ColorAction =
  | { type: 'SET_PARAMS'; payload: Partial<ColorParams> }
  | { type: 'APPLY_PRESET'; payload: Preset }
  | { type: 'ADD_IMAGE'; payload: ImageItem }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE'; payload: { id: string; updates: Partial<ImageItem> } }
  | { type: 'SET_MATRIX'; payload: number[][] }
  | { type: 'SET_CSS'; payload: string }
  | { type: 'SAVE_SCHEME'; payload: { name: string } }
  | { type: 'LOAD_SAVED_SCHEMES'; payload: SavedScheme[] }
  | { type: 'LOAD_SCHEME'; payload: SavedScheme }
  | { type: 'DELETE_SCHEME'; payload: string }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'CLEAR_IMAGES' }

const initialMatrix: number[][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

const initialState: ColorState = {
  params: DEFAULT_PARAMS,
  images: [],
  presets: PRESETS,
  savedSchemes: [],
  colorMatrix: initialMatrix,
  cssFilter: 'none',
  isTransitioning: false,
  activePresetId: null,
}

function colorReducer(state: ColorState, action: ColorAction): ColorState {
  switch (action.type) {
    case 'SET_PARAMS':
      return {
        ...state,
        params: { ...state.params, ...action.payload },
        activePresetId: null,
      }

    case 'APPLY_PRESET':
      return {
        ...state,
        params: { ...action.payload.params },
        activePresetId: action.payload.id,
      }

    case 'ADD_IMAGE':
      return {
        ...state,
        images: [...state.images, action.payload],
      }

    case 'REMOVE_IMAGE':
      return {
        ...state,
        images: state.images.filter((img) => img.id !== action.payload),
      }

    case 'UPDATE_IMAGE':
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.payload.id ? { ...img, ...action.payload.updates } : img
        ),
      }

    case 'SET_MATRIX':
      return { ...state, colorMatrix: action.payload }

    case 'SET_CSS':
      return { ...state, cssFilter: action.payload }

    case 'LOAD_SAVED_SCHEMES':
      return { ...state, savedSchemes: action.payload }

    case 'SAVE_SCHEME': {
      const newScheme: SavedScheme = {
        id: uuidv4(),
        name: action.payload.name,
        createdAt: Date.now(),
        params: { ...state.params },
        previewColors: generatePreviewColors(state.params),
      }
      const updated = [...state.savedSchemes, newScheme]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('schemeSaved'))
      }, 0)
      return { ...state, savedSchemes: updated }
    }

    case 'LOAD_SCHEME':
      return {
        ...state,
        params: { ...action.payload.params },
        activePresetId: null,
      }

    case 'DELETE_SCHEME': {
      const updated = state.savedSchemes.filter((s) => s.id !== action.payload)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return { ...state, savedSchemes: updated }
    }

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload }

    case 'CLEAR_IMAGES':
      return { ...state, images: [] }

    default:
      return state
  }
}

function generatePreviewColors(params: ColorParams): string[] {
  const baseColors = [
    { r: 255, g: 100, b: 100 },
    { r: 100, g: 255, b: 100 },
    { r: 100, g: 100, b: 255 },
  ]

  const hueRad = (params.hueRotate * Math.PI) / 180
  const cos = Math.cos(hueRad)
  const sin = Math.sin(hueRad)
  const lumR = 0.2126
  const lumG = 0.7152
  const lumB = 0.0722

  return baseColors.map(({ r, g, b }) => {
    const newR = r * (lumR + cos * (1 - lumR) + sin * (-lumR)) +
                 g * (lumG + cos * (-lumG) + sin * (-lumG)) +
                 b * (lumB + cos * (-lumB) + sin * (1 - lumB))
    const newG = r * (lumR + cos * (-lumR) + sin * 0.143) +
                 g * (lumG + cos * (1 - lumG) + sin * 0.14) +
                 b * (lumB + cos * (-lumB) + sin * (-0.283))
    const newB = r * (lumR + cos * (-lumR) + sin * (-(1 - lumR))) +
                 g * (lumG + cos * (-lumG) + sin * lumG) +
                 b * (lumB + cos * (1 - lumB) + sin * lumB)

    const satFactor = 1 + params.saturation / 100
    const gray = newR * 0.299 + newG * 0.587 + newB * 0.114
    const satR = gray + satFactor * (newR - gray)
    const satG = gray + satFactor * (newG - gray)
    const satB = gray + satFactor * (newB - gray)

    const contFactor = (params.contrast / 100) + 1
    const brightOffset = params.brightness * 2.55
    const finalR = Math.max(0, Math.min(255, contFactor * (satR - 128) + 128 + brightOffset))
    const finalG = Math.max(0, Math.min(255, contFactor * (satG - 128) + 128 + brightOffset))
    const finalB = Math.max(0, Math.min(255, contFactor * (satB - 128) + 128 + brightOffset))

    return '#' + [finalR, finalG, finalB].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
  })
}

interface ColorContextType extends ColorState {
  worker: Worker | null
  setParams: (params: Partial<ColorParams>) => void
  applyPreset: (preset: Preset) => void
  addImage: (file: File) => Promise<void>
  removeImage: (id: string) => void
  saveScheme: (name: string) => void
  loadScheme: (scheme: SavedScheme) => void
  deleteScheme: (id: string) => void
  clearImages: () => void
  playClickSound: () => void
  playSlideSound: () => void
}

const ColorContext = createContext<ColorContextType | null>(null)

export function ColorStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(colorReducer, initialState)
  const workerRef = useRef<Worker | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(new URL('./ColorEngine.ts', import.meta.url), {
      type: 'module',
    })

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, payload } = e.data

      switch (type) {
        case 'imageAnalyzed':
          dispatch({
            type: 'UPDATE_IMAGE',
            payload: {
              id: payload.id,
              updates: {
                dominantColors: payload.dominantColors,
                histogram: payload.histogram,
                rgbAverage: payload.rgbAverage,
                isProcessing: false,
              },
            },
          })
          break

        case 'filterApplied': {
          const { id, processedData } = payload
          createImageBitmap(processedData).then((bitmap) => {
            dispatch({
              type: 'UPDATE_IMAGE',
              payload: { id, updates: { processedBitmap: bitmap, isProcessing: false } },
            })
          })
          break
        }

        case 'matrixGenerated':
          dispatch({ type: 'SET_MATRIX', payload: payload.matrix })
          break

        case 'cssGenerated':
          dispatch({ type: 'SET_CSS', payload: payload.css })
          break
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const schemes: SavedScheme[] = JSON.parse(saved)
        dispatch({ type: 'LOAD_SAVED_SCHEMES', payload: schemes })
      } catch (e) {
        console.error('Failed to load saved schemes')
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'generateMatrix', payload: { params: state.params } })
      workerRef.current.postMessage({ type: 'generateCSS', payload: { params: state.params } })
    }

    state.images.forEach((img) => {
      if (img.originalBitmap) {
        img.processedBitmap?.close()
        dispatch({
          type: 'UPDATE_IMAGE',
          payload: { id: img.id, updates: { processedBitmap: null, isProcessing: true } },
        })
      }
    })
  }, [state.params])

  useEffect(() => {
    if (!workerRef.current) return

    state.images.forEach((img) => {
      if (img.originalBitmap && !img.processedBitmap && img.isProcessing) {
        const canvas = new OffscreenCanvas(img.originalBitmap.width, img.originalBitmap.height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img.originalBitmap, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        workerRef.current!.postMessage(
          { type: 'applyFilter', payload: { id: img.id, imageData, params: state.params } },
          [imageData.data.buffer]
        )
      }
    })
  }, [state.images, state.params])

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }, [])

  const playClickSound = useCallback(() => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  }, [initAudio])

  const playSlideSound = useCallback(() => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 400
    osc.type = 'triangle'
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.03)
  }, [initAudio])

  const setParams = useCallback((params: Partial<ColorParams>) => {
    dispatch({ type: 'SET_PARAMS', payload: params })
  }, [])

  const applyPreset = useCallback((preset: Preset) => {
    dispatch({ type: 'SET_TRANSITIONING', payload: true })
    dispatch({ type: 'APPLY_PRESET', payload: preset })
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITIONING', payload: false })
    }, 500)
  }, [])

  const addImage = useCallback(async (file: File) => {
    const id = uuidv4()
    const url = URL.createObjectURL(file)
    const blob = await file.slice()
    const bitmap = await createImageBitmap(blob, { resizeWidth: 200, resizeHeight: 200 })

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const newImage: ImageItem = {
      id,
      file,
      url,
      originalBitmap: bitmap,
      processedBitmap: null,
      dominantColors: [],
      histogram: [],
      rgbAverage: { r: 0, g: 0, b: 0 },
      isProcessing: true,
    }

    dispatch({ type: 'ADD_IMAGE', payload: newImage })

    if (workerRef.current) {
      workerRef.current.postMessage(
        { type: 'analyzeImage', payload: { id, imageData } },
        [imageData.data.buffer]
      )
    }
  }, [])

  const removeImage = useCallback((id: string) => {
    const img = state.images.find((i) => i.id === id)
    if (img) {
      URL.revokeObjectURL(img.url)
      img.originalBitmap?.close()
      img.processedBitmap?.close()
    }
    dispatch({ type: 'REMOVE_IMAGE', payload: id })
  }, [state.images])

  const saveScheme = useCallback((name: string) => {
    dispatch({ type: 'SAVE_SCHEME', payload: { name } })
  }, [])

  const loadScheme = useCallback((scheme: SavedScheme) => {
    dispatch({ type: 'LOAD_SCHEME', payload: scheme })
  }, [])

  const deleteScheme = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCHEME', payload: id })
  }, [])

  const clearImages = useCallback(() => {
    state.images.forEach((img) => {
      URL.revokeObjectURL(img.url)
      img.originalBitmap?.close()
      img.processedBitmap?.close()
    })
    dispatch({ type: 'CLEAR_IMAGES' })
  }, [state.images])

  const value: ColorContextType = {
    ...state,
    worker: workerRef.current,
    setParams,
    applyPreset,
    addImage,
    removeImage,
    saveScheme,
    loadScheme,
    deleteScheme,
    clearImages,
    playClickSound,
    playSlideSound,
  }

  return <ColorContext.Provider value={value}>{children}</ColorContext.Provider>
}

export function useColorState() {
  const ctx = useContext(ColorContext)
  if (!ctx) throw new Error('useColorState must be used within ColorStateProvider')
  return ctx
}
