#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AWSDatabaseCore } from "./core/aws-database.js";
import dotenv from "dotenv";

dotenv.config();

const dbCore = new AWSDatabaseCore({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION || "us-east-1",
  clusterArn: process.env.DB_CLUSTER_ARN,
  secretArn: process.env.DB_SECRET_ARN,
  database: process.env.DB_NAME,
});

class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "aws-database-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "execute_sql",
          description: "Execute SQL query on AWS Aurora Serverless via Data API",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string", description: "SQL query to execute" },
              parameters: {
                type: "array",
                description: "Parameters for prepared statements",
                items: { type: "object" },
              },
            },
            required: ["sql"],
          },
        },
        {
          name: "batch_execute_sql",
          description: "Execute multiple SQL statements in a transaction",
          inputSchema: {
            type: "object",
            properties: {
              sql: { type: "string", description: "SQL template" },
              parameterSets: {
                type: "array",
                description: "Array of parameter sets",
                items: { type: "array" },
              },
            },
            required: ["sql", "parameterSets"],
          },
        },
        {
          name: "list_db_instances",
          description: "List all RDS instances",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "list_db_clusters",
          description: "List all Aurora clusters",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "describe_db_instance",
          description: "Get detailed info about an RDS instance",
          inputSchema: {
            type: "object",
            properties: {
              instanceIdentifier: { type: "string" },
            },
            required: ["instanceIdentifier"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case "execute_sql":
            result = await dbCore.executeSql((args as any)?.sql, (args as any)?.parameters);
            break;
          case "batch_execute_sql":
            result = await dbCore.batchExecuteSql((args as any)?.sql, (args as any)?.parameterSets);
            break;
          case "list_db_instances":
            result = await dbCore.listDbInstances();
            break;
          case "list_db_clusters":
            result = await dbCore.listDbClusters();
            break;
          case "describe_db_instance":
            result = await dbCore.describeDbInstance((args as any)?.instanceIdentifier);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${error.message}\n\n${error.stack}`,
            },
          ],
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🚀 AWS Database MCP Server running");
  }
}

const server = new MCPServer();
server.run().catch(console.error);

