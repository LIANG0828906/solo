import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, upload, processAvatar } from '../index';
import type { Pet, ApiResponse } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response<ApiResponse<Pet[]>>) => {
  await db.read();
  const pets = db.data?.pets || [];
  res.json({ code: 0, message: 'success', data: pets });
});

router.get('/:id', async (req: Request, res: Response<ApiResponse<Pet>>) => {
  const { id } = req.params;
  await db.read();
  const pet = db.data?.pets.find((p) => p.id === id);
  if (!pet) {
    return res.json({ code: 1, message: '宠物不存在' });
  }
  res.json({ code: 0, message: 'success', data: pet });
});

router.post('/', upload.single('avatar'), async (req: Request, res: Response<ApiResponse<Pet>>) => {
  try {
    const { name, species, breed, gender, birthday, weight, description } = req.body;
    let avatar = '/uploads/default-avatar.png';

    if (req.file) {
      avatar = await processAvatar(req.file);
    }

    const newPet: Pet = {
      id: uuidv4(),
      name,
      species,
      breed,
      gender,
      birthday,
      weight: parseFloat(weight),
      description,
      avatar,
      createdAt: new Date().toISOString(),
    };

    await db.read();
    db.data?.pets.push(newPet);
    await db.write();

    res.json({ code: 0, message: '创建成功', data: newPet });
  } catch (error) {
    res.json({ code: 1, message: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response<ApiResponse<Pet>>) => {
  const { id } = req.params;
  await db.read();
  const pets = db.data?.pets || [];
  const index = pets.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.json({ code: 1, message: '宠物不存在' });
  }

  pets[index] = { ...pets[index], ...req.body };
  await db.write();

  res.json({ code: 0, message: '更新成功', data: pets[index] });
});

router.delete('/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  const { id } = req.params;
  await db.read();

  if (db.data) {
    db.data.pets = db.data.pets.filter((p) => p.id !== id);
    db.data.records = db.data.records.filter((r) => r.petId !== id);
    db.data.medical = db.data.medical.filter((m) => m.petId !== id);
    db.data.measurements = db.data.measurements.filter((m) => m.petId !== id);
    await db.write();
  }

  res.json({ code: 0, message: '删除成功', data: null });
});

export default router;
