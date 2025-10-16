# 🤖 DATOS PARA CONECTAR CHATGPT

## ✅ Tu API está lista en:

**URL**: `https://mcpaws-fb0bdsi71-chris-projects-350fdfeb.vercel.app`

---

## 📋 DATOS PARA EL MODAL DE CHATGPT

Copia estos valores exactamente como están:

### URL
```
https://mcpaws-fb0bdsi71-chris-projects-350fdfeb.vercel.app
```

### Label
```
aws_database
```

### Description
```
AWS RDS Database connector
```

### Authentication
Selecciona: **Access token / API key**

### Access token
```
aws-db-mcp-2024-secure-token-xyz789abc123
```

---

## ⚠️ IMPORTANTE - Completar primero

Antes de que la API funcione correctamente, necesitas:

### 1. Agregar permisos IAM a tu usuario `csalvo`

Ve a: https://console.aws.amazon.com/iam/home#/users/csalvo

Agrega estas políticas:
- `AmazonRDSReadOnlyAccess`
- `AmazonRDSDataFullAccess`  
- `SecretsManagerReadWrite`

### 2. Crear/Obtener base de datos Aurora Serverless

Ve a: https://console.aws.amazon.com/rds/

- Si ya tienes una: copia su ARN
- Si no: crea una Aurora Serverless con **Data API habilitado**

### 3. Crear Secret en Secrets Manager

Ve a: https://console.aws.amazon.com/secretsmanager/

Crea un secret tipo "Credentials for RDS" y copia su ARN

### 4. Actualizar variables en Vercel

Ve a: https://vercel.com/chris-projects-350fdfeb/mcpaws/settings/environment-variables

Actualiza:
- `DB_CLUSTER_ARN` → Tu ARN del cluster RDS
- `DB_SECRET_ARN` → Tu ARN del secret

Luego redeploy desde el dashboard.

---

## 🧪 PROBAR LA API

Antes de conectar ChatGPT, prueba que funcione:

```bash
# Test básico
curl https://mcpaws-fb0bdsi71-chris-projects-350fdfeb.vercel.app/health

# Test con auth
curl https://mcpaws-fb0bdsi71-chris-projects-350fdfeb.vercel.app/api/tools \
  -H "Authorization: Bearer aws-db-mcp-2024-secure-token-xyz789abc123"
```

Deberías recibir JSON con la lista de herramientas disponibles.

---

## 📞 DESPUÉS DE CONECTAR

Una vez conectado en ChatGPT, prueba:

```
"Lista mis clusters Aurora"
"Ejecuta SELECT NOW()"
"Muestra las tablas de mi base de datos"
```

---

## 📚 Archivos útiles en este proyecto

- `DEPLOYMENT_INFO.md` - Información completa del deployment
- `SETUP.md` - Pasos detallados de configuración AWS
- `README.md` - Documentación técnica completa
- `QUICKSTART.md` - Guía rápida de 5 minutos

---

**GitHub**: https://github.com/Chrissalvo1985/mcpaws  
**Vercel**: https://vercel.com/chris-projects-350fdfeb/mcpaws

