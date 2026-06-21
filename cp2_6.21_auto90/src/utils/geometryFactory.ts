import * as THREE from 'three';
import { GeometryType } from '@/types';

/**
 * 几何体工厂模块
 *
 * 职责：封装青铜鼎各部件的几何体构建逻辑，独立于3D场景渲染层。
 * 调用方：PartMesh 组件通过 createPartGeometry 创建单个子网格的几何体。
 *
 * 数据流向：
 *   GeometryType(String) → createGeometry() → THREE.BufferGeometry
 */

export function createGeometry(type: GeometryType): THREE.BufferGeometry {
  switch (type) {
    case 'dingBody':
      return createDingBodyGeometry();
    case 'ear':
      return createEarGeometry();
    case 'leg':
      return createLegGeometry();
    case 'pattern':
      return createPatternLayerGeometry();
    case 'inscription':
      return createInscriptionLayerGeometry();
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function createDingBodyGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  const segments = 32;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const radius = 1.3 - 0.5 * t * t;
    const y = -0.9 + t * 1.8;
    points.push(new THREE.Vector2(radius, y));
  }
  return new THREE.LatheGeometry(points, 48);
}

function createEarGeometry(): THREE.BufferGeometry {
  return new THREE.TorusGeometry(0.35, 0.1, 12, 24);
}

function createLegGeometry(): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(0.18, 0.25, 1.0, 16);
}

function createPatternLayerGeometry(): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(1.1, 1.1, 0.05, 48);
}

function createInscriptionLayerGeometry(): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(0.9, 0.9, 0.03, 48);
}
