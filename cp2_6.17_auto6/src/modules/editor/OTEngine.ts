export interface Operation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  revision?: number;
}

export function transformOperation(op1: Operation, op2: Operation): Operation {
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (
      op1.position < op2.position ||
      (op1.position === op2.position && op1.userId < op2.userId)
    ) {
      return { ...op1 };
    }
    return { ...op1, position: op1.position + (op2.text?.length || 0) };
  }

  if (op1.type === 'insert' && op2.type === 'delete') {
    if (op1.position <= op2.position) return { ...op1 };
    if (op1.position >= op2.position + (op2.length || 0)) {
      return { ...op1, position: op1.position - (op2.length || 0) };
    }
    return { ...op1, position: op2.position };
  }

  if (op1.type === 'delete' && op2.type === 'insert') {
    const insertLen = op2.text?.length || 0;
    if (op2.position >= op1.position + (op1.length || 0)) return { ...op1 };
    if (op2.position <= op1.position) {
      return { ...op1, position: op1.position + insertLen };
    }
    const beforeInsert = op2.position - op1.position;
    return {
      ...op1,
      length: (op1.length || 0) + insertLen,
    };
  }

  if (op1.type === 'delete' && op2.type === 'delete') {
    const len1 = op1.length || 0;
    const len2 = op2.length || 0;
    if (op1.position >= op2.position + len2) {
      return { ...op1, position: op1.position - len2 };
    }
    if (op2.position >= op1.position + len1) {
      return { ...op1 };
    }
    const startOverlap = Math.max(op1.position, op2.position);
    const endOverlap = Math.min(op1.position + len1, op2.position + len2);
    const overlapLen = Math.max(0, endOverlap - startOverlap);
    if (op2.position <= op1.position && op2.position + len2 >= op1.position + len1) {
      return { ...op1, length: 0 };
    }
    if (op2.position <= op1.position) {
      return {
        ...op1,
        position: op2.position,
        length: Math.max(0, len1 - overlapLen),
      };
    }
    return {
      ...op1,
      length: Math.max(0, len1 - overlapLen),
    };
  }

  return { ...op1 };
}

export function applyOperation(doc: string, op: Operation): string {
  if (op.type === 'insert') {
    return doc.slice(0, op.position) + (op.text || '') + doc.slice(op.position);
  }
  if (op.type === 'delete') {
    const len = op.length || 0;
    if (len <= 0) return doc;
    return doc.slice(0, op.position) + doc.slice(op.position + len);
  }
  return doc;
}

export function computeOperation(
  oldText: string,
  newText: string,
  userId: string
): Operation | null {
  if (oldText === newText) return null;

  let prefixLen = 0;
  while (
    prefixLen < oldText.length &&
    prefixLen < newText.length &&
    oldText[prefixLen] === newText[prefixLen]
  ) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < oldText.length - prefixLen &&
    suffixLen < newText.length - prefixLen &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldMiddleLen = oldText.length - prefixLen - suffixLen;
  const newMiddleLen = newText.length - prefixLen - suffixLen;

  if (oldMiddleLen === 0 && newMiddleLen > 0) {
    return {
      type: 'insert',
      position: prefixLen,
      text: newText.slice(prefixLen, prefixLen + newMiddleLen),
      userId,
    };
  }

  if (newMiddleLen === 0 && oldMiddleLen > 0) {
    return {
      type: 'delete',
      position: prefixLen,
      length: oldMiddleLen,
      userId,
    };
  }

  return {
    type: 'insert',
    position: prefixLen,
    text: newText.slice(prefixLen, prefixLen + newMiddleLen),
    userId,
  };
}
