import type { LightingPlan, LightSource } from '@/types'

const BASE_URL = '/api/lighting-plans'

export async function fetchPlans(): Promise<LightingPlan[]> {
  const res = await fetch(BASE_URL)
  return res.json()
}

export async function createPlan(
  name: string,
  lights: LightSource[]
): Promise<LightingPlan> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, lights }),
  })
  return res.json()
}

export async function updatePlan(
  id: string,
  name: string,
  lights: LightSource[]
): Promise<LightingPlan> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, lights }),
  })
  return res.json()
}

export async function deletePlan(id: string): Promise<void> {
  await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
}
