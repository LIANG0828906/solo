interface Note {
  title: string;
  content: string;
}

export function encodeNote(note: Note): string {
  const json = JSON.stringify(note);
  const encoded = encodeURIComponent(json);
  return btoa(encoded);
}

export function decodeNote(data: string): Note | null {
  try {
    const decoded = atob(data);
    const json = decodeURIComponent(decoded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
