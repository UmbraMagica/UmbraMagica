import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import supabaseRoutes from "./routes/supabase.js";
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());

// CORS configuration for frontend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://umbramagica-1.onrender.com', // frontend
    'https://umbramagica.onrender.com', // backend
  ];
  const nodeEnv = process.env.NODE_ENV || 'production';
  console.log('CORS check:', { origin, nodeEnv });
  if (nodeEnv === 'production' || !process.env.NODE_ENV) {
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    // Vývoj: povol vše
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Session configuration (musí být před body parserem!)
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
const pgSession = connectPgSimple(session);
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const sessionSecret = process.env.SESSION_SECRET || 'umbra-magica-session-secret-key-fixed-2024';
app.use(session({
  store: new pgSession({ conString: process.env.DATABASE_URL }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: '.onrender.com',
    maxAge: sessionTtl,
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug logování cookies a session pro každý API request
app.use('/api/*', (req, res, next) => {
  console.log('API DEBUG - cookies:', req.cookies, 'session:', req.session, 'url:', req.url);
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

// Testovací endpoint pro ověření funkčnosti backendu
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Backend funguje!' });
});

app.use('/api', supabaseRoutes);

// Debug endpoint pro ověření rout
app.get('/api/debug/routes', (req, res) => {
  res.json({
    routes: app._router.stack
      .filter(r => r.route)
      .map(r => r.route.path)
  });
});

(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, undefined);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT or fallback to 5000 for development
  const port = Number(process.env.PORT) || 5000;
  
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

// 404 handler pro API
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Not Found', url: req.originalUrl });
});