import { Card, Group, User, TeamState } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const teamStates: Map<string, TeamState> = new Map();

export const getTeamState = (teamName: string): TeamState => {
  if (!teamStates.has(teamName)) {
    teamStates.set(teamName, {
      cards: [],
      groups: [
        { id: uuidv4(), name: '未分组' },
      ],
      users: [],
      votingActive: false,
      votingRound: 0,
    });
  }
  return teamStates.get(teamName)!;
};

export const addCard = (teamName: string, card: Omit<Card, 'id' | 'votes' | 'votedBy' | 'createdAt'>): Card => {
  const state = getTeamState(teamName);
  const newCard: Card = {
    ...card,
    id: uuidv4(),
    votes: 0,
    votedBy: [],
    createdAt: Date.now(),
  };
  state.cards.push(newCard);
  return newCard;
};

export const updateCardPosition = (teamName: string, cardId: string, x: number, y: number): Card | null => {
  const state = getTeamState(teamName);
  const card = state.cards.find((c) => c.id === cardId);
  if (card) {
    card.x = x;
    card.y = y;
    return card;
  }
  return null;
};

export const updateCardGroup = (teamName: string, cardId: string, groupId: string | null): Card | null => {
  const state = getTeamState(teamName);
  const card = state.cards.find((c) => c.id === cardId);
  if (card) {
    card.groupId = groupId;
    return card;
  }
  return null;
};

export const deleteCard = (teamName: string, cardId: string): boolean => {
  const state = getTeamState(teamName);
  const index = state.cards.findIndex((c) => c.id === cardId);
  if (index !== -1) {
    state.cards.splice(index, 1);
    return true;
  }
  return false;
};

export const addUser = (teamName: string, user: Omit<User, 'votesRemaining'>): User => {
  const state = getTeamState(teamName);
  const existingUser = state.users.find((u) => u.id === user.id);
  if (existingUser) {
    return existingUser;
  }
  const newUser: User = {
    ...user,
    votesRemaining: 5,
  };
  state.users.push(newUser);
  return newUser;
};

export const removeUser = (teamName: string, userId: string): boolean => {
  const state = getTeamState(teamName);
  const index = state.users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    state.users.splice(index, 1);
    return true;
  }
  return false;
};

export const getUser = (teamName: string, userId: string): User | undefined => {
  const state = getTeamState(teamName);
  return state.users.find((u) => u.id === userId);
};

export const voteCard = (teamName: string, cardId: string, userId: string): { card: Card; user: User } | null => {
  const state = getTeamState(teamName);
  const card = state.cards.find((c) => c.id === cardId);
  const user = state.users.find((u) => u.id === userId);

  if (!card || !user) return null;
  if (user.votesRemaining <= 0) return null;
  if (card.votedBy.includes(userId)) return null;

  card.votes += 1;
  card.votedBy.push(userId);
  user.votesRemaining -= 1;

  return { card, user };
};

export const startVoting = (teamName: string): TeamState => {
  const state = getTeamState(teamName);
  state.votingActive = true;
  state.votingRound += 1;
  state.users.forEach((u) => {
    u.votesRemaining = 5;
  });
  return state;
};

export const endVoting = (teamName: string): TeamState => {
  const state = getTeamState(teamName);
  state.votingActive = false;
  return state;
};

export const getSortedCards = (teamName: string): Card[] => {
  const state = getTeamState(teamName);
  return [...state.cards].sort((a, b) => b.votes - a.votes);
};

export const updateGroupName = (teamName: string, groupId: string, name: string): Group | null => {
  const state = getTeamState(teamName);
  const group = state.groups.find((g) => g.id === groupId);
  if (group) {
    group.name = name;
    return group;
  }
  return null;
};

export const addGroup = (teamName: string, name: string): Group => {
  const state = getTeamState(teamName);
  const newGroup: Group = {
    id: uuidv4(),
    name,
  };
  state.groups.push(newGroup);
  return newGroup;
};

export const deleteGroup = (teamName: string, groupId: string): boolean => {
  const state = getTeamState(teamName);
  const index = state.groups.findIndex((g) => g.id === groupId);
  if (index !== -1) {
    state.groups.splice(index, 1);
    state.cards.forEach((card) => {
      if (card.groupId === groupId) {
        card.groupId = null;
      }
    });
    return true;
  }
  return false;
};
