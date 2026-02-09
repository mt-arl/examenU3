# 📚 Booking Service - GraphQL + PostgreSQL Microservice

> **Migrated from REST + MongoDB to GraphQL + PostgreSQL with full Kubernetes support**

## 🎯 Project Overview

This is a modernized microservice for handling hotel reservations in the ReservasEC platform. It has been completely refactored from a REST API with MongoDB to a **GraphQL API with PostgreSQL**, following SOLID principles and featuring Enterprise-grade deployment capabilities.

### Key Features
- ✅ **GraphQL API** with Apollo Server for flexible querying
- ✅ **PostgreSQL Database** with Prisma ORM and automatic migrations
- ✅ **ACID Transactions** for critical operations (booking cancellation + cleanup)
- ✅ **SOLID Architecture** with clear separation of concerns (resolvers → services → repositories)
- ✅ **External Service Integration** with UserService and NotificationService
- ✅ **Kubernetes Ready** with health checks, ConfigMaps, Secrets, and StatefulSets
- ✅ **Comprehensive Testing** with unit and integration tests
- ✅ **JWT Authentication** for secure access
- ✅ **America/Guayaquil Timezone Support** for date formatting

---

## 📋 Technical Stack

| Layer | Technology |
|-------|-----------|
| **API Framework** | Apollo Server + Express.js |
| **Language** | Node.js (18+) |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma |
| **Authentication** | JWT (jsonwebtoken) |
| **HTTP Client** | Axios |
| **Testing** | Jest + Supertest |
| **Container** | Docker + Kubernetes |
| **Date Handling** | date-fns + date-fns-tz + Luxon |

---

## 🏗️ Architecture

### SOLID Principles Implementation

```
┌─────────────────────────────────────────────┐
│         GraphQL Resolvers Layer             │
│   (Thin, delegate to services)              │
└────────────────┬────────────────────────────┘
                 │
┌─────────────────────────────────────────────┐
│      Business Logic Services Layer          │
│  - Orchestration                            │
│  - Business Rules                           │
│  - Transaction Management                   │
└────────────────┬────────────────────────────┘
                 │
┌────────────────────────────────────────────┐
│      Data Access Layer                     │
│  - Repositories (CRUD ops)                 │
│  - Database Queries                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────────────────────────────────┐
│    External Service Adapters               │
│  - UserClient (Verify users)               │
│  - NotificationClient (Send emails)        │
└────────────────────────────────────────────┘
```

### Directory Structure

```
booking-service/
├── src/
│   ├── app.js                    # Main Apollo Server setup
│   ├── graphql/
│   │   ├── schema.js             # GraphQL type definitions
│   │   └── resolvers.js          # Query and Mutation resolvers
│   ├── services/
│   │   └── BookingService.js     # Core business logic
│   ├── repositories/
│   │   ├── BookingRepository.js  # Booking data access
│   │   └── UserRepository.js     # User data access
│   ├── adapters/
│   │   ├── UserClient.js         # HTTP client for user-service
│   │   └── NotificationClient.js # HTTP client for notification-service
│   ├── middleware/
│   │   └── auth.js               # JWT authentication
│   ├── routes/
│   │   └── health.js             # Health check endpoints
│   └── __tests__/                # Unit and integration tests
├── prisma/
│   └── schema.prisma             # Database schema
├── k8s/                          # Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-secrets.yaml
│   ├── 02-configmap.yaml
│   ├── 03-postgres.yaml
│   ├── 04-booking-service-deployment.yaml
│   ├── 05-rbac.yaml
│   └── deploy.sh
├── Dockerfile                    # Container image
├── package.json
├── .env.example
└── README.md (this file)
```

---

## ⚙️ Environment Variables

### Required Variables

Create a `.env` file based on `.env.example`:

```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://user:password@localhost:5432/booking_db"

# Application
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# External Services
USER_SERVICE_URL=http://localhost:5003
NOTIFICATION_SERVICE_URL=http://localhost:5002

# GraphQL
APOLLO_DEBUG=true
```

### Kubernetes Secrets

Variables are injected via Kubernetes Secrets and ConfigMaps:
- See `k8s/01-secrets.yaml` for secret values
- See `k8s/02-configmap.yaml` for non-sensitive config

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   cd booking-service
   npm install
   ```

2. **Setup PostgreSQL** (using Docker)
   ```bash
   docker run --name postgres-booking \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=booking_db \
     -p 5432:5432 \
     postgres:15-alpine
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run Prisma migrations**
   ```bash
   npm run migrate:dev
   ```

5. **Generate Prisma Client**
   ```bash
   npm run gen
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Server will start at: `http://localhost:5000/graphql`

### Local Testing with Docker Compose

A simplified setup for local development:

```bash
docker-compose -f docker-compose-local.yml up
```

This will start:
- PostgreSQL (port 5432)
- Booking Service (port 5000)

---

## 📡 GraphQL API Reference

### Authentication

All queries and mutations require a JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

The JWT should contain:
```json
{
  "userId": "user-id-from-user-service",
  "email": "user@example.com",
  "iat": 1234567890
}
```

### Queries

#### Get All Bookings
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

**Response:**
```json
{
  "data": {
    "bookings": [
      {
        "id": "clzo71h7h0001aczrh3y98h4t",
        "fecha": "2026-02-10T10:00:00Z",
        "fechaFormateada": "10/02/2026 10:00:00",
        "servicio": "Suite Deluxe",
        "estado": "ACTIVO",
        "createdAt": "2026-02-09T12:30:00Z"
      }
    ]
  }
}
```

#### Get Next 5 Active Bookings
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

#### Get Specific Booking
```graphql
query {
  booking(id: "clzo71h7h0001aczrh3y98h4t") {
    id
    fecha
    fechaFormateada
    servicio
    estado
    canceladaEn
  }
}
```

#### Health Check
```graphql
query {
  health
}
```

### Mutations

#### Create Booking
```graphql
mutation {
  createBooking(
    fecha: "2026-02-10T10:00:00"
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

**Notes:**
- `fecha` must be in ISO format (datetime)
- Timezone is assumed to be America/Guayaquil
- User is validated against user-service
- Notification email is sent asynchronously

#### Cancel Booking
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

**Business Rules:**
- Changes booking status from ACTIVO to CANCELADA
- Sets `canceladaEn` timestamp
- **ATOMIC OPERATION**: If user has > 5 cancelled bookings, automatically deletes the oldest ones
- Sends cancellation notification email

#### Delete Booking
```graphql
mutation {
  deleteBooking(id: "clzo71h7h0001aczrh3y98h4t")
}
```

**Response:**
```json
{
  "data": {
    "deleteBooking": true
  }
}
```

---

### Error Handling

All errors return proper GraphQL error format:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

Common errors:
- `Authentication required` - Missing or invalid JWT
- `User not found in user-service` - User doesn't exist in external service
- `Unauthorized: This booking does not belong to you` - User attempting to access another user's booking
- `Invalid date format` - Malformed date string

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Service layer business logic
  - Location: `src/__tests__/services/`
  - Tests: Booking creation, cancellation, deletion with business rules
  
- **Service Tests**: Repository interactions and data access
  - Location: `src/__tests__/repositories/`
  - Tests: CRUD operations, queries, transactions

### Example Test Case: Max 5 Cancelled Bookings Rule

```bash
# Run specific test
npm test -- BookingService.test.js -t "cancel booking and enforce max 5 rule"
```

This test verifies:
1. Booking is marked as CANCELADA
2. `canceladaEn` timestamp is set
3. If user has >5 cancelled bookings, oldest are automatically deleted (in transaction)
4. Cancellation notification is sent

---

## 🐳 Docker & Local Deployment

### Build Docker Image

```bash
docker build -t booking-service:latest .
```

### Run with Docker Compose (Local)

```bash
docker-compose -f docker-compose-local.yml up
```

This starts:
- PostgreSQL (port 5432)
- Booking Service (port 5000, http://localhost:5000/graphql)

### Database Migrations in Docker

```bash
# Run migrations in container
docker-compose -f docker-compose-local.yml exec booking npm run migrate
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, Docker Desktop K8s, or cloud)
- `kubectl` CLI configured
- Docker image built and available

### Quick Start

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

This script:
1. ✅ Creates namespace `reservas-app`
2. ✅ Deploys PostgreSQL with PersistentVolumeClaim
3. ✅ Creates secrets and configmaps
4. ✅ Runs Prisma migrations
5. ✅ Deploys booking-service with 2 replicas
6. ✅ Waits for all services to be ready

### Manual Deployment

```bash
# 1. Create namespace and secrets
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-secrets.yaml
kubectl apply -f 02-configmap.yaml

# 2. Deploy PostgreSQL
kubectl apply -f 03-postgres.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n reservas-app --timeout=300s

# 3. Run migrations
kubectl run -it --rm --image=booking-service:latest \
  --env="DATABASE_URL=..." \
  booking-migrations -n reservas-app \
  -- npm run migrate

# 4. Deploy application
kubectl apply -f 05-rbac.yaml
kubectl apply -f 04-booking-service-deployment.yaml
```

### Verify Deployment

```bash
# Check all resources
kubectl get all -n reservas-app

# Check pod logs
kubectl logs -n reservas-app -l app=booking-service -f

# Check database
kubectl exec -it -n reservas-app postgres-0 -- psql -U postgres -d booking_db

# Port forward for local testing
kubectl port-forward -n reservas-app svc/booking-service 5000:5000
```

### Health Checks

The service includes three health endpoints:

- **Readiness Probe** (`/health/ready`) - DB connected, ready for traffic
- **Liveness Probe** (`/health/alive`) - Service is alive
- **Startup Probe** (`/health/*`) - Service has completed startup

Check health:
```bash
kubectl get pods -n reservas-app
# Look for READY column: should be 1/1 and STATUS: Running
```

### Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment booking-service -n reservas-app --replicas=3

# Watch scaling progress
kubectl get pods -n reservas-app -w
```

### Updating Secrets

⚠️ **IMPORTANT**: Change these in production!

```bash
# Edit secrets
kubectl edit secret booking-service-secrets -n reservas-app

# Or create new secret
kubectl create secret generic booking-service-secrets \
  --from-literal=JWT_SECRET=new-secret \
  --from-literal=... \
  -n reservas-app --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to load new secrets
kubectl rollout restart deployment booking-service -n reservas-app
```

### Database Persistence

PostgreSQL data is stored in a PersistentVolumeClaim:
- **Size**: 10Gi (edit in 03-postgres.yaml)
- **Access Mode**: ReadWriteOnce
- **Storage Class**: default (modify for cloud providers)

Backup PostgreSQL:
```bash
kubectl exec -n reservas-app postgres-0 -- \
  pg_dump -U postgres booking_db > backup.sql

# Restore
kubectl exec -i -n reservas-app postgres-0 -- \
  psql -U postgres booking_db < backup.sql
```

---

## 🔒 Security Considerations

### JWT Secret Management

In production:
1. **Never** commit secrets to git
2. Use Kubernetes Secret management (encrypted at rest)
3. Rotate secrets regularly
4. Use strong, random secrets (minimum 32 characters)

Example secret generation:
```bash
openssl rand -base64 32
# Output: example_secret_key_here
```

### User Validation

Before creating/modifying bookings:
- ✅ User is verified against `user-service`
- ✅ User ID matches JWT token
- ✅ Booking ownership is validated on all operations

### Database Security

- ✅ ACID transactions for critical operations
- ✅ Input validation via Prisma
- ✅ Prepared statements (Prisma handles this)
- ✅ Database connection over network (enable SSL in production)

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  externalId TEXT UNIQUE,      -- UUID from user-service
  email TEXT UNIQUE,
  nombre TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE "Booking" (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  fecha TIMESTAMP,
  servicio TEXT,
  estado BookingStatus,         -- ACTIVO, CANCELADA
  canceladaEn TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "Booking_userId" ON "Booking"(userId);
CREATE INDEX "Booking_estado" ON "Booking"(estado);
CREATE INDEX "Booking_fecha" ON "Booking"(fecha);
```

---

## 🔗 External Service Integration

### User Service Verification

When creating a booking:
1. Token is decoded to get `userId`
2. `UserClient.verifyUser(userId)` calls: `GET /users/{userId}`
3. User-service returns: `{ id, email, nombre, ... }`
4. If not found (404), booking creation fails
5. Local user is created/updated with external ID

### Notification Service

After operation:
- `NotificationClient.notifyBookingCreated()` → `POST /notify/reserva`
- `NotificationClient.notifyBookingCancelled()` → `POST /notify/cancelacion`

Failures are logged but don't block the mutation (async/fire-and-forget).

---

## 🐛 Troubleshooting

### Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check PostgreSQL is running: `docker ps`
2. Verify `DATABASE_URL` in `.env`
3. Ensure port 5432 is not blocked

### Prisma Migration Errors

```
Error: P1001 Can't reach database server
```

**Solution:**
```bash
# Reset (CAUTION: deletes all data!)
npm run migrate:dev -- --skip-seed

# Or manually check connection
psql postgresql://user:password@host:5432/booking_db
```

### GraphQL Query Errors

```
"Authentication required"
```

**Solution:**
- Include Authorization header: `Authorization: Bearer <token>`
- Verify JWT token is valid (not expired)
- Check `JWT_SECRET` matches in .env

### Kubernetes Pod Not Starting

```bash
kubectl describe pod -n reservas-app <pod-name>
kubectl logs -n reservas-app <pod-name> --previous
```

Check:
- Image pull errors: `kubectl get events -n reservas-app`
- Database migration failed: `kubectl logs <init-job>`
- Resource limits: Change in 04-booking-service-deployment.yaml

---

## 📚 API Testing with Insomnia

Import this collection into Insomnia or Postman:

### Request: Create Booking
```
POST http://localhost:5000/graphql
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "query": "mutation { createBooking(fecha: \"2026-02-10T10:00:00\", servicio: \"Suite Deluxe\") { id fecha fechaFormateada servicio estado } }"
}
```

### Request: List Bookings
```
POST http://localhost:5000/graphql
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "query { bookings { id fecha fechaFormateada servicio estado } }"
}
```

### Request: Cancel Booking
```
POST http://localhost:5000/graphql
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "mutation { cancelarReserva(id: \"<booking-id>\") { id estado canceladaEn } }"
}
```

A complete Insomnia collection file is available in `testing/booking-service.json`

---

## 📈 Performance Tips

### Database Optimization
- ✅ Indexes on `userId`, `estado`, `fecha`
- ✅ Use database connection pooling
- ✅ VACUUM and ANALYZE regularly

### Caching Strategies
- Consider Redis for frequently accessed user data
- Cache user-service responses (short TTL)

### Monitoring
```bash
# Watch pod resource usage
kubectl top pods -n reservas-app -w

# Check database size
kubectl exec -it -n reservas-app postgres-0 -- \
  psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('booking_db'));"
```

---

## 📝 Logging & Debugging

### Enable Debug Logs
```bash
# In .env
APOLLO_DEBUG=true
LOG_LEVEL=debug
```

### View Logs
```bash
# Local development
npm run dev

# Docker
docker-compose -f docker-compose-local.yml logs -f booking-service

# Kubernetes
kubectl logs -n reservas-app -l app=booking-service -f
kubectl logs -n reservas-app -l app=postgres -f
```

---

## 🚧 Future Enhancements

- [ ] Add filtering/pagination to bookings query
- [ ] Implement subscription for real-time notifications
- [ ] Add GraphQL caching directives
- [ ] Database read replicas for scaling
- [ ] Implement circuit breaker for external services
- [ ] Add OpenTelemetry tracing
- [ ] GraphQL rate limiting
- [ ] Implement soft deletes for audit trail

---

## 📄 License

This project is part of the ReservasEC platform.

---

## 📞 Support

For issues, questions, or contributions:
1. Check this README first
2. Review error logs: `kubectl logs -n reservas-app`
3. Check Prisma migrations: `npx prisma studio`
4. Test GraphQL endpoint: `http://localhost:5000/graphql`

---

**Last Updated**: February 9, 2026  
**Version**: 2.0.0 (GraphQL + PostgreSQL)
