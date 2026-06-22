const API_BASE = '/api';

export async function fetchBoards() {
  const res = await fetch(`${API_BASE}/boards`);
  return res.json();
}

export async function fetchBoard(id: string) {
  const res = await fetch(`${API_BASE}/boards/${id}`);
  return res.json();
}

export async function createBoard(name: string, description: string) {
  const res = await fetch(`${API_BASE}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  return res.json();
}

export async function createTask(boardId: string, title: string, description: string, assignee: string) {
  const res = await fetch(`${API_BASE}/boards/${boardId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, assignee }),
  });
  return res.json();
}

export async function updateTaskStatus(boardId: string, taskId: string, status: string) {
  const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function addComment(boardId: string, taskId: string, username: string, content: string) {
  const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content }),
  });
  return res.json();
}

export async function fetchComments(boardId: string, taskId: string) {
  const res = await fetch(`${API_BASE}/boards/${boardId}/tasks/${taskId}/comments`);
  return res.json();
}

export async function fetchMembers() {
  const res = await fetch(`${API_BASE}/members`);
  return res.json();
}
