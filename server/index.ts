import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import supabaseRoutes from "./routes/supabase.js";
import { Pool } from 'pg';
import cors from 'cors';
import characterInventoryRoutes from "./routes/characterInventory";

const app = express();
console.log("NODE_ENV:", process.env.NODE_ENV); // 🪵 pro debug
app.set('trust proxy', 1);
app.enable('strict routing', false);

// ✅ CORS pro vývoj i produkci
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://umbra-dev.onrender.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔍 Logování requestů
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// ✅ Test
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Backend funguje!' });
});

// 🧪 Debug – seznam rout
app.get('/api/debug/routes', (req, res) => {
  res.json({
    routes: app._router.stack
      .filter(r => r.route)
      .map(r => r.route.path)
  });
});

// 📦 Inventář
app.use("/api/characters", characterInventoryRoutes);

// 🔥 Chyby
app.use((err, req, res, next) => {
  console.error('[DEBUG][ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    body: req.body,
    cookies: req.cookies,
  });
  if (!res.headersSent) {
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  }
});

(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, undefined);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // 🧱 404 fallback
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Not Found', url: req.originalUrl });
  });

  console.log("registerRoutes: konec");
})();
