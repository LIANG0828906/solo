import { createServer } from "http";
import { readFileSync, writeFile } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Server as SocketIOServer } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "data");
const RECIPES_PATH = join(DATA_DIR, "recipes.json");
const SHOPPING_PATH = join(DATA_DIR, "shopping-list.json");

function readJSON<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function writeJSON<T>(filePath: string, data: T): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(filePath, JSON.stringify(data, null, 2), "utf-8", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

interface Step {
  description: string;
  image?: string;
}

interface Recipe {
  id: string;
  name: string;
  coverImage?: string;
  gradientColors?: [string, string];
  prepTime: number;
  cookTime: number;
  difficulty: number;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  checked: boolean;
  category: string;
}

interface ShoppingCategory {
  id: string;
  name: string;
  items: ShoppingItem[];
  expanded: boolean;
}

interface ShoppingList {
  categories: ShoppingCategory[];
}

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(bodyParser.json());

let idCounter = 1000;
function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}${idCounter}`;
}

// ─── REST: Recipes ────────────────────────────────────────────────

app.get("/api/recipes", (_req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    res.json(recipes);
  } catch {
    res.status(500).json({ error: "Failed to read recipes" });
  }
});

app.get("/api/recipes/:id", (req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    const recipe = recipes.find((r) => r.id === req.params.id);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    res.json(recipe);
  } catch {
    res.status(500).json({ error: "Failed to read recipes" });
  }
});

app.post("/api/recipes", async (req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    const newRecipe: Recipe = {
      id: generateId("r"),
      name: req.body.name,
      coverImage: req.body.coverImage,
      gradientColors: req.body.gradientColors,
      prepTime: req.body.prepTime,
      cookTime: req.body.cookTime,
      difficulty: req.body.difficulty,
      ingredients: req.body.ingredients || [],
      steps: req.body.steps || [],
      createdAt: new Date().toISOString(),
    };
    recipes.push(newRecipe);
    await writeJSON(RECIPES_PATH, recipes);
    res.status(201).json(newRecipe);
  } catch {
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

app.put("/api/recipes/:id", async (req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    const idx = recipes.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    recipes[idx] = { ...recipes[idx], ...req.body, id: recipes[idx].id };
    await writeJSON(RECIPES_PATH, recipes);
    res.json(recipes[idx]);
  } catch {
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    const idx = recipes.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }
    const deleted = recipes.splice(idx, 1)[0];
    await writeJSON(RECIPES_PATH, recipes);
    res.json(deleted);
  } catch {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// ─── REST: Shopping List ──────────────────────────────────────────

app.get("/api/shopping-list", (_req, res) => {
  try {
    const list = readJSON<ShoppingList>(SHOPPING_PATH);
    res.json(list);
  } catch {
    res.status(500).json({ error: "Failed to read shopping list" });
  }
});

app.post("/api/shopping-list/item", async (req, res) => {
  try {
    const list = readJSON<ShoppingList>(SHOPPING_PATH);
    const { category: categoryId, item } = req.body;
    const cat = list.categories.find((c) => c.id === categoryId);
    if (!cat) {
      res.status(400).json({ error: "Category not found" });
      return;
    }
    const newItem: ShoppingItem = {
      id: generateId("s"),
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      checked: false,
      category: categoryId,
    };
    cat.items.push(newItem);
    await writeJSON(SHOPPING_PATH, list);
    io.emit("item-added", newItem);
    res.status(201).json(newItem);
  } catch {
    res.status(500).json({ error: "Failed to add item" });
  }
});

app.put("/api/shopping-list/item/:id", async (req, res) => {
  try {
    const list = readJSON<ShoppingList>(SHOPPING_PATH);
    let found = false;
    let updatedItem: ShoppingItem | null = null;
    for (const cat of list.categories) {
      const idx = cat.items.findIndex((i) => i.id === req.params.id);
      if (idx !== -1) {
        cat.items[idx] = { ...cat.items[idx], ...req.body, id: cat.items[idx].id };
        updatedItem = cat.items[idx];
        found = true;
        break;
      }
    }
    if (!found) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    await writeJSON(SHOPPING_PATH, list);
    io.emit("item-updated", updatedItem);
    res.json(updatedItem);
  } catch {
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/api/shopping-list/item/:id", async (req, res) => {
  try {
    const list = readJSON<ShoppingList>(SHOPPING_PATH);
    let found = false;
    let deletedItem: ShoppingItem | null = null;
    for (const cat of list.categories) {
      const idx = cat.items.findIndex((i) => i.id === req.params.id);
      if (idx !== -1) {
        deletedItem = cat.items.splice(idx, 1)[0];
        found = true;
        break;
      }
    }
    if (!found) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    await writeJSON(SHOPPING_PATH, list);
    io.emit("item-deleted", { id: req.params.id });
    res.json(deletedItem);
  } catch {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// ─── REST: Ingredients (autocomplete) ─────────────────────────────

app.get("/api/ingredients", (_req, res) => {
  try {
    const recipes = readJSON<Recipe[]>(RECIPES_PATH);
    const names = [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.name)))];
    res.json(names);
  } catch {
    res.status(500).json({ error: "Failed to read ingredients" });
  }
});

// ─── Socket.IO: Real-time Shopping List Collaboration ─────────────

io.on("connection", (socket) => {
  socket.on("join-list", (listId: string) => {
    socket.join(`list-${listId}`);
    socket.to(`list-${listId}`).emit("user-joined", { socketId: socket.id });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms].filter((r) => r.startsWith("list-"));
    for (const room of rooms) {
      socket.to(room).emit("user-left", { socketId: socket.id });
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
