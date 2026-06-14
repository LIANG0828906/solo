const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');

router.get('/contract', (req, res) => {
  try {
    const data = contractService.getContractData();
    res.json(data);
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: '获取合同数据失败' });
  }
});

router.post('/comment', (req, res) => {
  try {
    const { lineIndex, content, author, replyToId } = req.body;

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
      replyToId
    );
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message || '添加批注失败' });
  }
});

router.post('/approve', (req, res) => {
  try {
    const { action, user, oldContent, newContent } = req.body;

    if (!user) {
      return res.status(400).json({ error: '用户信息不能为空' });
    }

    if (oldContent === undefined && newContent === undefined && !action) {
      return res.status(400).json({ error: '必须提供审批操作或版本内容' });
    }

    const result = contractService.handleApprovalAction(
      action,
      user,
      oldContent,
      newContent
    );
    res.json(result);
  } catch (error) {
    console.error('Error handling approval:', error);
    res.status(500).json({ error: error.message || '审批操作失败' });
  }
});

router.get('/diff', (req, res) => {
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

module.exports = router;
