import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

export interface Project {
  id: string
  name: string
  description: string
  stage: '构思中' | '进行中' | '已完成'
  progress: number
  lastEdited: string
  images: string[]
  publicToken: string
}

export interface Material {
  id: string
  projectId: string
  name: string
  quantity: number
  unitPrice: number
  link: string
}

export const projects: Project[] = [
  {
    id: uuidv4(),
    name: '手工皮革钱包',
    description: '一款简约风格的短款真皮钱包，采用意大利进口头层牛皮制作，手工缝线，经久耐用。内设多个卡位和拉链零钱袋。',
    stage: '进行中',
    progress: 65,
    lastEdited: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20leather%20wallet%20craft%20product%20photography%20warm%20lighting&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20wallet%20interior%20card%20slots%20craftsmanship&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hand%20stitching%20leather%20craft%20process%20close%20up&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20wallet%20on%20wooden%20table%20lifestyle%20shot&image_size=landscape_16_9'
    ],
    publicToken: uuidv4()
  },
  {
    id: uuidv4(),
    name: '陶瓷茶具套装',
    description: '一套四件的日式陶瓷茶具，包括茶壶、公道杯和两个品茗杯。采用手工拉坯，1280度高温烧制，釉面温润。',
    stage: '构思中',
    progress: 20,
    lastEdited: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20ceramic%20tea%20set%20handmade%20pottery%20minimal&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pottery%20wheel%20throwing%20ceramic%20craft%20process&image_size=landscape_16_9'
    ],
    publicToken: uuidv4()
  },
  {
    id: uuidv4(),
    name: '羊毛毡小动物',
    description: '可爱的羊毛毡小动物摆件，包括小猫、小狗和小兔子。采用纯羊毛手工戳制，每个作品都是独一无二的。',
    stage: '已完成',
    progress: 100,
    lastEdited: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20needle%20felted%20animals%20cat%20dog%20bunny%20handmade&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=needle%20felting%20process%20wool%20craft%20tools&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=felted%20cat%20figurine%20handmade%20wool%20craft%20detail&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=felted%20bunny%20rabbit%20handmade%20wool%20sculpture&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=felted%20dog%20puppy%20handmade%20wool%20figurine%20cute&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=collection%20of%20needle%20felted%20animals%20display&image_size=landscape_16_9'
    ],
    publicToken: uuidv4()
  }
]

export const materials: Material[] = [
  {
    id: uuidv4(),
    projectId: projects[0].id,
    name: '意大利头层牛皮',
    quantity: 0.5,
    unitPrice: 180,
    link: 'https://example.com/leather'
  },
  {
    id: uuidv4(),
    projectId: projects[0].id,
    name: '亚麻蜡线',
    quantity: 1,
    unitPrice: 25,
    link: 'https://example.com/thread'
  },
  {
    id: uuidv4(),
    projectId: projects[0].id,
    name: '黄铜拉链',
    quantity: 1,
    unitPrice: 15,
    link: 'https://example.com/zipper'
  },
  {
    id: uuidv4(),
    projectId: projects[0].id,
    name: '皮革封边液',
    quantity: 1,
    unitPrice: 35,
    link: 'https://example.com/edge-coat'
  },
  {
    id: uuidv4(),
    projectId: projects[1].id,
    name: '景德镇高岭土',
    quantity: 10,
    unitPrice: 12,
    link: 'https://example.com/clay'
  },
  {
    id: uuidv4(),
    projectId: projects[1].id,
    name: '青瓷釉料',
    quantity: 1,
    unitPrice: 80,
    link: 'https://example.com/glaze'
  },
  {
    id: uuidv4(),
    projectId: projects[1].id,
    name: '碳化硅砂轮',
    quantity: 1,
    unitPrice: 45,
    link: 'https://example.com/grinding-wheel'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '70S羊毛条（白色）',
    quantity: 50,
    unitPrice: 2.5,
    link: 'https://example.com/wool-white'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '70S羊毛条（灰色）',
    quantity: 30,
    unitPrice: 2.5,
    link: 'https://example.com/wool-gray'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '70S羊毛条（棕色）',
    quantity: 20,
    unitPrice: 2.5,
    link: 'https://example.com/wool-brown'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '戳针套装（粗中细）',
    quantity: 1,
    unitPrice: 35,
    link: 'https://example.com/needles'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '高密度泡沫垫',
    quantity: 1,
    unitPrice: 28,
    link: 'https://example.com/mat'
  },
  {
    id: uuidv4(),
    projectId: projects[2].id,
    name: '动物眼睛配件',
    quantity: 10,
    unitPrice: 1.5,
    link: 'https://example.com/eyes'
  }
]

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const projectList = projects.map(p => ({
    id: p.id,
    name: p.name,
    stage: p.stage,
    progress: p.progress,
    lastEdited: p.lastEdited
  }))
  res.json(projectList)
})

router.get('/:id', (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id)
  if (!project) {
    return res.status(404).json({ error: '项目不存在' })
  }
  res.json(project)
})

router.put('/:id', (req: Request, res: Response) => {
  const index = projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '项目不存在' })
  }
  
  projects[index] = {
    ...projects[index],
    ...req.body,
    id: req.params.id
  }
  
  res.json(projects[index])
})

export default router
