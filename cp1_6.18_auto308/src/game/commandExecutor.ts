import type { Command } from './levelConfig';
import { CommandType, DEFAULT_LEVEL } from './levelConfig';
import { createRecursionContext, enterRecursion, isRecursionLimitReached } from './recursionManager';

export interface PathPoint {
  x: number;
  y: number;
  angle: number;
  commandId?: string;
}

export interface ExecutionResult {
  path: PathPoint[];
  recursionError: boolean;
  errorMessage?: string;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

function turnLeft(angle: number): number {
  return (angle - 90 + 360) % 360;
}

function turnRight(angle: number): number {
  return (angle + 90) % 360;
}

function moveForward(state: TurtleState): TurtleState {
  const rad = (state.angle * Math.PI) / 180;
  return {
    ...state,
    x: state.x + Math.round(Math.cos(rad)),
    y: state.y + Math.round(Math.sin(rad)),
  };
}

export function executeCommands(
  commands: Command[],
  functionDef?: Command
): ExecutionResult {
  const turtle: TurtleState = {
    x: DEFAULT_LEVEL.startPos.x,
    y: DEFAULT_LEVEL.startPos.y,
    angle: DEFAULT_LEVEL.startAngle,
  };
  const path: PathPoint[] = [{ x: turtle.x, y: turtle.y, angle: turtle.angle }];
  const ctx = createRecursionContext();
  let recursionError = false;
  let errorMessage: string | undefined;

  function executeList(cmds: Command[], currentTurtle: TurtleState, currentCtx: typeof ctx): TurtleState {
    let t = currentTurtle;
    for (const cmd of cmds) {
      if (recursionError) break;
      t = executeOne(cmd, t, currentCtx);
    }
    return t;
  }

  function executeOne(cmd: Command, currentTurtle: TurtleState, currentCtx: typeof ctx): TurtleState {
    if (recursionError) return currentTurtle;
    let t = currentTurtle;

    switch (cmd.type) {
      case CommandType.Forward:
        t = moveForward(t);
        t.x = Math.max(0, Math.min(DEFAULT_LEVEL.gridCols - 1, t.x));
        t.y = Math.max(0, Math.min(DEFAULT_LEVEL.gridRows - 1, t.y));
        path.push({ x: t.x, y: t.y, angle: t.angle, commandId: cmd.id });
        break;

      case CommandType.TurnLeft:
        t = { ...t, angle: turnLeft(t.angle) };
        path.push({ x: t.x, y: t.y, angle: t.angle, commandId: cmd.id });
        break;

      case CommandType.TurnRight:
        t = { ...t, angle: turnRight(t.angle) };
        path.push({ x: t.x, y: t.y, angle: t.angle, commandId: cmd.id });
        break;

      case CommandType.Loop: {
        const children = cmd.children || [];
        const loopCount = cmd.loopCount || 3;
        for (let i = 0; i < loopCount; i++) {
          if (recursionError) break;
          t = executeList(children, t, currentCtx);
        }
        break;
      }

      case CommandType.FunctionDef:
        break;

      case CommandType.FunctionCall: {
        if (isRecursionLimitReached(currentCtx)) {
          recursionError = true;
          errorMessage = '递归太深啦！';
          return t;
        }
        if (!functionDef || !functionDef.children) break;
        const newCtx = enterRecursion(currentCtx, cmd.id);
        if (!newCtx) {
          recursionError = true;
          errorMessage = '递归太深啦！';
          return t;
        }
        t = executeList(functionDef.children, t, newCtx);
        break;
      }
    }

    return t;
  }

  executeList(commands, turtle, ctx);

  return { path, recursionError, errorMessage };
}
