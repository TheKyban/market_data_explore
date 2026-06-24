/**
 * Market Data Explorer — Bun API Gateway
 *
 * Express server running on Bun that proxies requests between
 * the Next.js frontend and the Python FastAPI service.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { Readable } from "stream";

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "4000", 10);
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// Middleware
app.use(cors());
app.use(express.json());

// Handle Chrome Private Network Access preflight
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

// Multer config for file uploads (store in memory for proxying)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith(".feather")) {
      cb(null, true);
    } else {
      cb(new Error("Only .feather files are accepted"));
    }
  },
});

// ── Helper: proxy errors ────────────────────────────────────────────────────

function handleProxyError(error: unknown, res: Response): void {
  if (error instanceof AxiosError && error.response) {
    res.status(error.response.status).json(error.response.data);
  } else if (error instanceof Error) {
    res.status(502).json({ detail: `Python service error: ${error.message}` });
  } else {
    res.status(500).json({ detail: "Unknown gateway error" });
  }
}

// ── Upload File ─────────────────────────────────────────────────────────────

app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ detail: "No file provided" });
      return;
    }

    const formData = new FormData();
    const stream = Readable.from(req.file.buffer);
    formData.append("file", stream, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${PYTHON_SERVICE_URL}/upload`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
    });

    res.json(response.data);
  } catch (error) {
    handleProxyError(error, res);
  }
});

// ── Get Metadata ────────────────────────────────────────────────────────────

app.get("/api/metadata", async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/metadata`);
    res.json(response.data);
  } catch (error) {
    handleProxyError(error, res);
  }
});

// ── Filter Data ─────────────────────────────────────────────────────────────

app.post("/api/filter", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/filter`, req.body);
    res.json(response.data);
  } catch (error) {
    handleProxyError(error, res);
  }
});

// ── Preview Data ────────────────────────────────────────────────────────────

app.get("/api/preview", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/preview`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    handleProxyError(error, res);
  }
});

// ── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const pythonHealth = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 3000 });
    res.json({
      gateway: "ok",
      python_service: pythonHealth.data,
    });
  } catch {
    res.json({
      gateway: "ok",
      python_service: "unreachable",
    });
  }
});

// ── Error handling middleware ────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Gateway error:", err.message);
  if (err.message.includes(".feather")) {
    res.status(400).json({ detail: err.message });
  } else {
    res.status(500).json({ detail: `Internal gateway error: ${err.message}` });
  }
});

// ── Start server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📡 Proxying to Python service at ${PYTHON_SERVICE_URL}`);
});

export default app;
