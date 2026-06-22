import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ExhibitInfo, PointInfo } from '@/data/exhibits'

export interface LoadedModel {
  scene: THREE.Group
  boundingBox: THREE.Box3
  parts: THREE.Mesh[]
  getPointInfo: (point: THREE.Vector3, faceNormal: THREE.Vector3) => PointInfo
}

export class ModelLoader {
  private loader: GLTFLoader

  constructor() {
    this.loader = new GLTFLoader()
  }

  async loadModel(exhibit: ExhibitInfo): Promise<LoadedModel> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const model = this.createProceduralModel(exhibit.id)
        resolve(model)
      }, 500)
    })
  }

  private createProceduralModel(modelId: string): LoadedModel {
    const group = new THREE.Group()
    const parts: THREE.Mesh[] = []

    let getPointInfo: (point: THREE.Vector3, faceNormal: THREE.Vector3) => PointInfo

    switch (modelId) {
      case 'vase-1': {
        const { vaseParts, infoFn } = this.createVase()
        vaseParts.forEach(part => {
          group.add(part)
          parts.push(part)
        })
        getPointInfo = infoFn
        break
      }
      case 'gear-1': {
        const { gearParts, infoFn } = this.createGearSet()
        gearParts.forEach(part => {
          group.add(part)
          parts.push(part)
        })
        getPointInfo = infoFn
        break
      }
      case 'chair-1': {
        const { chairParts, infoFn } = this.createChair()
        chairParts.forEach(part => {
          group.add(part)
          parts.push(part)
        })
        getPointInfo = infoFn
        break
      }
      default: {
        const defaultGeo = new THREE.BoxGeometry(1, 1, 1)
        const defaultMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
        const defaultMesh = new THREE.Mesh(defaultGeo, defaultMat)
        group.add(defaultMesh)
        parts.push(defaultMesh)
        getPointInfo = () => ({
          material: '未知材质',
          productionDate: '未知',
          description: '暂无详细信息',
          position: { x: 0, y: 0, z: 0 }
        })
      }
    }

    const boundingBox = new THREE.Box3().setFromObject(group)
    const center = new THREE.Vector3()
    boundingBox.getCenter(center)
    group.position.sub(center)

    const size = new THREE.Vector3()
    boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim
    group.scale.setScalar(scale)

    const finalBox = new THREE.Box3().setFromObject(group)

    return {
      scene: group,
      boundingBox: finalBox,
      parts,
      getPointInfo
    }
  }

  private createVase(): { vaseParts: THREE.Mesh[]; infoFn: (point: THREE.Vector3, faceNormal: THREE.Vector3) => PointInfo } {
    const parts: THREE.Mesh[] = []

    const vaseBodyPoints: THREE.Vector2[] = []
    const segments = 30
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = t * 2.5 - 0.3
      let radius: number
      if (t < 0.1) {
        radius = 0.15 + t * 2
      } else if (t < 0.7) {
        radius = 0.6 - Math.sin((t - 0.1) / 0.6 * Math.PI) * 0.15
      } else {
        radius = 0.45 - (t - 0.7) / 0.3 * 0.3
      }
      vaseBodyPoints.push(new THREE.Vector2(radius, y))
    }

    const vaseGeo = new THREE.LatheGeometry(vaseBodyPoints, 48)
    const vaseMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      metalness: 0.1,
      roughness: 0.4,
    })
    const vaseMesh = new THREE.Mesh(vaseGeo, vaseMat)
    vaseMesh.castShadow = true
    vaseMesh.receiveShadow = true
    vaseMesh.name = 'vase-body'
    parts.push(vaseMesh)

    const rimGeo = new THREE.TorusGeometry(0.2, 0.025, 12, 48)
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a4d8c,
      metalness: 0.3,
      roughness: 0.3,
    })
    const rimMesh = new THREE.Mesh(rimGeo, rimMat)
    rimMesh.rotation.x = Math.PI / 2
    rimMesh.position.y = 2.15
    rimMesh.name = 'vase-rim'
    parts.push(rimMesh)

    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.15, 48)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d4,
      metalness: 0.1,
      roughness: 0.5,
    })
    const baseMesh = new THREE.Mesh(baseGeo, baseMat)
    baseMesh.position.y = -0.25
    baseMesh.castShadow = true
    baseMesh.receiveShadow = true
    baseMesh.name = 'vase-base'
    parts.push(baseMesh)

    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = 512
    patternCanvas.height = 256
    const ctx = patternCanvas.getContext('2d')!
    ctx.fillStyle = '#e8e8e8'
    ctx.fillRect(0, 0, 512, 256)

    ctx.strokeStyle = '#1a4d8c'
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * 64
      this.drawFloralPattern(ctx, x, 128, 20)
    }

    const patternTex = new THREE.CanvasTexture(patternCanvas)
    patternTex.wrapS = THREE.RepeatWrapping
    patternTex.wrapT = THREE.RepeatWrapping
    vaseMat.map = patternTex

    const infoFn = (point: THREE.Vector3, _normal: THREE.Vector3): PointInfo => {
      const heightRatio = (point.y + 1) / 2.5
      let material = '高岭土胎 青花釉'
      let date = '清乾隆年间 (约1760年)'
      let desc = '景德镇官窑烧制，通体青花装饰，笔法细腻流畅'

      if (point.y > 1.8) {
        material = '钴料青花釉边'
        desc = '瓶口描金青花边，典雅华贵'
      } else if (point.y < -0.1) {
        material = '紫砂胎底'
        date = '乾隆年制款识'
        desc = '底部有"大清乾隆年制"六字篆书款'
      } else if (heightRatio > 0.4 && heightRatio < 0.7) {
        desc = '腹部主体纹饰为缠枝莲纹，寓意吉祥如意'
      }

      return {
        material,
        productionDate: date,
        description: desc,
        position: { x: point.x, y: point.y, z: point.z }
      }
    }

    return { vaseParts: parts, infoFn }
  }

  private drawFloralPattern(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = cx + Math.cos(angle) * size * 0.5
      const y = cy + Math.sin(angle) * size * 0.5
      if (i === 0) ctx.moveTo(x, y)
      else ctx.quadraticCurveTo(
        cx + Math.cos(angle - 0.3) * size * 0.8,
        cy + Math.sin(angle - 0.3) * size * 0.8,
        x, y
      )
    }
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  private createGearSet(): { gearParts: THREE.Mesh[]; infoFn: (point: THREE.Vector3, faceNormal: THREE.Vector3) => PointInfo } {
    const parts: THREE.Mesh[] = []

    const createGear = (teeth: number, radius: number, thickness: number, boreRadius: number): THREE.Mesh => {
      const shape = new THREE.Shape()
      const toothDepth = radius * 0.1
      const innerRadius = radius - toothDepth
      const anglePerTooth = (Math.PI * 2) / teeth

      for (let i = 0; i < teeth; i++) {
        const angle = i * anglePerTooth
        const nextAngle = (i + 1) * anglePerTooth
        const midAngle = angle + anglePerTooth / 2

        const toothTipAngle = anglePerTooth * 0.4
        const toothBaseAngle = anglePerTooth * 0.6

        const startInnerAngle = angle + (anglePerTooth - toothBaseAngle) / 2
        const startOuterAngle = startInnerAngle + (toothBaseAngle - toothTipAngle) / 2
        const endOuterAngle = startOuterAngle + toothTipAngle
        const endInnerAngle = endOuterAngle + (toothBaseAngle - toothTipAngle) / 2

        const x1 = Math.cos(startInnerAngle) * innerRadius
        const y1 = Math.sin(startInnerAngle) * innerRadius

        const x2 = Math.cos(startOuterAngle) * radius
        const y2 = Math.sin(startOuterAngle) * radius

        const x3 = Math.cos(endOuterAngle) * radius
        const y3 = Math.sin(endOuterAngle) * radius

        const x4 = Math.cos(endInnerAngle) * innerRadius
        const y4 = Math.sin(endInnerAngle) * innerRadius

        if (i === 0) {
          shape.moveTo(x1, y1)
        } else {
          shape.lineTo(x1, y1)
        }
        shape.lineTo(x2, y2)
        shape.lineTo(x3, y3)
        shape.lineTo(x4, y4)
      }

      shape.closePath()

      const holePath = new THREE.Path()
      holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true)
      shape.holes.push(holePath)

      const extrudeSettings = {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness * 0.1,
        bevelSize: thickness * 0.05,
        bevelSegments: 3,
      }

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometry.center()

      const material = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        metalness: 0.9,
        roughness: 0.25,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = Math.PI / 2
      mesh.castShadow = true
      mesh.receiveShadow = true

      return mesh
    }

    const mainGear = createGear(32, 1.2, 0.15, 0.25)
    mainGear.position.y = 0
    mainGear.name = 'main-gear'
    parts.push(mainGear)

    const pinion = createGear(16, 0.6, 0.12, 0.12)
    pinion.position.set(1.5, 0.1, 0)
    pinion.name = 'pinion-gear'
    parts.push(pinion)

    const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 24)
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.95,
      roughness: 0.15,
    })
    const shaft1 = new THREE.Mesh(shaftGeo, shaftMat)
    shaft1.position.y = 0
    shaft1.castShadow = true
    shaft1.name = 'shaft-main'
    parts.push(shaft1)

    const shaft2 = new THREE.Mesh(shaftGeo, shaftMat)
    shaft2.position.set(1.5, 0.1, 0)
    shaft2.scale.y = 0.8
    shaft2.castShadow = true
    shaft2.name = 'shaft-pinion'
    parts.push(shaft2)

    const bearingGeo = new THREE.TorusGeometry(0.2, 0.03, 12, 36)
    const bearingMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.9,
      roughness: 0.2,
    })
    const bearing = new THREE.Mesh(bearingGeo, bearingMat)
    bearing.rotation.x = Math.PI / 2
    bearing.position.y = -0.25
    bearing.name = 'bearing'
    parts.push(bearing)

    const infoFn = (point: THREE.Vector3, _normal: THREE.Vector3): PointInfo => {
      let material = '航空铝合金 7075-T6'
      let date = '2024年3月生产'
      let desc = '高精度CNC加工，公差等级IT5'

      const distFromCenter = Math.sqrt(point.x * point.x + point.z * point.z)
      if (distFromCenter < 0.3) {
        material = '合金钢轴芯'
        desc = '传动轴芯，表面高频淬火处理，硬度HRC58-62'
      } else if (distFromCenter > 1.0) {
        material = '铝合金齿面'
        desc = '渐开线齿形，磨齿加工，表面粗糙度Ra0.8'
      } else if (Math.abs(point.y) > 0.06) {
        material = '阳极氧化表层'
        date = '2024年4月表面处理'
        desc = '硬质阳极氧化处理，膜厚25μm，耐磨耐腐蚀'
      }

      return {
        material,
        productionDate: date,
        description: desc,
        position: { x: point.x, y: point.y, z: point.z }
      }
    }

    return { gearParts: parts, infoFn }
  }

  private createChair(): { chairParts: THREE.Mesh[]; infoFn: (point: THREE.Vector3, faceNormal: THREE.Vector3) => PointInfo } {
    const parts: THREE.Mesh[] = []

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      metalness: 0.05,
      roughness: 0.6,
    })

    const seatGeo = new THREE.BoxGeometry(1.2, 0.08, 1.0)
    const seat = new THREE.Mesh(seatGeo, woodMat)
    seat.position.y = 0.5
    seat.castShadow = true
    seat.receiveShadow = true
    seat.name = 'seat'
    parts.push(seat)

    const backrestGeo = new THREE.BoxGeometry(1.1, 0.8, 0.06)
    const backrest = new THREE.Mesh(backrestGeo, woodMat)
    backrest.position.set(0, 0.95, -0.47)
    backrest.rotation.x = -0.15
    backrest.castShadow = true
    backrest.receiveShadow = true
    backrest.name = 'backrest'
    parts.push(backrest)

    const legGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 12)
    
    const legPositions = [
      { x: -0.5, z: 0.4 },
      { x: 0.5, z: 0.4 },
      { x: -0.5, z: -0.4 },
      { x: 0.5, z: -0.4 },
    ]

    legPositions.forEach((pos, i) => {
      const leg = new THREE.Mesh(legGeo, woodMat)
      leg.position.set(pos.x, 0.25, pos.z)
      leg.castShadow = true
      leg.name = `leg-${i + 1}`
      parts.push(leg)
    })

    const armrestGeo = new THREE.BoxGeometry(0.08, 0.05, 0.6)
    const armrestSupportGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8)

    ;[-0.56, 0.56].forEach((x, i) => {
      const armrest = new THREE.Mesh(armrestGeo, woodMat)
      armrest.position.set(x, 0.75, 0.1)
      armrest.castShadow = true
      armrest.name = `armrest-${i + 1}`
      parts.push(armrest)

      const support1 = new THREE.Mesh(armrestSupportGeo, woodMat)
      support1.position.set(x, 0.6, 0.35)
      support1.castShadow = true
      support1.name = `armrest-support-${i * 2 + 1}`
      parts.push(support1)

      const support2 = new THREE.Mesh(armrestSupportGeo, woodMat)
      support2.position.set(x, 0.6, -0.2)
      support2.castShadow = true
      support2.name = `armrest-support-${i * 2 + 2}`
      parts.push(support2)
    })

    const stretcherGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8)
    const stretcher1 = new THREE.Mesh(stretcherGeo, woodMat)
    stretcher1.rotation.z = Math.PI / 2
    stretcher1.position.set(0, 0.25, 0.4)
    stretcher1.castShadow = true
    stretcher1.name = 'stretcher-front'
    parts.push(stretcher1)

    const stretcher2 = new THREE.Mesh(stretcherGeo, woodMat)
    stretcher2.rotation.z = Math.PI / 2
    stretcher2.position.set(0, 0.25, -0.4)
    stretcher2.castShadow = true
    stretcher2.name = 'stretcher-back'
    parts.push(stretcher2)

    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0,
      roughness: 0.8,
    })
    const cushionGeo = new THREE.BoxGeometry(1.1, 0.06, 0.9)
    const cushion = new THREE.Mesh(cushionGeo, cushionMat)
    cushion.position.y = 0.57
    cushion.castShadow = true
    cushion.name = 'cushion'
    parts.push(cushion)

    const infoFn = (point: THREE.Vector3, normal: THREE.Vector3): PointInfo => {
      let material = '北美黑胡桃木'
      let date = '2023年11月制作'
      let desc = '传统榫卯工艺，手工打磨抛光'

      if (Math.abs(point.y - 0.57) < 0.05 && normal.y > 0.5) {
        material = '亚麻布艺软垫'
        desc = '高密度海绵填充，可拆洗布艺外套'
      } else if (point.y > 0.6 && point.y < 1.2) {
        if (Math.abs(point.z + 0.47) < 0.1) {
          material = '黑胡桃木靠背板'
          desc = '整木铣型，符合人体工学的弧度设计'
        } else if (Math.abs(Math.abs(point.x) - 0.56) < 0.1) {
          material = '黑胡桃木扶手'
          desc = '圆润打磨，握持舒适自然'
        }
      } else if (point.y < 0.4) {
        if (Math.abs(point.x) > 0.4 || Math.abs(point.z) > 0.3) {
          material = '黑胡桃木椅腿'
          desc = '锥形腿设计，稳固耐用，底部有防滑垫'
        } else {
          material = '黑胡桃木横撑'
          desc = '横向支撑杆，增强整体结构稳定性'
        }
      } else if (Math.abs(point.y - 0.5) < 0.06) {
        material = '黑胡桃木座面'
        desc = '多拼板结构，防止变形，表面木蜡油处理'
      }

      return {
        material,
        productionDate: date,
        description: desc,
        position: { x: point.x, y: point.y, z: point.z }
      }
    }

    return { chairParts: parts, infoFn }
  }
}

export default ModelLoader
