import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useStore, Disease } from './store'
import AnalysisPanel from './features/analysisPanel'
import RepairPanel from './features/repairPanel'
import { ThreeScene } from './features/threeScene'
import { processImage, generateMockDiseases } from './utils/fileParser'

const App: React.FC = () => {
  const { diseases, highlightedDiseaseId, repairParams } = useStore()
  const { addImage, setDiseases, setHighlighted, setRepairParams, setModelRef } = useStore((state) => state.actions)
  const [isUploading, setIsUploading] = useState(false)
  const [hoveredDisease, setHoveredDisease] = useState<Disease | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [showWelcome, setShowWelcome] = useState(true)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const threeSceneRef = useRef<ThreeScene | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (canvasContainerRef.current && !threeSceneRef.current) {
      threeSceneRef.current = new ThreeScene(canvasContainerRef.current)
      setModelRef(threeSceneRef.current)

      threeSceneRef.current.onHoverChange = (disease, screenPos) => {
        setHoveredDisease(disease || null)
        if (screenPos) {
          setTooltipPos(screenPos)
        }
      }

      const mockDiseases = generateMockDiseases(8)
      setDiseases(mockDiseases)
      threeSceneRef.current.updateDiseases(mockDiseases)
      threeSceneRef.current.updateRepairParams(repairParams)
      setShowWelcome(false)
    }

    return () => {
      if (threeSceneRef.current) {
        threeSceneRef.current.dispose()
        threeSceneRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.updateHighlighted(highlightedDiseaseId)
    }
  }, [highlightedDiseaseId])

  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.updateRepairParams(repairParams)
    }
  }, [repairParams])

  useEffect(() => {
    if (threeSceneRef.current && diseases.length > 0) {
      threeSceneRef.current.updateDiseases(diseases)
    }
  }, [diseases])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { base64, diseases: newDiseases } = await processImage(file)
      addImage(base64)
      setDiseases(newDiseases)
      setHighlighted(null)
    } catch (error) {
      console.error('图片处理失败:', error)
    } finally {
      setIsUploading(false)
    }
  }, [addImage, setDiseases, setHighlighted])

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsUploading(true)
    try {
      const { base64, diseases: newDiseases } = await processImage(file)
      addImage(base64)
      setDiseases(newDiseases)
      setHighlighted(null)
    } catch (error) {
      console.error('图片处理失败:', error)
    } finally {
      setIsUploading(false)
    }
  }, [addImage, setDiseases, setHighlighted])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDemoLoad = useCallback(() => {
    const mockDiseases = generateMockDiseases(10)
    setDiseases(mockDiseases)
    setShowWelcome(false)
  }, [setDiseases])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">数字古董鉴定与修复方案生成器</h1>
          <p className="app-subtitle">