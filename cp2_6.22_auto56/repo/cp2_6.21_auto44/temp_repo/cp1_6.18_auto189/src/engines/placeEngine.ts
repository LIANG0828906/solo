interface FurniturePayload {
  modelId: string;
  x: number;
  y: number;
  scale: number;
}

interface SaveResult {
  shareUrl: string;
  uuid: string;
}

interface LoadResult {
  imageId: string;
  imageUrl: string;
  furniture: FurniturePayload[];
}

export async function saveScene(
  imageId: string,
  imageUrl: string,
  furniture: FurniturePayload[]
): Promise<SaveResult> {
  const response = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId, imageUrl, furniture }),
  });

  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}`);
  }

  const data: SaveResult = await response.json();
  return data;
}

export async function loadScene(uuid: string): Promise<LoadResult> {
  const response = await fetch(`/api/scene/${uuid}`);

  if (!response.ok) {
    throw new Error(`Load failed with status ${response.status}`);
  }

  const data: LoadResult = await response.json();
  return data;
}
