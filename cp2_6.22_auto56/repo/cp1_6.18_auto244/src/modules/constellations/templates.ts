import * as THREE from 'three'
import { ConstellationTemplate } from '../particle/types'

const SCALE = 80

export const CONSTELLATION_TEMPLATES: ConstellationTemplate[] = [
  {
    id: 'orion',
    name: '猎人座',
    icon: '🏹',
    points: generateOrion(),
  },
  {
    id: 'libra',
    name: '天平座',
    icon: '⚖️',
    points: generateLibra(),
  },
  {
    id: 'pegasus',
    name: '飞马座',
    icon: '🦄',
    points: generatePegasus(),
  },
]

function generateOrion(): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  
  points.push(new THREE.Vector3(-0.8, 1.5, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.8, 1.5, 0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.3, 1.1, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.3, 1.1, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, 1.3, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.4, 0.4, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, 0.4, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.4, 0.4, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.3, 0.1, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.3, 0.1, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.9, -0.2, 0.3).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.0, -0.4, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.1, -0.6, 0.3).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(0.9, -0.2, -0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.0, -0.4, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.1, -0.6, -0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.7, -1.3, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-0.6, -1.6, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.7, -1.3, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.6, -1.6, -0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-1.0, 1.2, 0.5).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.0, 1.2, -0.5).multiplyScalar(SCALE))

  return addSurroundingPoints(points, 80)
}

function generateLibra(): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  
  points.push(new THREE.Vector3(0, 1.2, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, 0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, 0.4, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, 0, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-1.2, 0.3, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.0, 0.1, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-0.8, -0.1, -0.1).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(1.2, 0.3, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.0, 0.1, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.8, -0.1, 0.1).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-1.5, 0.5, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.3, 0.7, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.6, 0.3, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.4, 0.1, 0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(1.5, 0.5, -0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.3, 0.7, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.6, 0.3, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.4, 0.1, -0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(0, -0.4, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, -0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0, -1.2, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-0.4, -1.4, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.4, -1.4, -0.1).multiplyScalar(SCALE))

  return addSurroundingPoints(points, 80)
}

function generatePegasus(): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  
  points.push(new THREE.Vector3(1.2, 1.6, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.4, 1.3, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.6, 1.5, -0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.8, 1.7, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.1, 1.8, 0.3).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(0.8, 1.1, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.6, 0.7, 0.1).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(0.2, 0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-0.6, 0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.4, 0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(0.2, 0, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-0.6, 0, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.4, 0, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(0.2, -0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-0.6, -0.8, 0).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-1.4, -0.8, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(1.0, 0.1, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.2, -0.1, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.4, -0.3, 0).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(1.6, -0.8, 0.3).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.5, -1.1, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.7, -1.4, 0.1).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(1.0, -0.8, -0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.2, -1.0, -0.3).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(1.4, -1.2, -0.2).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-1.8, 0.4, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-2.0, 0.1, 0.1).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-2.2, -0.2, 0.2).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-2.0, -0.5, 0.1).multiplyScalar(SCALE))
  
  points.push(new THREE.Vector3(-1.8, 0.6, 0.5).multiplyScalar(SCALE))
  points.push(new THREE.Vector3(-2.1, 0.5, 0.4).multiplyScalar(SCALE))

  return addSurroundingPoints(points, 80)
}

function addSurroundingPoints(corePoints: THREE.Vector3[], targetCount: number): THREE.Vector3[] {
  const result = [...corePoints]
  const remaining = targetCount - corePoints.length
  
  if (remaining <= 0) return result.slice(0, targetCount)

  for (let i = 0; i < remaining; i++) {
    const base = corePoints[i % corePoints.length]
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 15 + Math.random() * 35
    
    const offset = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
    
    result.push(base.clone().add(offset))
  }

  return result
}
