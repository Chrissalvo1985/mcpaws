# 🚀 Quickstart - 5 minutos

## Setup inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar credenciales
cp .env.example .env
# Edita .env con tus credenciales AWS

# 3. Compilar
npm run build
```

## Uso 1: MCP para Cursor/Claude Desktop

**Configuración** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aws-db": {
      "command": "node",
      "args": ["/Users/chris/Desktop/Entorno/mcpaws/dist/mcp-server.js"],
      "env": {
        "AWS_ACCESS_KEY_ID": "tu_key",
        "AWS_SECRET_ACCESS_KEY": "tu_secret",
        "AWS_REGION": "us-east-1",
        "DB_CLUSTER_ARN": "arn:aws:rds:...",
        "DB_SECRET_ARN": "arn:aws:secretsmanager:...",
        "DB_NAME": "postgres"
      }
    }
  }
}
```

Reinicia Cursor → Listo.

## Uso 2: API HTTP para n8n/ChatGPT/Flujos

### Opción A: Local

```bash
npm run start:api
# API en http://localhost:3000
```

Prueba:
```bash
curl http://localhost:3000/api/tools
```

### Opción B: Deploy en Vercel

```bash
# Sube variables de entorno
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add DB_CLUSTER_ARN
vercel env add DB_SECRET_ARN
vercel env add DB_NAME
vercel env add API_SECRET_KEY

# Deploy
vercel --prod
```

## Integración con n8n

**HTTP Request Node:**

- **URL**: `https://tu-api.vercel.app/api/sql`
- **Method**: POST
- **Auth**: Header → `Authorization: Bearer tu_api_secret_key`
- **Body**:
```json
{
  "sql": "SELECT * FROM usuarios LIMIT 10"
}
```

## Integración con ChatGPT

1. Crea Custom GPT
2. Actions → Import from URL → Pega tu API + `/api/tools`
3. Authentication → API Key → Pega `API_SECRET_KEY`

Listo. ChatGPT podrá consultar tu base de datos.

## Ejemplos de queries

```bash
# Listar clusters
curl -X GET https://tu-api.vercel.app/api/clusters \
  -H "Authorization: Bearer tu_token"

# Ejecutar SQL
curl -X POST https://tu-api.vercel.app/api/sql \
  -H "Authorization: Bearer tu_token" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT NOW()"}'

# Con parámetros
curl -X POST https://tu-api.vercel.app/api/sql \
  -H "Authorization: Bearer tu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users WHERE id = :id",
    "parameters": [
      {"name": "id", "value": {"longValue": 1}}
    ]
  }'
```

## Permisos IAM mínimos

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "rds-data:ExecuteStatement",
      "rds-data:BatchExecuteStatement",
      "rds:DescribeDBInstances",
      "rds:DescribeDBClusters",
      "secretsmanager:GetSecretValue"
    ],
    "Resource": "*"
  }]
}
```

¡Ya está todo listo! 🎉

