import { v4 as uuidv4 } from 'uuid';
import { Stall, StallType, GridManager } from './gridManager';

export type EventType = 'rain' | 'sunny' | 'foodFestival' | 'weekend' | 'holiday' | 'windy';

export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  effects: {
    stallType?: StallType;
    customerModifier: number;
    revenueModifier: number;
  };
  duration: number;
  color: string;
  icon: string;
}

const EVENT_TEMPLATES: Omit<GameEvent, 'id'>[] = [
  {
    type: 'rain',
    name: '下雨天',
    description: '雨天导致烧烤摊客流减少30%',
    effects: {
      stallType: 'bbq',
      customerModifier: 0.7,
      revenueModifier: 0.7
    },
    duration: 1,
    color: 'linear-gradient(135deg, #87CEEB, #4682B4)',
    icon: '🌧️'
  },
  {
    type: 'sunny',
    name: '晴朗好天气',
    description: '阳光明媚，所有摊位客流增加20%',
    effects: {
      customerModifier: 1.2,
      revenueModifier: 1.1
    },
    duration: 1,
    color: 'linear-gradient(135deg, #FFD700, #FFA500)',
    icon: '☀️'
  },
  {
    type: 'foodFestival',
    name: '美食节',
    description: '美食节盛大开幕！所有摊位营收增加50%',
    effects: {
      customerModifier: 1.5,
      revenueModifier: 1.5
    },
    duration: 2,
    color: 'linear-gradient(135deg, #FF7F50, #FF69B4)',
    icon: '🎉'
  },
  {
    type: 'weekend',
    name: '周末来袭',
    description: '周末假期，奶茶铺客流增加40%',
    effects: {
      stallType: 'milktea',
      customerModifier: 1.4,
      revenueModifier: 1.2
    },
    duration: 2,
    color: 'linear-gradient(135deg, #98FB98, #3CB371)',
    icon: '📅'
  },
  {
    type: 'holiday',
    name: '节假日',
    description: '节假日到来，汉堡车客流增加35%',
    effects: {
      stallType: 'burger',
      customerModifier: 1.35,
      revenueModifier: 1.25
    },
    duration: 3,
    color: 'linear-gradient(135deg, #FFB6C1, #FF69B4)',
    icon: '🎊'
  },
  {
    type: 'windy',
    name: '大风天气',
    description: '大风天气影响户外经营，所有摊位客流减少15%',
    effects: {
      customerModifier: 0.85,
      revenueModifier: 0.9
    },
    duration: 1,
    color: 'linear-gradient(135deg, #B0C4DE, #708090)',
    icon: '💨'
  }
];

export class EventSystem {
  private gridManager: GridManager;
  private currentEvent: GameEvent | null = null;
  private eventDuration: number = 0;
  private onEventTriggered: ((event: GameEvent) => void) | null = null;
  private onEventEnded: ((event: GameEvent) => void) | null = null;
  
  constructor(gridManager: GridManager) {
    this.gridManager = gridManager;
  }
  
  setOnEventTriggered(callback: (event: GameEvent) => void): void {
    this.onEventTriggered = callback;
  }
  
  setOnEventEnded(callback: (event: GameEvent) => void): void {
    this.onEventEnded = callback;
  }
  
  generateRandomEvent(): GameEvent | null {
    if (this.currentEvent) return null;
    
    if (Math.random() > 0.4) return null;
    
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    const event: GameEvent = {
      ...template,
      id: uuidv4()
    };
    
    this.triggerEvent(event);
    return event;
  }
  
  triggerEvent(event: GameEvent): void {
    this.currentEvent = event;
    this.eventDuration = event.duration;
    
    this.applyEventEffects(event);
    
    if (this.onEventTriggered) {
      this.onEventTriggered(event);
    }
    
    this.triggerFlashEffect(event);
  }
  
  private applyEventEffects(event: GameEvent): void {
    this.gridManager.stalls.forEach(stall => {
      if (!event.effects.stallType || stall.type === event.effects.stallType) {
        stall.satisfaction = Math.min(1, stall.satisfaction * event.effects.revenueModifier);
      }
    });
  }
  
  private removeEventEffects(event: GameEvent): void {
    this.gridManager.stalls.forEach(stall => {
      if (!event.effects.stallType || stall.type === event.effects.stallType) {
        stall.satisfaction = Math.min(1, stall.satisfaction / event.effects.revenueModifier);
        this.gridManager.setStallFlashing(stall, false);
      }
    });
  }
  
  private triggerFlashEffect(event: GameEvent): void {
    this.gridManager.stalls.forEach(stall => {
      if (!event.effects.stallType || stall.type === event.effects.stallType) {
        this.gridManager.setStallFlashing(stall, true);
        
        setTimeout(() => {
          if (this.currentEvent?.id === event.id) {
            this.gridManager.setStallFlashing(stall, false);
          }
        }, 3000);
      }
    });
  }
  
  onNewDay(): void {
    if (this.currentEvent) {
      this.eventDuration--;
      if (this.eventDuration <= 0) {
        this.endEvent();
      }
    }
  }
  
  private endEvent(): void {
    if (this.currentEvent) {
      this.removeEventEffects(this.currentEvent);
      
      if (this.onEventEnded) {
        this.onEventEnded(this.currentEvent);
      }
      
      this.currentEvent = null;
    }
  }
  
  getCustomerModifier(stall: Stall): number {
    if (!this.currentEvent) return 1;
    if (this.currentEvent.effects.stallType && stall.type !== this.currentEvent.effects.stallType) return 1;
    return this.currentEvent.effects.customerModifier;
  }
  
  getRevenueModifier(stall: Stall): number {
    if (!this.currentEvent) return 1;
    if (this.currentEvent.effects.stallType && stall.type !== this.currentEvent.effects.stallType) return 1;
    return this.currentEvent.effects.revenueModifier;
  }
  
  getCurrentEvent(): GameEvent | null {
    return this.currentEvent;
  }
  
  getEventDuration(): number {
    return this.eventDuration;
  }
  
  getEventTemplates(): Omit<GameEvent, 'id'>[] {
    return EVENT_TEMPLATES;
  }
}
