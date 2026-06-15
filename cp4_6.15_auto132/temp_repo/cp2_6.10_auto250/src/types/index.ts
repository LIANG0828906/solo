export interface Guest {
  id: string;
  name: string;
  title: string;
  preference: string;
  avatar?: string;
}

export interface Scene {
  id: string;
  theme: string;
  description: string;
  guests: Guest[];
  atmosphere: number;
  maxAtmosphere: number;
  day: number;
  timeLimit: number;
}

export interface ActionOption {
  id: string;
  name: string;
  description: string;
  category: 'music' | 'chess' | 'painting';
  isCorrect?: boolean;
}

export interface Action {
  music: ActionOption[];
  chess: ActionOption[];
  painting: ActionOption[];
}

export interface EventOption {
  id: string;
  text: string;
  result: string;
  atmosphereChange: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
}

export interface Report {
  totalYaji: number;
  averageAtmosphere: number;
  eventSuccessRate: number;
  achievements: Achievement[];
  comment: string;
  periodStart: string;
  periodEnd: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  atmosphereChange: number;
  newAtmosphere: number;
  triggerEvent?: boolean;
}
