import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Animal, ApiResponse } from '../../client/types';
import { mockAnimals } from '../data/mockData';

const router = Router();

let animals: Animal[] = [...mockAnimals];

let nameIndex: Map<string, Animal[]> = new Map();

const buildNameIndex = () => {
  nameIndex.clear();
  for (const animal of animals) {
    const nameLower = animal.name.toLowerCase();
    for (let i = 1; i <= nameLower.length; i++) {
      const prefix = nameLower.substring(0, i);
      if (!nameIndex.has(prefix)) {
        nameIndex.set(prefix, []);
      }
      nameIndex.get(prefix)!.push(animal);
    }
  }
};

buildNameIndex();

const searchAnimalsByName = (keyword: string): Animal[] => {
  if (!keyword.trim()) {
    return animals;
  }
  const keywordLower = keyword.toLowerCase();
  const result = nameIndex.get(keywordLower);
  if (result) {
    return [...new Set(result)];
  }
  return animals.filter(animal => 
    animal.name.toLowerCase().includes(keywordLower)
  );
};

router.get('/api/animals', (req: Request, res: Response<ApiResponse<Animal[]>>) => {
  try {
    const { name } = req.query;
    const keyword = typeof name === 'string' ? name : '';
    
    const result = searchAnimalsByName(keyword);
    
    setTimeout(() => {
      res.json({
        success: true,
        data: result,
        message: keyword ? `搜索到 ${result.length} 条结果` : `获取成功，共 ${result.length} 条记录`
      });
    }, Math.random() * 150 + 20);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取动物列表失败',
      message: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

router.get('/api/animals/:id', (req: Request, res: Response<ApiResponse<Animal>>) => {
  try {
    const { id } = req.params;
    const animal = animals.find(a => a.id === id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        error: '动物不存在',
        message: `未找到ID为 ${id} 的动物档案`
      });
    }
    
    res.json({
      success: true,
      data: animal,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取动物详情失败',
      message: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

router.post('/api/animals', (req: Request, res: Response<ApiResponse<Animal>>) => {
  try {
    const { name, photos, breed, age, gender, personality, healthTags, station, adoptionRequirements, status } = req.body;
    
    if (!name || !breed || !age || !gender || !personality || !station) {
      return res.status(400).json({
        success: false,
        error: '参数不完整',
        message: 'name、breed、age、gender、personality、station 为必填项'
      });
    }
    
    const newAnimal: Animal = {
      id: uuidv4(),
      name,
      photos: photos || [],
      breed,
      age,
      gender,
      personality,
      healthTags: healthTags || [],
      station,
      adoptionRequirements: adoptionRequirements || [],
      status: status || 'available',
      createdAt: new Date().toISOString()
    };
    
    animals.unshift(newAnimal);
    buildNameIndex();
    
    res.status(201).json({
      success: true,
      data: newAnimal,
      message: '动物档案创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建动物档案失败',
      message: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

router.put('/api/animals/:id', (req: Request, res: Response<ApiResponse<Animal>>) => {
  try {
    const { id } = req.params;
    const index = animals.findIndex(a => a.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: '动物不存在',
        message: `未找到ID为 ${id} 的动物档案`
      });
    }
    
    const { name, photos, breed, age, gender, personality, healthTags, station, adoptionRequirements, status } = req.body;
    
    const updatedAnimal: Animal = {
      ...animals[index],
      name: name || animals[index].name,
      photos: photos !== undefined ? photos : animals[index].photos,
      breed: breed || animals[index].breed,
      age: age || animals[index].age,
      gender: gender || animals[index].gender,
      personality: personality || animals[index].personality,
      healthTags: healthTags !== undefined ? healthTags : animals[index].healthTags,
      station: station || animals[index].station,
      adoptionRequirements: adoptionRequirements !== undefined ? adoptionRequirements : animals[index].adoptionRequirements,
      status: status || animals[index].status
    };
    
    animals[index] = updatedAnimal;
    buildNameIndex();
    
    res.json({
      success: true,
      data: updatedAnimal,
      message: '动物档案更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新动物档案失败',
      message: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

router.delete('/api/animals/:id', (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    const { id } = req.params;
    const index = animals.findIndex(a => a.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: '动物不存在',
        message: `未找到ID为 ${id} 的动物档案`
      });
    }
    
    animals.splice(index, 1);
    buildNameIndex();
    
    res.json({
      success: true,
      data: null,
      message: '动物档案删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除动物档案失败',
      message: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

export default router;
