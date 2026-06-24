import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "4000", 10);
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

app.use(cors());

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const pythonHealth = await fetch(`${PYTHON_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await pythonHealth.json();
    res.json({
      gateway: "ok",
      python_service: data,
    });
  } catch {
    res.json({
      gateway: "ok",
      python_service: "unreachable",
    });
  }
});

app.use(
  "/api",
  createProxyMiddleware({
    target: PYTHON_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/api": "",
    },
    on: {
      error: (err, _req, res) => {
        console.error("Proxy error:", err.message);
        const response = res as Response;
        if (!response.headersSent) {
          response.status(502).json({ detail: `Python service error: ${err.message}` });
        }
      }
    }
  })
);

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📡 Streaming Proxy to Python service at ${PYTHON_SERVICE_URL}`);
});

export default app;
