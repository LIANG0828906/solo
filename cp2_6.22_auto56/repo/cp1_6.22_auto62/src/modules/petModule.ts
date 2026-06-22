export interface Pet {
  id: string;
  name: string;
  type: 'cat' | 'dog' | 'dragon';
  hunger: number;
  cleanliness: number;
  happiness: number;
  ownerId: string;
  ownerName: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  petId: string;
}

const API_BASE = '/api';

export async function adoptPet(
  type: 'cat' | 'dog' | 'dragon',
  ownerName: string,
  petName: string
): Promise<{ user: User; pet: Pet }> {
  const res = await fetch(`${API_BASE}/pet/adopt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ownerName, petName }),
  });
  return res.json();
}

export async function getPet(petId: string): Promise<Pet> {
  const res = await fetch(`${API_BASE}/pet`, {
    headers: { 'x-pet-id': petId },
  });
  return res.json();
}

export async function feedPet(petId: string, foodType: string): Promise<Pet> {
  const res = await fetch(`${API_BASE}/pet/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, foodType }),
  });
  return res.json();
}

export async function cleanPet(petId: string): Promise<Pet> {
  const res = await fetch(`${API_BASE}/pet/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId }),
  });
  return res.json();
}

export async function interactPet(petId: string): Promise<Pet> {
  const res = await fetch(`${API_BASE}/pet/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId }),
  });
  return res.json();
}

export function savePetData(user: User, pet: Pet): void {
  localStorage.setItem('vp_user', JSON.stringify(user));
  localStorage.setItem('vp_pet', JSON.stringify(pet));
}

export function loadPetData(): { user: User | null; pet: Pet | null } {
  try {
    const userStr = localStorage.getItem('vp_user');
    const petStr = localStorage.getItem('vp_pet');
    return {
      user: userStr ? JSON.parse(userStr) : null,
      pet: petStr ? JSON.parse(petStr) : null,
    };
  } catch {
    return { user: null, pet: null };
  }
}

export function clearPetData(): void {
  localStorage.removeItem('vp_user');
  localStorage.removeItem('vp_pet');
}
