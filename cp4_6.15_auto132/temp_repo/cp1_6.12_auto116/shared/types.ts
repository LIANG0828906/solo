export interface ExecutionSnapshot {
  step: number;
  lineNumber: number;
  variables: Record<string, any>;
  arrays: Record<string, number[]>;
  callStack: CallFrame[];
  comparing?: [string, string];
  swapping?: [string, string];
  sorted?: string[];
  currentArrayName?: string;
}

export interface CallFrame {
  functionName: string;
  lineNumber: number;
  arguments: Record<string, any>;
}

export interface ExecuteRequest {
  code: string;
  maxIterations?: number;
}

export interface ExecuteResponse {
  success: boolean;
  totalSteps?: number;
  error?: string;
}

export type WsMessageType = 'snapshot' | 'complete' | 'error';

export interface WsMessage {
  type: WsMessageType;
  payload: any;
}

export interface Algorithm {
  name: string;
  code: string;
  description: string;
  category: 'sorting' | 'searching';
}

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';
