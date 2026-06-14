import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import type { Atom, Bond, MoleculeData } from '../../src/types';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.sdf', '.mol'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 .sdf 和 .mol 文件'));
    }
  },
});

interface ParsedCounts {
  atomCount: number;
  bondCount: number;
  atomListStart: number;
  bondListStart: number;
}

function parseCountsLine(line: string): ParsedCounts | null {
  const trimmed = line.trim();
  const regex = /^\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s*$/;
  const match = trimmed.match(regex);
  if (match) {
    return {
      atomCount: parseInt(match[1], 10),
      bondCount: parseInt(match[2], 10),
      atomListStart: 0,
      bondListStart: 0,
    };
  }

  const simpleRegex = /^\s*(\d+)\s+(\d+)/;
  const simpleMatch = trimmed.match(simpleRegex);
  if (simpleMatch) {
    return {
      atomCount: parseInt(simpleMatch[1], 10),
      bondCount: parseInt(simpleMatch[2], 10),
      atomListStart: 0,
      bondListStart: 0,
    };
  }

  return null;
}

function parseAtomLine(line: string, index: number): Atom | null {
  const trimmed = line.trim();
  const regex = /^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+([A-Za-z]+)/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const [, xStr, yStr, zStr, element] = match;

  return {
    id: `atom-${index + 1}-${uuidv4().slice(0, 8)}`,
    element: element.trim().charAt(0).toUpperCase() + element.trim().slice(1).toLowerCase(),
    x: parseFloat(xStr),
    y: parseFloat(yStr),
    z: parseFloat(zStr),
  };
}

function parseBondLine(
  line: string,
  index: number,
  atomIndices: Map<number, string>
): Bond | null {
  const trimmed = line.trim();
  const regex = /^\s*(\d+)\s+(\d+)\s+(\d+)/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const [, atom1IdxStr, atom2IdxStr, orderStr] = match;
  const atom1Idx = parseInt(atom1IdxStr, 10);
  const atom2Idx = parseInt(atom2IdxStr, 10);
  const order = parseInt(orderStr, 10);

  const atom1Id = atomIndices.get(atom1Idx);
  const atom2Id = atomIndices.get(atom2Idx);

  if (!atom1Id || !atom2Id) {
    return null;
  }

  return {
    id: `bond-${index + 1}-${uuidv4().slice(0, 8)}`,
    atom1: atom1Id,
    atom2: atom2Id,
    order: order >= 1 && order <= 3 ? order : 1,
  };
}

function validateSDFContent(content: string): { valid: boolean; error?: string; atomCount?: number; bondCount?: number } {
  const lines = content.split(/\r?\n/);

  if (lines.length < 4) {
    return { valid: false, error: 'SDF文件格式不正确：文件内容过短，至少需要4行（含计数行）' };
  }

  const countsLine = lines[3];
  const countsMatch = countsLine.trim().match(/^(\d+)\s+(\d+)/);

  if (!countsMatch) {
    return { valid: false, error: 'SDF文件格式不正确：第4行(计数行)格式错误，应为"原子数 键数 ..."格式' };
  }

  const atomCount = parseInt(countsMatch[1], 10);
  const bondCount = parseInt(countsMatch[2], 10);

  if (atomCount <= 0 || atomCount > 500) {
    return { valid: false, error: `原子数量异常：${atomCount}个，有效范围为1-500，超过500可能影响性能` };
  }

  if (bondCount < 0 || bondCount > 1000) {
    return { valid: false, error: `化学键数量异常：${bondCount}个，有效范围为0-1000` };
  }

  const expectedAtomLines = atomCount;
  const expectedBondLines = bondCount;
  const expectedDataEnd = 4 + expectedAtomLines + expectedBondLines;

  if (lines.length < expectedDataEnd) {
    return {
      valid: false,
      error: `SDF文件内容不完整：原子+键数据应有${expectedDataEnd}行，实际只有${lines.length}行`,
      atomCount,
      bondCount,
    };
  }

  const endMarkerIndex = lines.findIndex((line) => line.trim() === '$$$$');
  if (endMarkerIndex === -1) {
    return {
      valid: false,
      error: 'SDF文件格式不正确：缺少结束标记 "$$$$"，请检查文件完整性',
      atomCount,
      bondCount,
    };
  }

  if (endMarkerIndex < expectedDataEnd) {
    return {
      valid: false,
      error: `SDF文件格式不正确：结束标记在第${endMarkerIndex + 1}行，但数据应到第${expectedDataEnd}行`,
      atomCount,
      bondCount,
    };
  }

  let actualAtomCount = 0;
  const elementRegex = /^[A-Z][a-z]?$/;
  for (let i = 4; i < 4 + expectedAtomLines; i++) {
    const atomLine = lines[i];
    if (!atomLine || atomLine.trim().length === 0) {
      continue;
    }
    const atomMatch = atomLine.trim().match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+([A-Za-z]{1,2})/);
    if (!atomMatch) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行原子数据格式错误，应为"x y z 元素符号"格式`,
        atomCount,
        bondCount,
      };
    }

    const element = atomMatch[4].charAt(0).toUpperCase() + atomMatch[4].slice(1).toLowerCase();
    if (!elementRegex.test(element)) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行元素符号"${element}"不合法`,
        atomCount,
        bondCount,
      };
    }

    const x = parseFloat(atomMatch[1]);
    const y = parseFloat(atomMatch[2]);
    const z = parseFloat(atomMatch[3]);
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行原子坐标数值无效`,
        atomCount,
        bondCount,
      };
    }

    actualAtomCount++;
  }

  if (actualAtomCount !== atomCount) {
    return {
      valid: false,
      error: `SDF文件计数行声明${atomCount}个原子，但实际解析出${actualAtomCount}个有效原子，数量不匹配`,
      atomCount,
      bondCount,
    };
  }

  let actualBondCount = 0;
  for (let i = 4 + expectedAtomLines; i < expectedDataEnd; i++) {
    const bondLine = lines[i];
    if (!bondLine || bondLine.trim().length === 0) {
      continue;
    }
    const bondMatch = bondLine.trim().match(/^(\d+)\s+(\d+)\s+(\d+)/);
    if (!bondMatch) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行化学键数据格式错误，应为"原子1索引 原子2索引 键级"格式`,
        atomCount,
        bondCount,
      };
    }

    const atom1Idx = parseInt(bondMatch[1], 10);
    const atom2Idx = parseInt(bondMatch[2], 10);
    const order = parseInt(bondMatch[3], 10);

    if (atom1Idx < 1 || atom1Idx > atomCount || atom2Idx < 1 || atom2Idx > atomCount) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行化学键引用的原子索引(${atom1Idx}-${atom2Idx})超出原子总数(${atomCount})范围`,
        atomCount,
        bondCount,
      };
    }

    if (order < 1 || order > 3) {
      return {
        valid: false,
        error: `SDF文件格式不正确：第${i + 1}行键级${order}不合法，应为1(单键)、2(双键)或3(三键)`,
        atomCount,
        bondCount,
      };
    }

    actualBondCount++;
  }

  if (actualBondCount !== bondCount) {
    return {
      valid: false,
      error: `SDF文件计数行声明${bondCount}个化学键，但实际解析出${actualBondCount}个有效键，数量不匹配`,
      atomCount,
      bondCount,
    };
  }

  return { valid: true, atomCount, bondCount };
}

function parseSDF(content: string, filename: string): {
  success: boolean;
  data?: MoleculeData;
  error?: string;
} {
  try {
    const validation = validateSDFContent(content);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'SDF文件格式验证失败',
      };
    }

    const lines = content.split(/\r?\n/);
    const moleculeName = lines[0].trim() || filename.replace(/\.[^.]+$/, '');

    const atomCount = validation.atomCount!;
    const bondCount = validation.bondCount!;

    const atomListStart = 4;
    const bondListStart = atomListStart + atomCount;

    const atoms: Atom[] = [];
    const atomIndices = new Map<number, string>();

    for (let i = 0; i < atomCount; i++) {
      const lineIdx = atomListStart + i;
      const atom = parseAtomLine(lines[lineIdx], i);
      if (!atom) {
        return {
          success: false,
          error: `第 ${lineIdx + 1} 行原子数据解析失败`,
        };
      }
      atoms.push(atom);
      atomIndices.set(i + 1, atom.id);
    }

    const bonds: Bond[] = [];

    for (let i = 0; i < bondCount; i++) {
      const lineIdx = bondListStart + i;
      const bond = parseBondLine(lines[lineIdx], i, atomIndices);
      if (!bond) {
        return {
          success: false,
          error: `第 ${lineIdx + 1} 行化学键数据解析失败`,
        };
      }
      bonds.push(bond);
    }

    const result: MoleculeData = {
      name: moleculeName,
      atoms,
      bonds,
    };

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    return {
      success: false,
      error: `解析文件时发生错误: ${message}`,
    };
  }
}

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '未接收到文件，请确保选择了有效的文件',
      });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;

    const result = parseSDF(content, filename);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '服务器内部错误';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

router.post('/parse-text', (req, res) => {
  try {
    const { content, filename } = req.body as { content?: string; filename?: string };

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '未提供有效的文件内容',
      });
    }

    const result = parseSDF(content, filename || 'molecule.sdf');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '服务器内部错误';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

router.get('/sample', (_req, res) => {
  const sampleData: MoleculeData = {
    name: '乙醇 (Ethanol)',
    atoms: [
      { id: 'atom-1-sample', element: 'C', x: -1.25, y: 0.0, z: 0.0 },
      { id: 'atom-2-sample', element: 'C', x: 0.25, y: 0.0, z: 0.0 },
      { id: 'atom-3-sample', element: 'O', x: 1.0, y: 1.1, z: 0.0 },
      { id: 'atom-4-sample', element: 'H', x: -1.65, y: -0.5, z: 0.9 },
      { id: 'atom-5-sample', element: 'H', x: -1.65, y: -0.5, z: -0.9 },
      { id: 'atom-6-sample', element: 'H', x: -1.65, y: 1.05, z: 0.0 },
      { id: 'atom-7-sample', element: 'H', x: 0.65, y: -0.55, z: 0.9 },
      { id: 'atom-8-sample', element: 'H', x: 0.65, y: -0.55, z: -0.9 },
      { id: 'atom-9-sample', element: 'H', x: 1.95, y: 0.9, z: 0.0 },
    ],
    bonds: [
      { id: 'bond-1-sample', atom1: 'atom-1-sample', atom2: 'atom-2-sample', order: 1 },
      { id: 'bond-2-sample', atom1: 'atom-2-sample', atom2: 'atom-3-sample', order: 1 },
      { id: 'bond-3-sample', atom1: 'atom-1-sample', atom2: 'atom-4-sample', order: 1 },
      { id: 'bond-4-sample', atom1: 'atom-1-sample', atom2: 'atom-5-sample', order: 1 },
      { id: 'bond-5-sample', atom1: 'atom-1-sample', atom2: 'atom-6-sample', order: 1 },
      { id: 'bond-6-sample', atom1: 'atom-2-sample', atom2: 'atom-7-sample', order: 1 },
      { id: 'bond-7-sample', atom1: 'atom-2-sample', atom2: 'atom-8-sample', order: 1 },
      { id: 'bond-8-sample', atom1: 'atom-3-sample', atom2: 'atom-9-sample', order: 1 },
    ],
  };

  res.json({
    success: true,
    data: sampleData,
  });
});

export default router;
