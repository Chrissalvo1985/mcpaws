# AWS Database - MCP + HTTP API

Servidor híbrido para conectar bases de datos AWS:
- **Modo MCP**: Para Cursor/Claude Desktop (stdio)
- **Modo HTTP**: Para n8n, ChatGPT, webhooks, flujos (REST API)

## 🚀 Setup Rápido

### 1. Instalar

```bash
npm install
npm run build
```

### 2. Configurar credenciales

Crea `.env`:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Database (Aurora Serverless)
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:mi-cluster
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:mi-secret
DB_NAME=postgres

# API Security (genera un token aleatorio)
API_SECRET_KEY=mi_token_super_secreto_12345
```

## 📡 Modo 1: MCP Server (Cursor/Claude Desktop)

### Configurar en Cursor

Edita `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aws-database": {
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

Reinicia Cursor y prueba:
```
"Lista mis clusters Aurora"
"Ejecuta SELECT * FROM usuarios LIMIT 10"
```

## 🌐 Modo 2: HTTP API (n8n, ChatGPT, Vercel)

### Ejecutar localmente

```bash
npm run start:api
# Corre en http://localhost:3000
```

### Deploy en Vercel

```bash
# Configura las variables de entorno en Vercel Dashboard:
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

### Endpoints HTTP

#### `GET /health`
Health check

```bash
curl https://tu-dominio.vercel.app/health
```

#### `GET /api/tools`
Lista todas las herramientas disponibles

```bash
curl https://tu-dominio.vercel.app/api/tools
```

#### `POST /api/sql`
Ejecuta query SQL

```bash
curl -X POST https://tu-dominio.vercel.app/api/sql \
  -H "Authorization: Bearer tu_api_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM usuarios WHERE id = :id",
    "parameters": [
      {
        "name": "id",
        "value": { "longValue": 1 }
      }
    ]
  }'
```

#### `POST /api/sql/batch`
Ejecuta múltiples statements

```bash
curl -X POST https://tu-dominio.vercel.app/api/sql/batch \
  -H "Authorization: Bearer tu_api_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "INSERT INTO logs (message) VALUES (:msg)",
    "parameterSets": [
      [{ "name": "msg", "value": { "stringValue": "test1" }}],
      [{ "name": "msg", "value": { "stringValue": "test2" }}]
    ]
  }'
```

#### `GET /api/instances`
Lista instancias RDS

```bash
curl https://tu-dominio.vercel.app/api/instances \
  -H "Authorization: Bearer tu_api_secret_key"
```

#### `GET /api/clusters`
Lista clusters Aurora

```bash
curl https://tu-dominio.vercel.app/api/clusters \
  -H "Authorization: Bearer tu_api_secret_key"
```

#### `GET /api/instances/:id`
Info detallada de una instancia

```bash
curl https://tu-dominio.vercel.app/api/instances/mi-instancia \
  -H "Authorization: Bearer tu_api_secret_key"
```

## 🔗 Integración con n8n

### Opción 1: HTTP Request Node

1. Añade un nodo **HTTP Request**
2. Configura:
   - **Method**: POST
   - **URL**: `https://tu-dominio.vercel.app/api/sql`
   - **Authentication**: Header Auth
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer tu_api_secret_key`
3. En Body:
```json
{
  "sql": "SELECT * FROM usuarios WHERE email = :email",
  "parameters": [
    {
      "name": "email",
      "value": { "stringValue": "{{$json.email}}" }
    }
  ]
}
```

### Opción 2: Webhook

Configura un webhook en n8n que llame a tu API:

```javascript
// En Function node de n8n
const response = await $http.request({
  method: 'POST',
  url: 'https://tu-dominio.vercel.app/api/sql',
  headers: {
    'Authorization': 'Bearer tu_api_secret_key',
    'Content-Type': 'application/json'
  },
  body: {
    sql: 'SELECT * FROM productos WHERE precio > :precio',
    parameters: [
      { name: 'precio', value: { doubleValue: 100 }}
    ]
  }
});

return response.data;
```

## 🤖 Integración con ChatGPT (Custom GPT Actions)

1. Crea un Custom GPT
2. En Actions, configura:

```yaml
openapi: 3.0.0
info:
  title: AWS Database API
  version: 1.0.0
servers:
  - url: https://tu-dominio.vercel.app
paths:
  /api/sql:
    post:
      operationId: executeSql
      summary: Execute SQL query
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sql:
                  type: string
                parameters:
                  type: array
      responses:
        '200':
          description: Success
      security:
        - BearerAuth: []
  /api/clusters:
    get:
      operationId: listClusters
      summary: List Aurora clusters
      security:
        - BearerAuth: []
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
```

3. En Authentication, pon tu `API_SECRET_KEY`

## 🔐 Seguridad

- **API_SECRET_KEY**: Token para autenticación HTTP
- Siempre usa HTTPS en producción
- No expongas credenciales AWS en el cliente
- En Vercel, usa Environment Variables (nunca comittear `.env`)

## 🧪 Testing

```bash
# Test MCP
npm run start:mcp

# Test HTTP API
npm run start:api

# En otra terminal
curl http://localhost:3000/health
curl http://localhost:3000/api/tools
```

## 📋 Requisitos AWS

- Aurora Serverless v1/v2
- Data API habilitado
- Credenciales en AWS Secrets Manager
- Permisos IAM:
  - `rds-data:ExecuteStatement`
  - `rds-data:BatchExecuteStatement`
  - `rds:DescribeDBInstances`
  - `rds:DescribeDBClusters`
  - `secretsmanager:GetSecretValue`

## 🛠️ Comandos

```bash
# Build
npm run build

# MCP Server (stdio)
npm run start:mcp

# HTTP API Server
npm run start:api

# Watch mode (desarrollo)
npm run dev
```

## 📚 Arquitectura

```
src/
├── core/
│   └── aws-database.ts    # Lógica compartida AWS
├── mcp-server.ts          # Servidor MCP (stdio)
└── http-server.ts         # Servidor HTTP (Express)
```

Ambos servidores usan la misma lógica core, solo cambia el protocolo de comunicación.
