import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const users = new Map();
const pets = new Map();

const mockOnlineUsers = [
  { id: 'mock-1', name: '小明', pet: { id: 'mpet-1', name: '咪咪', type: 'cat', hunger: 80, cleanliness: 70, happiness: 90, mood: '😊' } },
  { id: 'mock-2', name: '小红', pet: { id: 'mpet-2', name: '旺财', type: 'dog', hunger: 60, cleanliness: 90, happiness: 75, mood: '😄' } },
  { id: 'mock-3', name: '小华', pet: { id: 'mpet-3', name: '小火', type: 'dragon', hunger: 90, cleanliness: 60, happiness: 85, mood: '😎' } },
  { id: 'mock-4', name: '小丽', pet: { id: 'mpet-4', name: '豆豆', type: 'dog', hunger: 70, cleanliness: 80, happiness: 65, mood: '🙂' } },
  { id: 'mock-5', name: '小刚', pet: { id: 'mpet-5', name: '花花', type: 'cat', hunger: 55, cleanliness: 75, happiness: 80, mood: '😺' } },
  { id: 'mock-6', name: '小美', pet: { id: 'mpet-6', name: '烈焰', type: 'dragon', hunger: 85, cleanliness: 65, happiness: 70, mood: '🔥' } },
  { id: 'mock-7', name: '阿杰', pet: { id: 'mpet-7', name: '团子', type: 'cat', hunger: 75, cleanliness: 85, happiness: 95, mood: '😻' } },
  { id: 'mock-8', name: '小雨', pet: { id: 'mpet-8', name: '大黄', type: 'dog', hunger: 65, cleanliness: 55, happiness: 60, mood: '🐶' } },
];

app.post('/api/pet/adopt', (req, res) => {
  const { type, ownerName, petName } = req.body;
  const userId = uuidv4();
  const petId = uuidv4();
  const pet = {
    id: petId,
    name: petName || (type === 'cat' ? '小猫咪' : type === 'dog' ? '小狗狗' : '小火龙'),
    type,
    hunger: 80,
    cleanliness: 80,
    happiness: 80,
    ownerId: userId,
    ownerName: ownerName || '主人',
    createdAt: Date.now(),
  };
  const user = { id: userId, name: ownerName || '主人', petId };
  users.set(userId, user);
  pets.set(petId, pet);
  res.json({ user, pet });
});

app.get('/api/pet', (req, res) => {
  const petId = req.headers['x-pet-id'];
  const pet = pets.get(petId);
  if (!pet) return res.status(404).json({ error: 'Pet not found' });
  res.json(pet);
});

app.post('/api/pet/feed', (req, res) => {
  const { petId, foodType } = req.body;
  const pet = pets.get(petId);
  if (!pet) return res.status(404).json({ error: 'Pet not found' });
  const increment = foodType === 'premium' ? 30 : foodType === 'treat' ? 15 : 20;
  pet.hunger = Math.min(100, pet.hunger + increment);
  pet.happiness = Math.min(100, pet.happiness + 5);
  res.json({ ...pet });
});

app.post('/api/pet/clean', (req, res) => {
  const { petId } = req.body;
  const pet = pets.get(petId);
  if (!pet) return res.status(404).json({ error: 'Pet not found' });
  pet.cleanliness = Math.min(100, pet.cleanliness + 30);
  pet.happiness = Math.min(100, pet.happiness + 5);
  res.json({ ...pet });
});

app.post('/api/pet/interact', (req, res) => {
  const { petId } = req.body;
  const pet = pets.get(petId);
  if (!pet) return res.status(404).json({ error: 'Pet not found' });
  pet.happiness = Math.min(100, pet.happiness + 20);
  pet.hunger = Math.max(0, pet.hunger - 3);
  res.json({ ...pet });
});

app.get('/api/community/online-pets', (req, res) => {
  const onlinePets = mockOnlineUsers.map(u => ({
    ...u.pet,
    ownerId: u.id,
    ownerName: u.name,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
  }));
  const realPets = Array.from(pets.values()).map(p => ({
    ...p,
    mood: p.happiness > 80 ? '😊' : p.happiness > 50 ? '🙂' : '😢',
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
  }));
  res.json([...onlinePets, ...realPets]);
});

app.post('/api/community/gift', (req, res) => {
  const { fromPetId, toPetId, giftType } = req.body;
  const giftNames = { bone: '骨头', fish: '小鱼', star: '星星' };
  res.json({ success: true, message: `成功赠送${giftNames[giftType] || '礼物'}！` });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Pet server running on http://localhost:${PORT}`);
});
