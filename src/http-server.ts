#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { AWSDatabaseCore } from "./core/aws-database.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_SECRET_KEY;

app.use(cors());
app.use(express.json());

// Middleware de autenticación
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!API_KEY) {
    console.warn("⚠️  API_SECRET_KEY not set - API is unprotected!");
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};

const dbCore = new AWSDatabaseCore({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || "us-east-1",
  clusterArn: process.env.DB_CLUSTER_ARN,
  secretArn: process.env.DB_SECRET_ARN,
  database: process.env.DB_NAME,
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "aws-database-api" });
});

// POST /api/sql - Execute SQL
app.post("/api/sql", authMiddleware, async (req, res) => {
  try {
    const { sql, parameters = [] } = req.body;

    if (!sql) {
      return res.status(400).json({ error: "SQL query required" });
    }

    const result = await dbCore.executeSql(sql, parameters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// POST /api/sql/batch - Batch execute
app.post("/api/sql/batch", authMiddleware, async (req, res) => {
  try {
    const { sql, parameterSets } = req.body;

    if (!sql || !parameterSets) {
      return res.status(400).json({ error: "SQL and parameterSets required" });
    }

    const result = await dbCore.batchExecuteSql(sql, parameterSets);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/instances - List instances
app.get("/api/instances", authMiddleware, async (req, res) => {
  try {
    const result = await dbCore.listDbInstances();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clusters - List clusters
app.get("/api/clusters", authMiddleware, async (req, res) => {
  try {
    const result = await dbCore.listDbClusters();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/instances/:id - Describe instance
app.get("/api/instances/:id", authMiddleware, async (req, res) => {
  try {
    const result = await dbCore.describeDbInstance(req.params.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Tools schema (para descubrimiento)
app.get("/api/tools", (req, res) => {
  res.json({
    tools: [
      {
        name: "execute_sql",
        description: "Execute SQL query",
        method: "POST",
        endpoint: "/api/sql",
        schema: {
          sql: "string (required)",
          parameters: "array (optional)",
        },
      },
      {
        name: "batch_execute_sql",
        description: "Batch execute SQL",
        method: "POST",
        endpoint: "/api/sql/batch",
        schema: {
          sql: "string (required)",
          parameterSets: "array (required)",
        },
      },
      {
        name: "list_db_instances",
        description: "List RDS instances",
        method: "GET",
        endpoint: "/api/instances",
      },
      {
        name: "list_db_clusters",
        description: "List Aurora clusters",
        method: "GET",
        endpoint: "/api/clusters",
      },
      {
        name: "describe_db_instance",
        description: "Describe RDS instance",
        method: "GET",
        endpoint: "/api/instances/:id",
      },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AWS Database HTTP API running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/tools`);
});

