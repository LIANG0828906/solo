import type { User } from '@/shared/types';

const API_BASE = '';

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/api/users`);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`Failed to add user: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
}
