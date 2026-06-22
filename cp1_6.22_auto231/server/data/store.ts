import { v4 as uuidv4 } from 'uuid'

export interface Animal {
  id: string
  name: string
  breed: string
  age: number
  gender: 'male' | 'female'
  weight: number
  color: string
  vaccinated: boolean
  neutered: boolean
  intakeDate: string
  description: string
  status: 'available' | 'adopted' | 'quarantine'
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  animalId: string
  animalName: string
  applicantName: string
  contact: string
  housing: 'own' | 'rent'
  hasOtherPets: boolean
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface Followup {
  id: string
  animalId: string
  date: string
  status: 'healthy' | 'attention' | 'recheck'
  notes: string
  createdAt: string
}

class MemoryStore {
  private animals: Map<string, Animal> = new Map()
  private applications: Map<string, Application> = new Map()
  private followups: Map<string, Followup[]> = new Map()

  constructor() {
    this.seedData()
  }

  private seedData() {
    const now = new Date().toISOString()
    const seedAnimals: Animal[] = [
      {
        id: uuidv4(),
        name: '小橘',
        breed: '橘猫',
        age: 2,
        gender: 'male',
        weight: 4.5,
        color: '橘色',
        vaccinated: true,
        neutered: true,
        intakeDate: '2025-03-15',
        description: '性格温顺，喜欢被撸，是个小吃货。',
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: '豆豆',
        breed: '柴犬',
        age: 1,
        gender: 'female',
        weight: 8.2,
        color: '赤棕色',
        vaccinated: true,
        neutered: false,
        intakeDate: '2025-04-20',
        description: '活泼好动，非常聪明，学东西很快。',
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: '雪球',
        breed: '布偶猫',
        age: 3,
        gender: 'female',
        weight: 5.1,
        color: '白色',
        vaccinated: true,
        neutered: true,
        intakeDate: '2025-02-10',
        description: '优雅安静，喜欢晒太阳，适合有耐心的家庭。',
        status: 'adopted',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: '阿黄',
        breed: '中华田园犬',
        age: 4,
        gender: 'male',
        weight: 12.5,
        color: '黄色',
        vaccinated: false,
        neutered: true,
        intakeDate: '2025-06-01',
        description: '刚被救助，正在隔离观察中，性格忠诚。',
        status: 'quarantine',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: '咪咪',
        breed: '狸花猫',
        age: 1,
        gender: 'female',
        weight: 3.2,
        color: '虎斑',
        vaccinated: true,
        neutered: false,
        intakeDate: '2025-05-12',
        description: '好奇心强，喜欢玩逗猫棒。',
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: '大黑',
        breed: '拉布拉多',
        age: 5,
        gender: 'male',
        weight: 28.0,
        color: '黑色',
        vaccinated: true,
        neutered: true,
        intakeDate: '2025-01-08',
        description: '温和友善，非常适合有小孩的家庭。',
        status: 'adopted',
        createdAt: now,
        updatedAt: now
      }
    ]

    seedAnimals.forEach(animal => {
      this.animals.set(animal.id, animal)
    })

    const adoptedAnimals = Array.from(this.animals.values()).filter(a => a.status === 'adopted')
    const followupDate = new Date()
    followupDate.setDate(followupDate.getDate() - 7)
    
    adoptedAnimals.forEach(animal => {
      const followup: Followup = {
        id: uuidv4(),
        animalId: animal.id,
        date: followupDate.toISOString().split('T')[0],
        status: 'healthy',
        notes: '第一次回访，状态良好，适应新家中。',
        createdAt: now
      }
      this.followups.set(animal.id, [followup])
    })

    const availableAnimals = Array.from(this.animals.values()).filter(a => a.status === 'available')
    if (availableAnimals.length > 0) {
      const app: Application = {
        id: uuidv4(),
        animalId: availableAnimals[0].id,
        animalName: availableAnimals[0].name,
        applicantName: '张三',
        contact: '13800138000',
        housing: 'own',
        hasOtherPets: false,
        reason: '一直想养一只猫，家里条件合适，有足够时间陪伴。',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      }
      this.applications.set(app.id, app)
    }
  }

  getAnimals(): Animal[] {
    return Array.from(this.animals.values())
  }

  getAnimalById(id: string): Animal | undefined {
    return this.animals.get(id)
  }

  createAnimal(data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): Animal {
    const now = new Date().toISOString()
    const animal: Animal = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    this.animals.set(animal.id, animal)
    return animal
  }

  updateAnimal(id: string, data: Partial<Animal>): Animal | undefined {
    const animal = this.animals.get(id)
    if (!animal) return undefined
    const updated: Animal = {
      ...animal,
      ...data,
      updatedAt: new Date().toISOString()
    }
    this.animals.set(id, updated)
    return updated
  }

  deleteAnimal(id: string): boolean {
    return this.animals.delete(id)
  }

  getApplications(): Application[] {
    return Array.from(this.applications.values())
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.get(id)
  }

  createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Application {
    const now = new Date().toISOString()
    const app: Application = {
      ...data,
      id: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }
    this.applications.set(app.id, app)
    return app
  }

  updateApplicationStatus(id: string, status: 'approved' | 'rejected'): Application | undefined {
    const app = this.applications.get(id)
    if (!app) return undefined
    const updated: Application = {
      ...app,
      status,
      updatedAt: new Date().toISOString()
    }
    this.applications.set(id, updated)
    return updated
  }

  getFollowupsByAnimalId(animalId: string): Followup[] {
    return this.followups.get(animalId) || []
  }

  createFollowup(data: Omit<Followup, 'id' | 'createdAt'>): Followup {
    const now = new Date().toISOString()
    const followup: Followup = {
      ...data,
      id: uuidv4(),
      createdAt: now
    }
    const existing = this.followups.get(data.animalId) || []
    existing.push(followup)
    this.followups.set(data.animalId, existing)
    return followup
  }

  getStats() {
    const animals = this.getAnimals()
    const total = animals.length
    const available = animals.filter(a => a.status === 'available').length
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const applications = this.getApplications()
    const thisMonthAdoptions = applications.filter(app => {
      if (app.status !== 'approved') return false
      const date = new Date(app.updatedAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length

    let thisMonthFollowups = 0
    this.followups.forEach(list => {
      list.forEach(f => {
        const date = new Date(f.date)
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          thisMonthFollowups++
        }
      })
    })

    return {
      totalAnimals: total,
      availableAnimals: available,
      thisMonthAdoptions,
      thisMonthFollowups
    }
  }
}

export const store = new MemoryStore()
