export async function fetchArtworks() {
  const res = await fetch('/api/artworks');
  return res.json();
}

export async function uploadArtwork(formData: FormData) {
  const res = await fetch('/api/artworks', {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function likeArtwork(id: string) {
  const res = await fetch(`/api/artworks/${id}/like`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchComments(artworkId: string) {
  const res = await fetch(`/api/artworks/${artworkId}/comments`);
  return res.json();
}

export async function addComment(artworkId: string, text: string) {
  const res = await fetch(`/api/artworks/${artworkId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function fetchVisitorCount() {
  const res = await fetch('/api/visitors');
  return res.json();
}
