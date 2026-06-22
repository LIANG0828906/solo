import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { User, Blend, Vote, FlavorNote } from '@/shared/types';

const KEYS = {
  USERS: 'users',
  BLENDS: 'blends',
  VOTES: 'votes',
  NOTES: 'notes',
} as const;

async function getUsers(): Promise<User[]> {
  const users = await get<User[]>(KEYS.USERS);
  return users || [];
}

async function setUsers(users: User[]): Promise<void> {
  await set(KEYS.USERS, users);
}

async function getBlends(): Promise<Blend[]> {
  const blends = await get<Blend[]>(KEYS.BLENDS);
  return blends || [];
}

async function setBlends(blends: Blend[]): Promise<void> {
  await set(KEYS.BLENDS, blends);
}

async function getVotes(): Promise<Vote[]> {
  const votes = await get<Vote[]>(KEYS.VOTES);
  return votes || [];
}

async function setVotes(votes: Vote[]): Promise<void> {
  await set(KEYS.VOTES, votes);
}

async function getNotes(): Promise<FlavorNote[]> {
  const notes = await get<FlavorNote[]>(KEYS.NOTES);
  return notes || [];
}

async function setNotes(notes: FlavorNote[]): Promise<void> {
  await set(KEYS.NOTES, notes);
}

export async function getAllBlends(): Promise<Blend[]> {
  const blends = await getBlends();
  return blends.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createBlend(blend: Omit<Blend, 'id' | 'createdAt'>): Promise<Blend> {
  const blends = await getBlends();
  const newBlend: Blend = {
    ...blend,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  blends.push(newBlend);
  await setBlends(blends);
  return newBlend;
}

export async function getVotesByBlend(blendId: string): Promise<Vote[]> {
  const votes = await getVotes();
  return votes.filter((vote) => vote.blendId === blendId);
}

export async function getVoteCountByBlend(blendId: string): Promise<number> {
  const votes = await getVotes();
  return votes.filter((vote) => vote.blendId === blendId).length;
}

export async function hasUserVoted(userId: string, blendId: string): Promise<boolean> {
  const votes = await getVotes();
  return votes.some((vote) => vote.userId === userId && vote.blendId === blendId);
}

export async function createVote(vote: Omit<Vote, 'id' | 'createdAt'>): Promise<Vote> {
  const votes = await getVotes();
  const existing = votes.find((v) => v.userId === vote.userId && v.blendId === vote.blendId);
  if (existing) {
    return existing;
  }
  const newVote: Vote = {
    ...vote,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  votes.push(newVote);
  await setVotes(votes);
  return newVote;
}

export async function createNote(note: Omit<FlavorNote, 'id' | 'createdAt'>): Promise<FlavorNote> {
  const notes = await getNotes();
  const newNote: FlavorNote = {
    ...note,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);
  await setNotes(notes);
  return newNote;
}

export async function getNotesByBlend(blendId: string): Promise<FlavorNote[]> {
  const notes = await getNotes();
  return notes
    .filter((note) => note.blendId === blendId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNotesByUser(userId: string): Promise<FlavorNote[]> {
  const notes = await getNotes();
  return notes.filter((note) => note.userId === userId);
}

export async function getUserByNickname(nickname: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((user) => user.nickname === nickname);
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((user) => user.id === userId);
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const users = await getUsers();
  const newUser: User = {
    ...user,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await setUsers(users);
  return newUser;
}

export async function getUniqueVoterCount(): Promise<number> {
  const votes = await getVotes();
  const uniqueUserIds = new Set(votes.map((vote) => vote.userId));
  return uniqueUserIds.size;
}

export async function getUserVoteMap(userId: string): Promise<Record<string, boolean>> {
  const votes = await getVotes();
  const voteMap: Record<string, boolean> = {};
  votes
    .filter((vote) => vote.userId === userId)
    .forEach((vote) => {
      voteMap[vote.blendId] = true;
    });
  return voteMap;
}

export async function getAllVoteCounts(): Promise<Record<string, number>> {
  const votes = await getVotes();
  const countMap: Record<string, number> = {};
  votes.forEach((vote) => {
    countMap[vote.blendId] = (countMap[vote.blendId] || 0) + 1;
  });
  return countMap;
}

export async function seedMockData(): Promise<void> {
  const existingBlends = await getBlends();
  if (existingBlends.length > 0) {
    return;
  }

  const mockBlends: Omit<Blend, 'id' | 'createdAt'>[] = [
    {
      name: '晨雾之选',
      flavorDescription: '清新明亮的柑橘风味，搭配柔和的坚果余韵，适合清晨开启美好一天。',
      flavorTags: ['柑橘', '坚果', '清新'],
      beanRatio: '埃塞俄比亚 60% + 巴西 40%',
    },
    {
      name: '午夜浓情',
      flavorDescription: '浓郁的可可与焦糖风味，厚重的醇厚度，是夜晚的完美伴侣。',
      flavorTags: ['可可', '焦糖', '浓郁'],
      beanRatio: '哥伦比亚 50% + 印尼曼特宁 50%',
    },
    {
      name: '花香午后',
      flavorDescription: '茉莉花香与莓果酸甜交织，口感清爽优雅，下午茶的绝佳选择。',
      flavorTags: ['花香', '莓果', '优雅'],
      beanRatio: '埃塞俄比亚耶加雪菲 70% + 肯尼亚 30%',
    },
    {
      name: '坚果交响曲',
      flavorDescription: '杏仁、榛子与巧克力的完美融合，醇厚顺滑，余韵悠长。',
      flavorTags: ['坚果', '巧克力', '醇厚'],
      beanRatio: '巴西 60% + 危地马拉 40%',
    },
  ];

  for (const blend of mockBlends) {
    await createBlend(blend);
  }

  const mockUsers: Omit<User, 'id' | 'createdAt'>[] = [
    { nickname: '咖啡爱好者小明', isOwner: false },
    { nickname: '店主老王', isOwner: true },
    { nickname: '拿铁女孩', isOwner: false },
  ];

  for (const user of mockUsers) {
    const existing = await getUserByNickname(user.nickname);
    if (!existing) {
      const createdUser = await createUser(user);
      if (!user.isOwner) {
        const blends = await getAllBlends();
        if (blends.length >= 2) {
          await createVote({ userId: createdUser.id, blendId: blends[0].id });
          await createNote({
            userId: createdUser.id,
            blendId: blends[0].id,
            content: '柑橘香味突出，酸度适中，很喜欢！',
          });
        }
      }
    }
  }
}
