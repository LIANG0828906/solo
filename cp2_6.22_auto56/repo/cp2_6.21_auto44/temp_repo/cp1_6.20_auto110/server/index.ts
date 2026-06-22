import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'

type ComponentType = 'button' | 'card' | 'input' | 'navbar' | 'badge' | 'canvas'

interface ComponentBase {
  id: string
  type: ComponentType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

interface ButtonComponent extends ComponentBase {
  type: 'button'
  text: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size: 'sm' | 'md' | 'lg'
  disabled: boolean
}

interface CardComponent extends ComponentBase {
  type: 'card'
  title: string
  description: string
  imageUrl?: string
}

interface InputComponent extends ComponentBase {
  type: 'input'
  placeholder: string
  label: string
  variant: 'default' | 'outlined' | 'filled'
  required: boolean
}

interface NavbarComponent extends ComponentBase {
  type: 'navbar'
  brand: string
  links: Array<{ label: string; href: string }>
  theme: 'light' | 'dark'
}

interface BadgeComponent extends ComponentBase {
  type: 'badge'
  text: string
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

interface CanvasComponent extends ComponentBase {
  type: 'canvas'
  backgroundColor: string
  borderRadius: number
}

type Component =
  | ButtonComponent
  | CardComponent
  | InputComponent
  | NavbarComponent
  | BadgeComponent
  | CanvasComponent

interface Template {
  id: string
  name: string
  description: string
  thumbnail?: string
  components: Component[]
  createdAt: number
  updatedAt: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const templates = new Map<string, Template>()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

app.get('/api/templates', (req: Request, res: Response<ApiResponse<Template[]>>): void => {
  const allTemplates = Array.from(templates.values())
  res.status(200).json({
    success: true,
    data: allTemplates,
  })
})

app.post('/api/templates', (req: Request, res: Response<ApiResponse<Template>>): void => {
  const { name, description, thumbnail, components } = req.body as Partial<Template>

  if (!name) {
    res.status(400).json({
      success: false,
      error: 'Template name is required',
    })
    return
  }

  const now = Date.now()
  const newTemplate: Template = {
    id: generateId(),
    name,
    description: description ?? '',
    thumbnail,
    components: components ?? [],
    createdAt: now,
    updatedAt: now,
  }

  templates.set(newTemplate.id, newTemplate)

  res.status(201).json({
    success: true,
    data: newTemplate,
  })
})

app.get('/api/templates/:id', (req: Request, res: Response<ApiResponse<Template>>): void => {
  const { id } = req.params
  const template = templates.get(id)

  if (!template) {
    res.status(404).json({
      success: false,
      error: `Template with id ${id} not found`,
    })
    return
  }

  res.status(200).json({
    success: true,
    data: template,
  })
})

app.put('/api/templates/:id', (req: Request, res: Response<ApiResponse<Template>>): void => {
  const { id } = req.params
  const template = templates.get(id)

  if (!template) {
    res.status(404).json({
      success: false,
      error: `Template with id ${id} not found`,
    })
    return
  }

  const { name, description, thumbnail, components } = req.body as Partial<Template>

  const updatedTemplate: Template = {
    ...template,
    name: name ?? template.name,
    description: description ?? template.description,
    thumbnail: thumbnail ?? template.thumbnail,
    components: components ?? template.components,
    updatedAt: Date.now(),
  }

  templates.set(id, updatedTemplate)

  res.status(200).json({
    success: true,
    data: updatedTemplate,
  })
})

app.delete('/api/templates/:id', (req: Request, res: Response<ApiResponse<Template>>): void => {
  const { id } = req.params
  const template = templates.get(id)

  if (!template) {
    res.status(404).json({
      success: false,
      error: `Template with id ${id} not found`,
    })
    return
  }

  templates.delete(id)

  res.status(200).json({
    success: true,
    data: template,
  })
})

app.get('/api/health', (req: Request, res: Response<ApiResponse<string>>): void => {
  res.status(200).json({
    success: true,
    data: 'ok',
  })
})

app.use((error: Error, req: Request, res: Response<ApiResponse<never>>, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response<ApiResponse<never>>) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
