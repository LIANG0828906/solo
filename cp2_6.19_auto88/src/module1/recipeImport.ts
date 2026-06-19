import { v4 as uuidv4 } from 'uuid';
import type { Recipe, RecipeCreateData, Ingredient, Step } from '../types';
import { recipeManager } from './recipeManager';

function generateId(): string {
  return uuidv4();
}

function parseJSON(text: string): Recipe | null {
  try {
    const parsed = JSON.parse(text);
    
    if (!parsed.title || !parsed.description) {
      console.error('JSON parse error: Missing required fields (title or description)');
      return null;
    }
    
    const ingredients: Ingredient[] = (parsed.ingredients || []).map((ing: Record<string, unknown>) => ({
      id: generateId(),
      name: String(ing.name || ''),
      quantity: String(ing.quantity || ing.amount || ''),
    }));
    
    const steps: Step[] = (parsed.steps || []).map((step: string | Record<string, unknown>, index: number) => ({
      id: generateId(),
      order: index,
      description: typeof step === 'string' ? step : String((step as Record<string, unknown>).description || ''),
    }));
    
    const recipe: Recipe = {
      id: parsed.id || generateId(),
      title: parsed.title,
      description: parsed.description,
      coverImage: parsed.coverImage || parsed.imageUrl || '',
      ingredients,
      steps,
      tags: parsed.tags || [],
      cookingTime: parsed.cookingTime || 0,
      servings: parsed.servings || 1,
      difficulty: parsed.difficulty || 'medium',
      rating: parsed.rating || 0,
      ratingCount: parsed.ratingCount || 0,
      authorId: parsed.authorId || '',
      authorName: parsed.authorName || '',
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    
    return recipe;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

function parseMarkdown(text: string): Recipe | null {
  try {
    const lines = text.split('\n').map(line => line.trim());
    let currentSection: string | null = null;
    
    const title = lines.find(line => line.startsWith('# '))?.replace('# ', '').trim();
    if (!title) {
      console.error('Markdown parse error: Missing title (h1 heading)');
      return null;
    }
    
    let description = '';
    const ingredients: { name: string; quantity: string }[] = [];
    const steps: string[] = [];
    let cookingTime = 0;
    let servings = 1;
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    let coverImage = '';
    const tags: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').toLowerCase();
        continue;
      }
      
      if (line.startsWith('![')) {
        const imageMatch = line.match(/!\[.*\]\((.*)\)/);
        if (imageMatch) {
          coverImage = imageMatch[1];
        }
        continue;
      }
      
      if (line.startsWith('- **') && line.includes(':')) {
        const metaMatch = line.match(/- \*\*(.+?)\*\*:\s*(.+)/);
        if (metaMatch) {
          const [, key, value] = metaMatch;
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('time') || lowerKey.includes('烹饪时间') || lowerKey.includes('时间')) {
            const num = parseInt(value);
            if (!isNaN(num)) cookingTime = num;
          } else if (lowerKey.includes('serving') || lowerKey.includes('份量') || lowerKey.includes('人份')) {
            const num = parseInt(value);
            if (!isNaN(num)) servings = num;
          } else if (lowerKey.includes('difficulty') || lowerKey.includes('难度')) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('easy') || lowerValue.includes('简单')) difficulty = 'easy';
            else if (lowerValue.includes('hard') || lowerValue.includes('困难')) difficulty = 'hard';
            else difficulty = 'medium';
          } else if (lowerKey.includes('tag') || lowerKey.includes('标签')) {
            const tagList = value.split(/[,，、]/).map(t => t.trim()).filter(t => t);
            tags.push(...tagList);
          }
        }
        continue;
      }
      
      switch (currentSection) {
        case 'description':
        case '简介':
        case '介绍':
          if (line) description += (description ? ' ' : '') + line;
          break;
        case 'ingredients':
        case '食材':
        case '材料':
          if (line.startsWith('- ')) {
            const ingText = line.replace('- ', '').trim();
            const parts = ingText.split(/[:：\s]+(.+)/);
            if (parts.length >= 2) {
              ingredients.push({ name: parts[1].trim(), quantity: parts[0].trim() });
            } else {
              ingredients.push({ name: ingText, quantity: '' });
            }
          }
          break;
        case 'steps':
        case '步骤':
        case '做法':
          if (line.match(/^\d+\./)) {
            const stepText = line.replace(/^\d+\.\s*/, '').trim();
            if (stepText) steps.push(stepText);
          } else if (line.startsWith('- ') && steps.length > 0) {
            const stepText = line.replace('- ', '').trim();
            if (stepText) steps.push(stepText);
          }
          break;
      }
    }
    
    if (!description && lines.length > 0) {
      const firstContentLine = lines.find(line => 
        !line.startsWith('#') && 
        !line.startsWith('##') && 
        !line.startsWith('![') &&
        line.trim()
      );
      if (firstContentLine) {
        description = firstContentLine;
      }
    }
    
    const recipe: Recipe = {
      id: generateId(),
      title,
      description,
      coverImage,
      ingredients: ingredients.map(ing => ({
        id: generateId(),
        name: ing.name,
        quantity: ing.quantity,
      })),
      steps: steps.map((step, index) => ({
        id: generateId(),
        order: index,
        description: step,
      })),
      tags,
      cookingTime,
      servings,
      difficulty,
      rating: 0,
      ratingCount: 0,
      authorId: '',
      authorName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return recipe;
  } catch (error) {
    console.error('Failed to parse Markdown:', error);
    return null;
  }
}

async function importRecipe(text: string, userId: string, userName: string): Promise<Recipe | null> {
  try {
    if (!text.trim()) {
      throw new Error('Import text is empty');
    }
    
    let recipe: Recipe | null = null;
    
    const trimmedText = text.trim();
    if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      recipe = parseJSON(trimmedText);
    }
    
    if (!recipe) {
      recipe = parseMarkdown(trimmedText);
    }
    
    if (!recipe) {
      console.error('Failed to detect and parse recipe format');
      return null;
    }
    
    const recipeData: RecipeCreateData = {
      title: recipe.title,
      description: recipe.description,
      coverImage: recipe.coverImage,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
      })),
      steps: recipe.steps.map(step => ({
        order: step.order,
        description: step.description,
      })),
      tags: recipe.tags,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      authorId: userId,
      authorName: userName,
    };
    
    const createdRecipe = await recipeManager.createRecipe(recipeData);
    return createdRecipe;
  } catch (error) {
    console.error('Failed to import recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to import recipe');
  }
}

export const recipeImport = {
  parseJSON,
  parseMarkdown,
  importRecipe,
};
