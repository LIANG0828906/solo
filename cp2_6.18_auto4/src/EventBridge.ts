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

class EventBridge {
  private target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  emit(event: string, detail?: unknown): void {
    this.target.dispatchEvent(new CustomEvent(event, { detail }));
  }

  on(event: string, callback: (detail?: unknown) => void): () => void {
    const handler = (e: Event) => {
      callback((e as CustomEvent).detail);
    };
    this.target.addEventListener(event, handler);
    return () => this.target.removeEventListener(event, handler);
  }
}

export const eventBridge = new EventBridge();
