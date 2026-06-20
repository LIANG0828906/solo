export enum CommandType {
  Forward = 'forward',
  TurnLeft = 'turnLeft',
  TurnRight = 'turnRight',
  Loop = 'loop',
  FunctionDef = 'functionDef',
  FunctionCall = 'functionCall',
}

export interface Command {
  id: string;
  type: CommandType;
  children?: Command[];
  loopCount?: number;
}

export interface LevelConfig {
  gridCols: number;
  gridRows: number;
  cellSize: number;
  startPos: { x: number; y: number };
  startAngle: number;
  maxCommands: number;
  maxFunctionChildren: number;
  maxRecursionDepth: number;
  commandLimits: Record<CommandType, number>;
}

export const DEFAULT_LEVEL: LevelConfig = {
  gridCols: 10,
  gridRows: 10,
  cellSize: 40,
  startPos: { x: 5, y: 5 },
  startAngle: 0,
  maxCommands: 30,
  maxFunctionChildren: 5,
  maxRecursionDepth: 3,
  commandLimits: {
    [CommandType.Forward]: 30,
    [CommandType.TurnLeft]: 30,
    [CommandType.TurnRight]: 30,
    [CommandType.Loop]: 5,
    [CommandType.FunctionDef]: 1,
    [CommandType.FunctionCall]: 30,
  },
};

export const COMMAND_COLORS: Record<CommandType, string> = {
  [CommandType.Forward]: '#4CAF50',
  [CommandType.TurnLeft]: '#FF9800',
  [CommandType.TurnRight]: '#FF9800',
  [CommandType.Loop]: '#2196F3',
  [CommandType.FunctionDef]: '#9C27B0',
  [CommandType.FunctionCall]: '#9C27B0',
};

export const COMMAND_LABELS: Record<CommandType, string> = {
  [CommandType.Forward]: '前进',
  [CommandType.TurnLeft]: '左转',
  [CommandType.TurnRight]: '右转',
  [CommandType.Loop]: '循环×3',
  [CommandType.FunctionDef]: '我的函数',
  [CommandType.FunctionCall]: '调用函数',
};

export const COMMAND_GROUPS = [
  {
    title: '基础指令',
    types: [CommandType.Forward, CommandType.TurnLeft, CommandType.TurnRight],
  },
  {
    title: '控制指令',
    types: [CommandType.Loop],
  },
  {
    title: '函数指令',
    types: [CommandType.FunctionDef, CommandType.FunctionCall],
  },
];
