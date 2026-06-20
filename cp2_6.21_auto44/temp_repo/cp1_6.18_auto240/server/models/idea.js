const { v4: uuidv4 } = require('uuid');

let ideas = [];

const IdeaModel = {
  getAll: () => {
    return ideas;
  },

  getById: (id) => {
    return ideas.find((idea) => idea.id === id);
  },

  create: (data) => {
    const idea = {
      id: data.id || uuidv4(),
      title: data.title || '新灵感',
      description: data.description || '',
      color: data.color || '#7B2D8E',
      tags: data.tags || [],
      x: data.x || 0,
      y: data.y || 0,
      connectedIds: data.connectedIds || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGroup: data.isGroup || false,
      groupNodeIds: data.groupNodeIds || [],
      isCollapsed: data.isCollapsed || false,
      parentGroupId: data.parentGroupId || undefined
    };
    ideas.push(idea);
    return idea;
  },

  update: (id, updates) => {
    const index = ideas.findIndex((idea) => idea.id === id);
    if (index === -1) return null;
    ideas[index] = {
      ...ideas[index],
      ...updates,
      id: ideas[index].id,
      createdAt: ideas[index].createdAt,
      updatedAt: new Date().toISOString()
    };
    return ideas[index];
  },

  delete: (id) => {
    const index = ideas.findIndex((idea) => idea.id === id);
    if (index === -1) return false;
    ideas.splice(index, 1);
    ideas = ideas.map((idea) => ({
      ...idea,
      connectedIds: idea.connectedIds.filter((cid) => cid !== id)
    }));
    return true;
  },

  replaceAll: (newIdeas) => {
    ideas = newIdeas.map((idea) => ({
      id: idea.id || uuidv4(),
      title: idea.title || '新灵感',
      description: idea.description || '',
      color: idea.color || '#7B2D8E',
      tags: idea.tags || [],
      x: idea.x || 0,
      y: idea.y || 0,
      connectedIds: idea.connectedIds || [],
      createdAt: idea.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGroup: idea.isGroup || false,
      groupNodeIds: idea.groupNodeIds || [],
      isCollapsed: idea.isCollapsed || false,
      parentGroupId: idea.parentGroupId || undefined
    }));
    return ideas;
  }
};

module.exports = IdeaModel;
