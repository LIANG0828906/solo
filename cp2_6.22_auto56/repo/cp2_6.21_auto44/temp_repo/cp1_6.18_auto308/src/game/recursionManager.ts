import { DEFAULT_LEVEL } from './levelConfig';
import type { Command } from './levelConfig';

export interface RecursionContext {
  depth: number;
  maxDepth: number;
  callStack: string[];
}

export function createRecursionContext(): RecursionContext {
  return {
    depth: 0,
    maxDepth: DEFAULT_LEVEL.maxRecursionDepth,
    callStack: [],
  };
}

export function enterRecursion(ctx: RecursionContext, functionId: string): RecursionContext | null {
  if (ctx.depth >= ctx.maxDepth) {
    return null;
  }
  return {
    depth: ctx.depth + 1,
    maxDepth: ctx.maxDepth,
    callStack: [...ctx.callStack, functionId],
  };
}

export function isRecursionLimitReached(ctx: RecursionContext): boolean {
  return ctx.depth >= ctx.maxDepth;
}

export function getCallStackDepth(ctx: RecursionContext): number {
  return ctx.depth;
}
