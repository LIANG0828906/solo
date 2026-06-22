import React, { useEffect } from 'react'
import { Piece } from './Piece'
import { useLockStore } from '../store/useLockStore'
import { PIECE_CONFIGS, LockStatus } from '../utils/constants'

export const LockBox: React.FC = () => {
  const pieces = useLockStore(state => state.pieces)
  const addPiece = useLockStore(state => state.addPiece)
  const removePiece = useLockStore(state => state.removePiece)
  const calculateLockStatus = useLockStore(state => state.calculateLockStatus)

  useEffect(() => {
    PIECE_CONFIGS.forEach(config => {
      addPiece(config)
    })

    return () => {
      PIECE_CONFIGS.forEach(config => {
        removePiece(config.id)
      })
    }
  }, [addPiece, removePiece])

  useEffect(() => {
    calculateLockStatus()
  }, [pieces, calculateLockStatus])

  return (
    <group position={[0, 5, 0]}>
      {PIECE_CONFIGS.map(config => (
        <Piece key={config.id} config={config} />
      ))}

      <group position={[0, -5, 0]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <shadowMaterial opacity={0.3} transparent />
        </mesh>
      </group>
    </group>
  )
}

export { LockStatus }
