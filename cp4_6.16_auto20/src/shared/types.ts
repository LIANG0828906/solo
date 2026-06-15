export interface User {
  id: string;
  nickname: string;
  isOwner: boolean;
  createdAt: string;
}

export interface Blend {
  id: string;
  name: string;
  flavorDescription: string;
  flavorTags: string[];
  beanRatio: string;
  audioBase64?: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  blendId: string;
  createdAt: string;
}

export interface FlavorNote {
  id: string;
  userId: string;
  blendId: string;
  content: string;
  createdAt: string;
}

export interface BlendWithVotes extends Blend {
  voteCount: number;
  hasVoted: boolean;
}
