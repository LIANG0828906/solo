const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

router.post('/save', async (req, res) => {
  try {
    const state = req.body;
    const result = await projectService.saveProject(state);
    res.json(result);
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '保存项目失败'
    });
  }
});

router.post('/publish', async (req, res) => {
  try {
    const state = req.body;
    const result = await projectService.publishProject(state);
    res.json(result);
  } catch (error) {
    console.error('Publish project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发布项目失败'
    });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const state = await projectService.getProject(projectId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }
    res.json(state);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取项目失败'
    });
  }
});

module.exports = router;
