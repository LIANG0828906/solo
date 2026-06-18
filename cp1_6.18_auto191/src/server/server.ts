import express from "express";
import cors from "cors";
import { INGREDIENTS, RECIPES, searchRecipes } from "../engine/recipeEngine";

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get("/api/ingredients", (_req, res) => {
  res.json(INGREDIENTS);
});

app.get("/api/recipes", (_req, res) => {
  res.json(RECIPES);
});

app.post("/api/recipes/search", (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    res.json({ recipes: [], matchedField: "name" });
    return;
  }
  const results = searchRecipes(query);
  res.json({ recipes: results, matchedField: "name" });
});

app.listen(PORT, () => {
  console.log(`🧪 配方炼金术服务器运行在 http://localhost:${PORT}`);
});
