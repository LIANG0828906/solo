import type { OTOperation } from '../types';

export function generateOps(
  oldStr: string,
  newStr: string,
  blockId: string
): OTOperation[] {
  const ops: OTOperation[] = [];
  let i = 0;
  let j = 0;
  const oldLen = oldStr.length;
  const newLen = newStr.length;

  while (i < oldLen || j < newLen) {
    if (i < oldLen && j < newLen && oldStr[i] === newStr[j]) {
      const retainLen = countEqual(oldStr, newStr, i, j);
      ops.push({ type: 'retain', length: retainLen, blockId });
      i += retainLen;
      j += retainLen;
    } else if (j < newLen && (i >= oldLen || oldStr[i] !== newStr[j])) {
      let insertText = '';
      while (j < newLen && (i >= oldLen || oldStr[i] !== newStr[j])) {
        if (i < oldLen && j + 1 < newLen && newStr[j + 1] === oldStr[i]) {
          insertText += newStr[j];
          j++;
          break;
        }
        insertText += newStr[j];
        j++;
      }
      if (insertText) {
        ops.push({ type: 'insert', position: i, text: insertText, blockId });
      }
    } else if (i < oldLen) {
      let deleteLen = 0;
      while (i + deleteLen < oldLen && (j >= newLen || oldStr[i + deleteLen] !== newStr[j])) {
        deleteLen++;
        if (j < newLen && i + deleteLen < oldLen && oldStr[i + deleteLen] === newStr[j]) {
          break;
        }
      }
      if (deleteLen > 0) {
        ops.push({ type: 'delete', position: i, length: deleteLen, blockId });
        i += deleteLen;
      }
    }
  }

  return mergeOps(ops, blockId);
}

function countEqual(a: string, b: string, ia: number, ib: number): number {
  let count = 0;
  while (ia + count < a.length && ib + count < b.length && a[ia + count] === b[ib + count]) {
    count++;
  }
  return count;
}

function mergeOps(ops: OTOperation[], blockId: string): OTOperation[] {
  const merged: OTOperation[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === 'retain' && op.type === 'retain' && last.blockId === op.blockId) {
      last.length += op.length;
    } else if (last && last.type === 'insert' && op.type === 'insert' && last.blockId === op.blockId && last.position + last.text.length === op.position) {
      last.text += op.text;
    } else if (last && last.type === 'delete' && op.type === 'delete' && last.blockId === op.blockId && last.position === op.position) {
      last.length += op.length;
    } else {
      merged.push({ ...op });
    }
  }
  return merged;
}

export function transformOp(
  op1: OTOperation,
  op2: OTOperation
): OTOperation {
  if (op1.blockId !== op2.blockId) return op1;

  if (op2.type === 'insert') {
    if (op1.type === 'insert') {
      if (op1.position < op2.position || (op1.position === op2.position && op1.text < op2.text)) {
        return op1;
      }
      return { ...op1, position: op1.position + op2.text.length };
    }
    if (op1.type === 'delete') {
      if (op1.position + op1.length <= op2.position) {
        return op1;
      }
      if (op1.position >= op2.position) {
        return { ...op1, position: op1.position + op2.text.length };
      }
      const beforeInsert = op2.position - op1.position;
      return {
        ...op1,
        length: op1.length,
        position: op1.position + op2.text.length,
      };
    }
    if (op1.type === 'retain') {
      return op1;
    }
  }

  if (op2.type === 'delete') {
    if (op1.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      }
      if (op1.position >= op2.position + op2.length) {
        return { ...op1, position: op1.position - op2.length };
      }
      return { ...op1, position: op2.position };
    }
    if (op1.type === 'delete') {
      if (op1.position + op1.length <= op2.position) {
        return op1;
      }
      if (op1.position >= op2.position + op2.length) {
        return { ...op1, position: op1.position - op2.length };
      }
      if (op1.position <= op2.position && op1.position + op1.length >= op2.position + op2.length) {
        const overlapStart = op2.position - op1.position;
        const overlapEnd = overlapStart + op2.length;
        const newLength = op1.length - Math.min(op2.length, op1.length - overlapStart);
        if (newLength <= 0) return { ...op1, length: 0, position: op1.position };
        return { ...op1, length: Math.max(0, newLength) };
      }
      if (op1.position >= op2.position && op1.position < op2.position + op2.length) {
        const newPos = op2.position;
        const newLen = Math.max(0, op1.length - (op2.position + op2.length - op1.position));
        return { ...op1, position: newPos, length: newLen };
      }
      return { ...op1, position: op1.position - Math.min(op2.length, op1.position - op2.position) };
    }
    if (op1.type === 'retain') {
      return op1;
    }
  }

  return op1;
}

export function applyOp(doc: string, op: OTOperation): string {
  switch (op.type) {
    case 'insert':
      return doc.slice(0, op.position) + op.text + doc.slice(op.position);
    case 'delete':
      return doc.slice(0, op.position) + doc.slice(op.position + op.length);
    case 'retain':
      return doc;
    default:
      return doc;
  }
}

export class OTClient {
  private revision: number = 0;
  private pending: OTOperation[] = [];

  getRevision(): number {
    return this.revision;
  }

  getPending(): OTOperation[] {
    return this.pending;
  }

  localEdit(oldContent: string, newContent: string, blockId: string): OTOperation[] {
    const ops = generateOps(oldContent, newContent, blockId);
    this.pending.push(...ops);
    return ops;
  }

  serverAck(): void {
    if (this.pending.length > 0) {
      this.pending.shift();
    }
    this.revision++;
  }

  serverOp(remoteOp: OTOperation): OTOperation | null {
    let transformedOp = { ...remoteOp };

    const newPending: OTOperation[] = [];
    for (const localOp of this.pending) {
      newPending.push(transformOp(localOp, transformedOp));
      transformedOp = transformOp(transformedOp, localOp);
    }
    this.pending = newPending;
    this.revision++;

    if (transformedOp.type === 'delete' && transformedOp.length <= 0) {
      return null;
    }

    return transformedOp;
  }

  reset(revision: number): void {
    this.revision = revision;
    this.pending = [];
  }
}
