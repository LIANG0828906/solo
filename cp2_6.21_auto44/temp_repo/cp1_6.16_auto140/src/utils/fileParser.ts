import { v4 as uuidv4 } from 'uuid'
import { Disease, DiseaseType, DISEASE_COLORS, DISEASE_NAMES } from '../store'

const REPAIR_METHODS: Record<DiseaseType, string[]> = {
  crack: [
    '使用低粘度环氧树脂进行渗透填充',
    '采用纳米钙基材料进行裂隙加固',
    '使用丙烯酸酯粘合剂进行微创修复'
  ],
  rust: [
    '使用化学除锈剂配合机械打磨',
    '采用电化学还原法去除锈蚀',
    '应用防锈涂层进行隔离保护'
  ],
  peeling: [
    '使用粘合剂进行回贴加固',
    '采用纳米材料进行表层补强',
    '使用匹配颜料进行美学修复'
  ],
  contamination: [
    '使用有机溶剂进行表面清洗',
    '采用激光清洗技术去除污染物',
    '应用温和的化学试剂进行局部处理'
  ]
}

const DISEASE_TYPES: DiseaseType[] = ['crack', 'rust', 'peeling', 'contamination']

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomPosition(): { x: number; y: number; z: number } {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r = 0.75

  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  }
}

export function generateMockDiseases(count: number = 8): Disease[] {
  const diseases: Disease[] = []
  const maxCount = Math.min(count, 12)

  for (let i = 0; i < maxCount; i++) {
    const type = DISEASE_TYPES[Math.floor(Math.random() * DISEASE_TYPES.length)]
    const methods = REPAIR_METHODS[type]

    diseases.push({
      id: uuidv4(),
      type,
      name: DISEASE_NAMES[type] + ' ' + (i + 1),
      color: DISEASE_COLORS[type],
      position: randomPosition(),
      area: parseFloat(randomInRange(0.5, 8.0).toFixed(1)),
      depth: parseFloat(randomInRange(0.1, 3.0).toFixed(1)),
      repairMethod: methods[Math.floor(Math.random() * methods.length)]
    })
  }

  return diseases
}

export async function processImage(file: File): Promise<{
  base64: string
  diseases: Disease[]
}> {
  const base64 = await fileToBase64(file)

  await new Promise(resolve => setTimeout(resolve, 800))

  const diseaseCount = Math.floor(Math.random() * 6) + 5
  const diseases = generateMockDiseases(diseaseCount)

  return { base64, diseases }
}
