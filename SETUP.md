# ⚠️ CONFIGURACIÓN PENDIENTE

## 1. Permisos IAM necesarios

Tu usuario IAM `csalvo` necesita estos permisos adicionales:

Ve a AWS Console → IAM → Users → csalvo → Add permissions

Agrega esta política inline:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:DescribeDBInstances",
        "rds-data:ExecuteStatement",
        "rds-data:BatchExecuteStatement",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

O simplemente agrega estas políticas administradas:
- `AmazonRDSReadOnlyAccess`
- `AmazonRDSDataFullAccess`
- `SecretsManagerReadWrite`

## 2. Crear Base de Datos Aurora Serverless

Si no tienes una base de datos Aurora:

1. Ve a https://console.aws.amazon.com/rds/
2. Click "Create database"
3. Selecciona:
   - Engine: **Aurora (PostgreSQL Compatible)** o **Aurora (MySQL Compatible)**
   - Edition: **Amazon Aurora with PostgreSQL/MySQL compatibility**
   - Capacity type: **Serverless v2** (recomendado) o **Serverless v1**
4. En "Settings":
   - DB cluster identifier: `mi-cluster-aws`
   - Master username: `postgres`
   - Master password: (genera uno seguro)
5. En "Additional configuration":
   - **☑️ Enable Data API** (MUY IMPORTANTE)
   - Initial database name: `postgres`
6. Crear base de datos

## 3. Crear Secret en Secrets Manager

1. Ve a https://console.aws.amazon.com/secretsmanager/
2. Click "Store a new secret"
3. Secret type: **Credentials for Amazon RDS database**
4. Selecciona tu cluster creado
5. Secret name: `rds-db-credentials`
6. Guarda el ARN del secret

## 4. Actualizar .env

Después de crear todo, actualiza tu `.env`:

```bash
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:064285316025:cluster:mi-cluster-aws
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:064285316025:secret:rds-db-credentials-abc123
DB_NAME=postgres
```

## 5. Verificar configuración

```bash
node scripts/check-aws.js
```

Si ves tus clusters, ¡estás listo!

## 6. Deploy en Vercel

Una vez configurado todo, corre:

```bash
npm run deploy
```

O manualmente:

```bash
vercel login
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add DB_CLUSTER_ARN
vercel env add DB_SECRET_ARN
vercel env add DB_NAME
vercel env add API_SECRET_KEY
vercel --prod
```

