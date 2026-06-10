import React, { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLockStore } from '../store/useLockStore'
import { PieceConfig, PIECE_LENGTH, PIECE_WIDTH, TOLERANCES, PARTICLE_CONFIG } from '../utils/constants'
import { playWoodSnap, playWoodClick } from '../utils/sound'

interface PieceProps {
  config: PieceConfig
}

export const Piece: React.FC<PieceProps> = ({ config }) => {
  const meshRef = useRef<THREE.Group>(null)
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane())
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const isDraggingRef = useRef(false)
  const startPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const slotTranslationRef = useRef(0)
  const wasDetachedRef = useRef(false)

  const { camera, raycaster, pointer } = useThree()

  const piece = useLockStore(state => state.pieces.find(p => p.id === config.id))
  const setPiecePosition = useLockStore(state => state.setPiecePosition)
  const setPieceRotation = useLockStore(state => state.setPieceRotation)
  const setPieceDragging = useLockStore(state => state.setPieceDragging)
  const setPieceDetached = useLockStore(state => state.setPieceDetached)
  const setPieceInSlot = useLockStore(state => state.setPieceInSlot)
  const addParticles = useLockStore(state => state.addParticles)
  const snapPieceToSlot = useLockStore(state => state.snapPieceToSlot)
  const checkWithinSlot = useLockStore(state => state.checkWithinSlot)
  const glowActive = useLockStore(state => state.glowActive)

  useEffect(() => {
    if (meshRef.current && piece) {
      meshRef.current.position.copy(piece.position)
      meshRef.current.rotation.copy(piece.rotation)
    }
  }, [piece?.id])

  useFrame(() => {
    if (meshRef.current && piece && !piece.isDragging) {
      meshRef.current.position.copy(piece.position)
      meshRef.current.rotation.copy(piece.rotation)
    }
  })

  const createLShapeGeometry = useCallback(() => {
    const group = new THREE.Group()

    const part1 = new THREE.Mesh(
      new THREE.BoxGeometry(PIECE_LENGTH, PIECE_WIDTH, PIECE_WIDTH / 2),
      new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.7,
        metalness: 0.15
      })
    )
    part1.position.set(0, 0, -PIECE_WIDTH / 4)
    part1.castShadow = true
    part1.receiveShadow = true

    const part2 = new THREE.Mesh(
      new THREE.BoxGeometry(PIECE_LENGTH, PIECE_WIDTH / 2, PIECE_WIDTH),
      new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.7,
        metalness: 0.15
      })
    )
    part2.position.set(0, PIECE_WIDTH / 4, 0)
    part2.castShadow = true
    part2.receiveShadow = true

    const notchLength = PIECE_LENGTH / 4
    const notchWidth = PIECE_WIDTH / 2
    const notch = new THREE.Mesh(
      new THREE.BoxGeometry(notchLength, notchWidth, notchWidth),
      new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.7,
        metalness: 0.15
      })
    )
    notch.position.set(0, 0, 0)
    notch.castShadow = true
    notch.receiveShadow = true

    group.add(part1)
    group.add(part2)
    group.add(notch)

    return group
  }, [config.color])

  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation()
    if (!meshRef.current) return

    isDraggingRef.current = true
    wasDetachedRef.current = piece?.isDetached || false
    startPositionRef.current.copy(meshRef.current.position)
    slotTranslationRef.current = 0

    setPieceDragging(config.id, true)

    const normal = new THREE.Vector3()
    camera.getWorldDirection(normal)
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
      normal,
      meshRef.current.getWorldPosition(new THREE.Vector3())
    )

    raycaster.setFromCamera(pointer, camera)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)
    if (intersection) {
      dragOffsetRef.current.copy(
        meshRef.current.getWorldPosition(new THREE.Vector3()).sub(intersection)
      )
    }

    document.body.style.cursor = 'grabbing'
  }, [camera, config.id, piece?.isDetached, pointer, raycaster, setPieceDragging])

  const handlePointerMove = useCallback(() => {
    if (!isDraggingRef.current || !meshRef.current) return

    raycaster.setFromCamera(pointer, camera)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)

    if (intersection) {
      const newPosition = intersection.add(dragOffsetRef.current)

      if (piece && !piece.isDetached) {
        const delta = newPosition.clone().sub(startPositionRef.current)
        const axisProjection = delta.dot(config.axis)
        slotTranslationRef.current = Math.abs(axisProjection)

        if (slotTranslationRef.current > TOLERANCES.MAX_SLOT_TRANSLATION) {
          setPieceDetached(config.id, true)
          setPieceInSlot(config.id, false)
          wasDetachedRef.current = true
          addParticles(meshRef.current.getWorldPosition(new THREE.Vector3()), PARTICLE_CONFIG.count)
          playWoodSnap()
        } else {
          const constrainedPosition = startPositionRef.current.clone().add(
            config.axis.clone().multiplyScalar(axisProjection)
          )
          meshRef.current.position.copy(constrainedPosition)
          setPiecePosition(config.id, constrainedPosition)
        }
      }

      if (piece?.isDetached || wasDetachedRef.current) {
        meshRef.current.position.copy(newPosition)
        setPiecePosition(config.id, newPosition)
      }
    }
  }, [camera, config.axis, config.id, piece, pointer, raycaster, setPiecePosition, setPieceDetached, setPieceInSlot, addParticles])

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return

    isDraggingRef.current = false
    setPieceDragging(config.id, false)
    document.body.style.cursor = 'default'

    if (meshRef.current) {
      const withinSlot = checkWithinSlot(config.id)
      if (withinSlot) {
        snapPieceToSlot(config.id)
        playWoodClick()
      } else {
        setPiecePosition(config.id, meshRef.current.position.clone())
        setPieceRotation(config.id, meshRef.current.rotation.clone())
      }
    }
  }, [config.id, checkWithinSlot, snapPieceToSlot, setPieceDragging, setPiecePosition, setPieceRotation])

  useEffect(() => {
    if (isDraggingRef.current) {
      const handleGlobalPointerMove = () => {
        handlePointerMove()
      }
      const handleGlobalPointerUp = () => {
        handlePointerUp()
        window.removeEventListener('pointermove', handleGlobalPointerMove)
        window.removeEventListener('pointerup', handleGlobalPointerUp)
      }

      window.addEventListener('pointermove', handleGlobalPointerMove)
      window.addEventListener('pointerup', handleGlobalPointerUp)

      return () => {
        window.removeEventListener('pointermove', handleGlobalPointerMove)
        window.removeEventListener('pointerup', handleGlobalPointerUp)
      }
    }
  }, [handlePointerMove, handlePointerUp])

  if (!piece) return null

  return (
    <group
      ref={meshRef}
      position={piece.position.toArray()}
      rotation={[piece.rotation.x, piece.rotation.y, piece.rotation.z]}
      onPointerDown={handlePointerDown}
    >
      <primitive object={createLShapeGeometry()} />

      {glowActive && piece.isInSlot && (
        <pointLight
          color="#ffcc00"
          intensity={2.0}
          distance={12}
          decay={2}
        />
      )}
    </group>
  )
}
