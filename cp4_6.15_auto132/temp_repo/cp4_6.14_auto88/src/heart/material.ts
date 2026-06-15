/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 职责：
 *   - 定义心脏各部分的PBR材质参数（漫反射颜色、粗糙度、金属度）
 *   - 提供材质颜色过渡计算（激活时ease-in-out，去激活时线性衰减）
 *
 * 数据流入：
 *   - model.ts 调用 updateMaterialColor() / updateAllMaterials()
 *     传入 baseColor 和 transitionProgress (0-1)
 *
 * 数据流出：
 *   - 更新 MeshStandardMaterial.color 属性
 *   - 材质变更自动由 Three.js 渲染管道提交给 GPU
 *
 * 调用方：
 *   - model.ts 在 updateColors() 中每帧调用
 * ============================================================
 */

import * as THREE from 'three'

const REST_COLOR_VENTRICLE = new THREE.Color('#b91c1c')
const REST_COLOR_ATRIUM = new THREE.Color('#ef4444')
const ACTIVATED_COLOR = new THREE.Color('#fcd34d')

export interface HeartMaterials {
  rightAtrium: THREE.MeshStandardMaterial
  leftAtrium: THREE.MeshStandardMaterial
  rightVentricle: THREE.MeshStandardMaterial
  leftVentricle: THREE.MeshStandardMaterial
  valve: THREE.MeshStandardMaterial
}

export function createHeartMaterials(): HeartMaterials {
  const createChamberMaterial = (baseColor: THREE.Color) => {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
  }

  return {
    rightAtrium: createChamberMaterial(REST_COLOR_ATRIUM),
    leftAtrium: createChamberMaterial(REST_COLOR_ATRIUM),
    rightVentricle: createChamberMaterial(REST_COLOR_VENTRICLE),
    leftVentricle: createChamberMaterial(REST_COLOR_VENTRICLE),
    valve: new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  }
}

export function getRestColor(isAtrium: boolean): THREE.Color {
  return isAtrium ? REST_COLOR_ATRIUM : REST_COLOR_VENTRICLE
}

export function getActivatedColor(): THREE.Color {
  return ACTIVATED_COLOR
}
