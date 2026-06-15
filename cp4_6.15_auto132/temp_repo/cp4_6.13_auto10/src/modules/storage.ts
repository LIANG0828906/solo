import type { MidiClip, Composition } from './toneEngine';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(API_BASE + url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return undefined as unknown as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

export async function getClips(): Promise<MidiClip[]> {
  return request<MidiClip[]>('/clips');
}

export async function saveClip(
  clip: Omit<MidiClip, 'id' | 'createdAt'>
): Promise<MidiClip> {
  return request<MidiClip>('/clips', {
    method: 'POST',
    body: JSON.stringify(clip),
  });
}

export async function deleteClip(id: string): Promise<void> {
  return request<void>(`/clips/${id}`, {
    method: 'DELETE',
  });
}

export async function getCompositions(): Promise<Composition[]> {
  return request<Composition[]>('/compositions');
}

export async function saveComposition(
  comp: Omit<Composition, 'id' | 'createdAt'>
): Promise<Composition> {
  return request<Composition>('/compositions', {
    method: 'POST',
    body: JSON.stringify(comp),
  });
}

export async function updateComposition(
  comp: Composition & { id: string }
): Promise<Composition> {
  return request<Composition>(`/compositions/${comp.id}`, {
    method: 'PUT',
    body: JSON.stringify(comp),
  });
}

export async function deleteComposition(id: string): Promise<void> {
  return request<void>(`/compositions/${id}`, {
    method: 'DELETE',
  });
}
