import { Router, type Request, type Response } from "express";
import { recipes, commentsData } from "../data/recipes.js";
import { calculateIngredients } from "../calculator.js";
import type { CalculateRequest, Comment } from "../../shared/types.js";

const router = Router();

router.get("/recipes", (_req: Request, res: Response) => {
  const list = recipes.map(({ ingredients, steps, moldSize, ...rest }) => rest);
  res.json(list);
});

router.get("/recipes/:id", (req: Request, res: Response) => {
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(recipe);
});

router.post("/calculate", (req: Request, res: Response) => {
  const body = req.body as CalculateRequest;
  if (
    !body.ingredients ||
    !body.originalServings ||
    !body.targetServings
  ) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const result = calculateIngredients(body);
  res.json({ ingredients: result });
});

router.get("/recipes/:id/comments", (req: Request, res: Response) => {
  const comments = commentsData[req.params.id] || [];
  res.json(comments);
});

router.post("/recipes/:id/comments", (req: Request, res: Response) => {
  const { content } = req.body as { content: string };
  if (!content || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  const recipeComments = commentsData[req.params.id] || [];
  const newComment: Comment = {
    id: `c${Date.now()}`,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
  };
  recipeComments.unshift(newComment);
  commentsData[req.params.id] = recipeComments;
  res.json(newComment);
});

export default router;
