export interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdAt: string;
  totalVotes: number;
}

export interface VoteListItem {
  id: string;
  title: string;
  description: string;
  optionCount: number;
  totalVotes: number;
  createdAt: string;
}

export async function createVote(
  title: string,
  description: string,
  options: string[]
): Promise<Vote> {
  const res = await fetch('/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, options }),
  });
  if (!res.ok) throw new Error('Failed to create vote');
  return res.json();
}

export async function fetchVotes(): Promise<VoteListItem[]> {
  const res = await fetch('/api/votes');
  if (!res.ok) throw new Error('Failed to fetch votes');
  return res.json();
}

export async function submitVote(
  voteId: string,
  optionId: string
): Promise<Vote> {
  const res = await fetch(`/api/votes/${voteId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId }),
  });
  if (!res.ok) throw new Error('Failed to submit vote');
  return res.json();
}

export async function fetchResults(voteId: string): Promise<Vote> {
  const res = await fetch(`/api/votes/${voteId}/results`);
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}
