import { Router, Request, Response } from 'express';
import { createTwoFilesPatch } from 'diff';
import {
  getVersions,
  getVersion,
  getDocById,
} from '../store';

const router = Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = getDocById(id);
    if (!doc) {
      return res.status(404).json({ error: '文档不存在' });
    }
    const versions = getVersions(id);
    const sorted = [...versions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.status(200).json(sorted);
  } catch (err) {
    console.error('获取版本列表失败:', err);
    res.status(500).json({ error: '获取版本列表失败' });
  }
});

router.get('/:versionId', (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const doc = getDocById(id);
    if (!doc) {
      return res.status(404).json({ error: '文档不存在' });
    }
    const version = getVersion(id, versionId);
    if (!version) {
      return res.status(404).json({ error: '版本不存在' });
    }
    res.status(200).json(version);
  } catch (err) {
    console.error('获取版本详情失败:', err);
    res.status(500).json({ error: '获取版本详情失败' });
  }
});

router.get('/diff', (req: Request, res: Response) => {
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
