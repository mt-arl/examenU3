# 🧪 GUÍA COMPLETA DE PRUEBAS - BOOKING SERVICE v2.0

## ✅ Preguntas Frecuentes sobre Pruebas

### ¿Cómo puedo probar la API?

Hay **3 formas principales**:

---

## 1️⃣ OPCIÓN 1: Script Automatizado (Recomendado)

### Paso 1: Ejecutar el script de prueba

```bash
# Desde la carpeta booking-service
chmod +x test-api.sh
./test-api.sh
```

**Qué hace:**
- ✅ Verifica que el servicio esté corriendo
- ✅ Genera un JWT token automáticamente
- ✅ Prueba 6 operaciones GraphQL
- ✅ Muestra resultados en formato JSON

**Ejemplo de salida:**
```
✅ Service is running!
✅ Token generated!
📡 TEST 1: Health Check (No Auth Required)
{
  "data": {
    "health": "OK"
  }
}

📡 TEST 2: List All Bookings (should be empty)
{
  "data": {
    "bookings": []
  }
}
```

---

## 2️⃣ OPCIÓN 2: Generar Token y Usar cURL

### Paso 1: Generar un token JWT

```bash
node generate-token.js
```

**Salida:**
```
🔐 JWT Token Generated Successfully!

📋 Token Details:
   User ID: user-1707506177123
   Email: test@example.com
   Expires: 24 hours

🔑 Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTE3MDc1MDYxNzcxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJub21icmUiOiJUZXN0IFVzZXIiLCJpYXQiOjE3MDc1MDYxNzcsImV4cCI6MTcwNzU5MjU3N30.xxxxx
```

### Paso 2: Usar el token en requests cURL

**Query: Health Check (sin autenticación)**
```bash
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { health }"}'
```

**Mutation: Crear Reserva**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."

curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { 
      createBooking(
        fecha: \"2026-02-15T14:30:00\", 
        servicio: \"Suite Deluxe\"
      ) { 
        id fecha fechaFormateada servicio estado 
      } 
    }"
  }'
```

**Query: Listar Reservas**
```bash
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "query { bookings { id fecha fechaFormateada servicio } }"}'
```

---

## 3️⃣ OPCIÓN 3: GraphQL Playground (Web Interface)

### Paso 1: Abrir en el navegador

Visita: **http://localhost:5000/graphql**

### Paso 2: Agregar el token en Headers

En la sección inferior izquierda (usualmente dice "HTTP HEADERS"), agrega:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 3: Escribir queries/mutations

Escribe en el panel izquierdo:

```graphql
query {
  bookings {
    id
    fecha
    fechaFormateada
    servicio
    estado
    createdAt
  }
}
```

Presiona el botón ▶️ (play) o **Ctrl+Enter**

---

## 📋 OPERACIONES DE PRUEBA

### 1. Health Check (Sin autenticación)

**Query:**
```graphql
query {
  health
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "health": "OK"
  }
}
```

---

### 2. Listar Todas las Reservas

**Query:**
```graphql
query {
  bookings {
    id
    fecha
    fechaFormateada
    servicio
    estado
    createdAt
  }
}
```

**Respuesta.**
```json
{
  "data": {
    "bookings": [
      {
        "id": "clzo71h7h0001aczrh3y98h4t",
        "fecha": "2026-02-15T14:30:00Z",
        "fechaFormateada": "15/02/2026 14:30:00",
        "servicio": "Suite Deluxe",
        "estado": "ACTIVO",
        "createdAt": "2026-02-09T16:56:00Z"
      }
    ]
  }
}
```

---

### 3. Crear una Reserva

**Mutation:**
```graphql
mutation {
  createBooking(
    fecha: "2026-02-15T14:30:00"
    servicio: "Suite Deluxe"
  ) {
    id
    fecha
    fechaFormateada
    servicio
    estado
    createdAt
  }
}
```

**Nota sobre la fecha:**
- Formato: ISO 8601 (YYYY-MM-DDTHH:mm:ss)
- Timezone: Asumida America/Guayaquil
- Ejemplos válidos:
  - `2026-02-15T14:30:00`
  - `2026-03-20T09:00:00`
  - `2026-12-25T18:45:00`

---

### 4. Obtener Próximas 5 Reservas

**Query:**
```graphql
query {
  proximasReservas {
    id
    fecha
    fechaFormateada
    servicio
    estado
  }
}
```

**Criterios:**
- Solo reservas con `estado: ACTIVO`
- Fecha >= hoy
- Ordenadas por fecha (próximas primero)
- Máximo 5 resultados

---

### 5. Cancelar una Reserva

**Primero, obtén un ID de reserva:**
```graphql
query {
  bookings {
    id
  }
}
```

**Luego, cancelala:**
```graphql
mutation {
  cancelarReserva(id: "clzo71h7h0001aczrh3y98h4t") {
    id
    estado
    canceladaEn
    fechaFormateada
  }
}
```

**¿Qué pasa internamente?**
- ✅ Cambia `estado` a `CANCELADA`
- ✅ Establece `canceladaEn` con la fecha actual
- ✅ Si el usuario tiene > 5 canceladas, elimina las más antiguas
- ✅ TODO en una **transacción ACID** (todo o nada)
- ✅ Envía email de notificación (asincrónico)

---

### 6. Eliminar una Reserva

```graphql
mutation {
  deleteBooking(id: "clzo71h7h0001aczrh3y98h4t")
}
```

**Respuesta:**
```json
{
  "data": {
    "deleteBooking": true
  }
}
```

---

### 7. Obtener una Reserva Específica

```graphql
query {
  booking(id: "clzo71h7h0001aczrh3y98h4t") {
    id
    fecha
    fechaFormateada
    servicio
    estado
    canceladaEn
    createdAt
  }
}
```

---

## 🔒 MANEJO DE AUTENTICACIÓN

### Problema: "Authentication required"

**Causa:** No incluiste el JWT token

**Solución:**
```bash
# 1. Generar token
TOKEN=$(node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({userId: 'user-123', email: 'test@example.com'}, 'dev-secret-key-change-in-production'))")

# 2. Usar en curl
curl -X POST http://localhost:5000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'
```

---

## 🧪 PRUEBA DEL NEGOCIO: Máximo 5 Canceladas

Esta es la **regla de negocio más importante**. Vamos a verificarla:

### Paso 1: Crear 7 reservas

```bash
for i in {1..7}; do
  FECHA="2026-02-$(printf "%02d" $((10+i)))T14:00:00"
  curl -X POST http://localhost:5000/graphql \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"mutation { createBooking(fecha: \\\"$FECHA\\\", servicio: \\\"Suite $i\\\") { id } }\"}"
done
```

### Paso 2: Obtener los IDs

```bash
curl -X POST http://localhost:5000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { bookings { id } }"}'
```

### Paso 3: Cancelar las 7

```bash
# Cancelar cada una (de una en una)
curl -X POST http://localhost:5000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { cancelarReserva(id: \"[ID-1]\") { id estado } }"}'

# ... repetir para IDs 2-7
```

### Paso 4: Verificar la regla

```bash
curl -X POST http://localhost:5000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { bookings { id estado } }"}'
```

**Resultado esperado:**
- ✅ Solo 5 CANCELADAS (las más recientes)
- ✅ 2 canceladas antiguas fueron eliminadas automáticamente
- ✅ ACID transaction garantiza consistencia

---

## 📊 USANDO INSOMNIA/POSTMAN

### Opción 1: Importar Colección

```bash
# Ubicación: ../testing/booking-service-insomnia.json
# En Insomnia: File → Import → Select file
```

### Opción 2: Crear Manualmente

1. **Nueva Request**
   - Method: `POST`
   - URL: `http://localhost:5001/graphql`

2. **Header**
   - Key: `Authorization`
   - Value: `Bearer <token>`

3. **Body** (JSON)
   ```json
   {
     "query": "query { health }"
   }
   ```

4. **Send**

---

## 🐛 TROUBLESHOOTING

### Error: "ECONNREFUSED"
**Significa:** El servicio no está corriendo

**Solución:**
```bash
# Verificar estado
docker-compose ps

# Si no está corriendo, iniciar
docker-compose -f docker-compose-local.yml up
```

### Error: "token not provided"
**Significa:** Falta el header Authorization

**Solución:**
```bash
# Agregar header en curl
-H "Authorization: Bearer $TOKEN"

# O en Insomnia: HTTP HEADERS
{
  "Authorization": "Bearer eyJ..."
}
```

### Error: "User not found in user-service"
**Significa:** El user-service no está disponible

**Motivo:** Es normal en desarrollo local
**Solución:**
- Para desarrollo, mockear user-service
- Ver issue #1 en el README

### Base de datos vacía
**Significa:** Migraciones no corrieron

**Solución:**
```bash
docker-compose exec booking npm run migrate
```

---

## 📚 ARCHIVOS ÚTILES

| Archivo | Propósito |
|---------|-----------|
| `test-api.sh` | Script automatizado de pruebas |
| `generate-token.js` | Generador de JWT tokens |
| `../testing/booking-service-insomnia.json` | Colección Insomnia |
| `../testing/test-graphql.sh` | Script de pruebas completo |

---

## ✅ Checklist de Pruebas

- [ ] Health check (sin auth)
- [ ] Listar reservas (vacío)
- [ ] Crear 1 reserva
- [ ] Listar reservas (con 1)
- [ ] Próximas reservas
- [ ] Cancelar reserva
- [ ] Verificar cancelada
- [ ] Crear 7 reservas
- [ ] Cancelar las 7
- [ ] Verificar solo 5 canceladas persisten
- [ ] Eliminar reserva
- [ ] Variables de entorno funcionan

---

## 🎯 Resumen Rápido

```bash
# 1. Terminal 1: Docker Compose
docker-compose -f docker-compose-local.yml up

# 2. Terminal 2: Generar token
cd booking-service
node generate-token.js

# 3. Terminal 2: Copiar token y probar
TOKEN="eyJ..."
curl -X POST http://localhost:5000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { bookings { id } }"}'

# O ejecutar pruebas automáticas
./test-api.sh
```

---

**¡Listo! Ahora puedes probar la API GraphQL completamente.** 🚀
