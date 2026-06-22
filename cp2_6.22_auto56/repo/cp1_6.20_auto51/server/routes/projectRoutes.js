import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  inviteMember,
  addPaletteToProject,
  addComment
} from '../data/projectData.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description, ownerEmail } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    if (!ownerEmail) {
      return res.status(400).json({ error: 'Owner email is required' });
    }

    const newProject = createProject({ name, description }, ownerEmail);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.post('/:id/invite', (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = inviteMember(req.params.id, email, role);
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

router.post('/:id/palettes', (req, res) => {
  try {
    const { paletteId } = req.body;
    
    if (!paletteId) {
      return res.status(400).json({ error: 'Palette ID is required' });
    }

    const project = addPaletteToProject(req.params.id, paletteId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add palette to project' });
  }
});

router.post('/:id/comments', (req, res) => {
  try {
    const { userEmail, paletteId, colorIndex, content } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = addComment(req.params.id, {
      userEmail,
      paletteId,
      colorIndex,
      content
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
