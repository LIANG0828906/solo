import { Router, Request, Response } from 'express';
import { createTwoFilesPatch } from 'diff';
import {
  getDocs,
  getDocById,
  createDoc,
  updateDoc,
  deleteDoc,
  getVersions,
  Doc,
} from '../store';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const docs = getDocs();
    const docsWithoutContent = docs.map(({ content, ...rest }) => rest);
    res.status(200).json(docsWithoutContent);
  } catch (err) {
    console.error('获取文档列表失败:', err);
    res.status(500).json({ error: '获取文档列表失败' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, content, lastEditor } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: '文档标题不能为空' });
    }
    if (lastEditor === undefined || lastEditor === null) {
      return res.status(400).json({ error: '缺少创建者信息' });
    }
    const newDoc: Doc = createDoc({
      title: title.trim(),
      content: content ?? '',
      lastEditor,
    });
    res.status(201).json(newDoc);
  } catch (err) {
    console.error('创建文档失败:', err);
    res.status(500).json({ error: '创建文档失败' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = getDocById(id);
    if (!doc) {
      return res.status(404).json({ error: '文档不存在' });
    }
    res.status(200).json(doc);
  } catch (err) {
    console.error('获取文档详情失败:', err);
    res.status(500).json({ error: '获取文档详情失败' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, lastEditor } = req.body;

    const existingDoc = getDocById(id);
    if (!existingDoc) {
      return res.status(404).json({ error: '文档不存在' });
    }

    if (lastEditor === undefined || lastEditor === null) {
      return res.status(400).json({ error: '缺少编辑者信息' });
    }

    const updates: Partial<Omit<Doc, 'id' | 'createdAt' | 'versions'>> = {
      lastEditor,
    };
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: '文档标题不能为空' });
      }
      updates.title = title.trim();
    }
    if (content !== undefined) {
      updates.content = content;
    }

    const updatedDoc = updateDoc(id, updates);
    if (!updatedDoc) {
      return res.status(404).json({ error: '文档不存在' });
    }
    res.status(200).json(updatedDoc);
  } catch (err) {
    console.error('更新文档失败:', err);
    res.status(500).json({ error: '更新文档失败' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = deleteDoc(id);
    if (!success) {
      return res.status(404).json({ error: '文档不存在' });
    }
    res.status(200).json({ message: '文档已删除' });
  } catch (err) {
    console.error('删除文档失败:', err);
    res.status(500).json({ error: '删除文档失败' });
  }
});

router.get('/:id/diff', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const doc = getDocById(id);
    if (!doc) {
      return res.status(404).json({ error: '文档不存在' });
    }

    if (!from || !to) {
      return res.status(400).json({ error: '缺少 from 或 to 参数' });
    }

    const versions = getVersions(id);
    const fromVersion = versions.find((v) => v.id === from || v.version === Number(from));
    const toVersion = versions.find((v) => v.id === to || v.version === Number(to));

    if (!fromVersion) {
      return res.status(404).json({ error: '起始版本不存在' });
    }
    if (!toVersion) {
      return res.status(404).json({ error: '目标版本不存在' });
    }

    const diff = createTwoFilesPatch(
      `v${fromVersion.version}`,
      `v${toVersion.version}`,
      fromVersion.content,
      toVersion.content,
      fromVersion.createdAt,
      toVersion.createdAt
    );

    res.status(200).json({
      from: {
        id: fromVersion.id,
        version: fromVersion.version,
        editor: fromVersion.editor,
        createdAt: fromVersion.createdAt,
      },
      to: {
        id: toVersion.id,
        version: toVersion.version,
        editor: toVersion.editor,
        createdAt: toVersion.createdAt,
      },
      diff,
    });
  } catch (err) {
    console.error('计算版本差异失败:', err);
    res.status(500).json({ error: '计算版本差异失败' });
  }
});

export default router;
