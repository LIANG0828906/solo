import { Router, Request, Response } from 'express';
import contractService from '../services/contractService';
import wsManager from '../websocket/wsManager';
import { ApprovalStatus, HistoryRecord } from '../models/contractModel';

const router: Router = Router();

router.get('/contract', (_req: Request, res: Response) => {
  try {
    const data = contractService.getContractData();
    res.json(data);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: '获取合同数据失败' });
  }
});

router.post('/comment', (req: Request, res: Response) => {
  try {
    const { lineIndex, content, author, parentId } = req.body;

    if (lineIndex === undefined || lineIndex === null) {
      return res.status(400).json({ error: '行索引不能为空' });
    }
    if (!content) {
      return res.status(400).json({ error: '批注内容不能为空' });
    }
    if (!author) {
      return res.status(400).json({ error: '作者信息不能为空' });
    }

    const comment = contractService.addComment(
      Number(lineIndex),
      content,
      author,
      parentId as string | undefined
    );

    wsManager.broadcast('comment_added', { comment });
    wsManager.broadcast('history_updated', { history: contractService.getContractData().history });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    const message = error instanceof Error ? error.message : '添加批注失败';
    res.status(500).json({ error: message });
  }
});

router.post('/approve', (req: Request, res: Response) => {
  try {
    const { action, user, oldContent, newContent } = req.body;

    if (!user) {
      return res.status(400).json({ error: '用户信息不能为空' });
    }

    if (oldContent === undefined && newContent === undefined && !action) {
      return res.status(400).json({ error: '必须提供审批操作或版本内容' });
    }

    const result = contractService.handleApprovalAction(
      action as 'approve' | 'reject' | undefined,
      user,
      oldContent as string | undefined,
      newContent as string | undefined
    );

    wsManager.broadcast('status_updated', { status: result.status });
    wsManager.broadcast('history_updated', { history: result.history });

    if (oldContent !== undefined || newContent !== undefined) {
      wsManager.broadcast('version_uploaded', { oldContent, newContent });
    }

    res.json(result);
  } catch (error) {
    console.error('Error handling approval:', error);
    const message = error instanceof Error ? error.message : '审批操作失败';
    res.status(500).json({ error: message });
  }
});

router.get('/diff', (req: Request, res: Response) => {
  try {
    const { oldText, newText } = req.query;
    const result = contractService.computeDiff(
      typeof oldText === 'string' ? oldText : '',
      typeof newText === 'string' ? newText : ''
    );
    res.json(result);
  } catch (error) {
    console.error('Error computing diff:', error);
    res.status(500).json({ error: '版本对比计算失败' });
  }
});

export default router;
