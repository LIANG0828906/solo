import express from "express";
import cors from "cors";
import { calculateRoutes } from "./routeProcessor.js";
import { fetchWeatherAlerts } from "./weatherFetcher.js";

const app = express();
app.use(cors());
app.use(express.json());

let lastRoutes: any[] = [];

app.post("/api/routes", (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.body;
  if (
    typeof startLat !== "number" ||
    typeof startLng !== "number" ||
    typeof endLat !== "number" ||
    typeof endLng !== "number"
  ) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }
  const routes = calculateRoutes(startLat, startLng, endLat, endLng);
  lastRoutes = routes;
  res.json({ routes });
});

app.get("/api/weather-alerts", (req, res) => {
  const routeIds = (req.query.routeIds as string)?.split(",").filter(Boolean);
  const routesToUse = routeIds
    ? lastRoutes.filter((r) => routeIds.includes(r.id))
    : lastRoutes;
  const alerts = fetchWeatherAlerts(routesToUse);
  res.json({ alerts });
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
