#!/usr/bin/env node

import { RDSClient, DescribeDBClustersCommand } from "@aws-sdk/client-rds";
import dotenv from "dotenv";

dotenv.config();

const client = new RDSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkClusters() {
  try {
    console.log("🔍 Buscando clusters Aurora...\n");
    
    const command = new DescribeDBClustersCommand({});
    const response = await client.send(command);

    if (!response.DBClusters || response.DBClusters.length === 0) {
      console.log("❌ No se encontraron clusters Aurora Serverless.");
      console.log("\n📝 Necesitas crear uno en AWS Console:");
      console.log("   https://console.aws.amazon.com/rds/");
      console.log("\n   1. Ve a RDS → Databases → Create database");
      console.log("   2. Selecciona Aurora (PostgreSQL/MySQL)");
      console.log("   3. Elige 'Serverless v2' o 'Serverless v1'");
      console.log("   4. Habilita 'Data API' en configuración adicional");
      console.log("   5. Crea un secret en Secrets Manager para las credenciales");
      return;
    }

    console.log(`✅ Encontrados ${response.DBClusters.length} cluster(s):\n`);

    response.DBClusters.forEach((cluster, i) => {
      console.log(`Cluster ${i + 1}:`);
      console.log(`  Identifier: ${cluster.DBClusterIdentifier}`);
      console.log(`  ARN: ${cluster.DBClusterArn}`);
      console.log(`  Engine: ${cluster.Engine} ${cluster.EngineVersion}`);
      console.log(`  Status: ${cluster.Status}`);
      console.log(`  Endpoint: ${cluster.Endpoint}`);
      console.log(`  Database: ${cluster.DatabaseName || "default"}`);
      console.log("");
    });

    console.log("\n📋 Copia estos valores a tu .env:");
    const firstCluster = response.DBClusters[0];
    console.log(`DB_CLUSTER_ARN=${firstCluster.DBClusterArn}`);
    console.log(`DB_NAME=${firstCluster.DatabaseName || "postgres"}`);
    console.log("\n⚠️  También necesitas crear un Secret en AWS Secrets Manager con:");
    console.log('   {"username":"tu_usuario","password":"tu_password"}');
    console.log("   y copiar su ARN como DB_SECRET_ARN");

  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.name === "AccessDeniedException") {
      console.log("\n⚠️  Las credenciales no tienen permisos para RDS.");
      console.log("   Necesitas agregar la política 'AmazonRDSReadOnlyAccess' al usuario IAM.");
    }
  }
}

checkClusters();

