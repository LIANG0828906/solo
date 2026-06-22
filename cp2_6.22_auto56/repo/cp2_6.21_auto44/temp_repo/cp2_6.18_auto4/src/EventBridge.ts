export interface ApplicationData {
  name: string;
  idNumber: string;
  phone: string;
  companyName: string;
  avgRevenue: number;
  hasCollateral: boolean;
}

export interface AssessmentResult {
  score: number;
  estimatedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface EventMap {
  application: ApplicationData;
  result: AssessmentResult;
}

class EventBridge {
  private target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  emit<K extends keyof EventMap>(event: K, detail: EventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent<EventMap[K]>(event, { detail }));
  }

  on<K extends keyof EventMap>(
    event: K,
    callback: (detail: EventMap[K]) => void
  ): () => void {
    const handler = (e: Event) => {
      callback((e as CustomEvent<EventMap[K]>).detail);
    };
    this.target.addEventListener(event, handler);
    return () => this.target.removeEventListener(event, handler);
  }
}

export const eventBridge = new EventBridge();
