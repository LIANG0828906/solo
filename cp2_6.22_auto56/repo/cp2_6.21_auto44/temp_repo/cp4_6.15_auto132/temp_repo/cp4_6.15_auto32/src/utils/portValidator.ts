import { Port } from '../types/ModuleTypes';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateConnection(fromPort: Port, toPort: Port): ValidationResult {
  if (fromPort.direction !== 'output') {
    return { valid: false, reason: '源端口必须是输出端口' };
  }
  if (toPort.direction !== 'input') {
    return { valid: false, reason: '目标端口必须是输入端口' };
  }
  if (fromPort.moduleId === toPort.moduleId) {
    return { valid: false, reason: '不能连接同一模块的端口' };
  }
  if (fromPort.signalType !== toPort.signalType) {
    return { valid: false, reason: `信号类型不兼容: ${fromPort.signalType} → ${toPort.signalType}` };
  }
  return { valid: true };
}

export const canConnect = validateConnection;
