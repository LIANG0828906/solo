import type { Card } from '../types';

const BASE_URL = '/api/cards';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMessage = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
  }
  return response.json();
}

export async function fetchCards(): Promise<Card[]> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<Card[]>(response);
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    throw error;
  }
}

export async function fetchCard(id: number): Promise<Card> {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<Card>(response);
  } catch (error) {
    console.error(`Failed to fetch card with id ${id}:`, error);
    throw error;
  }
}

export async function createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
    return handleResponse<Card>(response);
  } catch (error) {
    console.error('Failed to create card:', error);
    throw error;
  }
}

export async function updateCard(id: number, card: Partial<Card>): Promise<Card> {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
    return handleResponse<Card>(response);
  } catch (error) {
    console.error(`Failed to update card with id ${id}:`, error);
    throw error;
  }
}

export async function deleteCard(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorMessage = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete card with id ${id}:`, error);
    throw error;
  }
}

export async function fetchCardsByTag(tag: string): Promise<Card[]> {
  try {
    const response = await fetch(`${BASE_URL}/tag/${encodeURIComponent(tag)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<Card[]>(response);
  } catch (error) {
    console.error(`Failed to fetch cards by tag ${tag}:`, error);
    throw error;
  }
}
