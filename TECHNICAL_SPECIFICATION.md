# Technical Specification: Booking Service v2.0 (GraphQL + PostgreSQL)

**Project**: ReservasEC Microservices Platform  
**Component**: Booking Service (Modernization)  
**Version**: 2.0.0  
**Status**: Production Ready  
**Date**: February 9, 2026  

---

## 1. Executive Summary

The Booking Service has been completely refactored from a REST+MongoDB architecture to a modern **GraphQL+PostgreSQL** implementation following SOLID principles. This specification documents all architectural decisions, design patterns, and implementation details.

### Key Achievements
- ✅ **GraphQL API**: Flexible, strongly-typed queries and mutations
- ✅ **PostgreSQL**: ACID transactions for data consistency  
- ✅ **SOLID Architecture**: Clear, testable, maintainable code
- ✅ **Kubernetes Ready**: Full orchestration support with manifests
- ✅ **Enterprise Grade**: Health checks, monitoring, security

---

## 2. Architectural Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────┐
│          Apollo GraphQL Server          │
│  (Schema: queries, mutations, types)    │
└────────────────┬────────────────────────┘
                 │
┌─────────────────────────────────────────┐
│       GraphQL Resolvers Layer           │
│  ├─ Query Resolvers (5 queries)         │
│  └─ Mutation Resolvers (3 mutations)    │
└────────────────┬────────────────────────┘
                 │
┌─────────────────────────────────────────┐
│       Service Layer (Business Logic)    │
│  └─ BookingService                      │
│     ├─ Create, Cancel, Delete, List     │
│     ├─ Business Rule Enforcement        │
│     ├─ Transaction Management           │
│     └─ External Service Coordination    │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───────┐   ┌────────┐   ┌──────────┐
│Repos  │   │HTTP    │   │Prisma    │
│tories │   │Clients │   │ORM       │
└───────┘   └────────┘   └──────────┘
    │            │            │
    └────────────┼────────────┘
                 │
    ┌────────────┼────────────────────┐
    │            │                    │
┌─────────┐ ┌──────────┐  ┌─────────┐
│PostgreSQL       User      Notification
│Database         Service   Service
└─────────┴──────────┴──────────┘
```

### 2.2 Request Flow

```
Client Request (GraphQL)
         │
         ↓
Authentication (JWT)
         │
         ↓
GraphQL Resolver (Thin)
         │
         ↓
Service Layer (Business Logic)
         │
         ├─→ Verify User (UserClient)
         ├─→ Access Database (Repository)
         ├─→ Enforce Rules (ACID Transactions)
         ├─→ Notify Users (NotificationClient)
         │
         ↓
Format Response
         │
         ↓
Return to Client
```

---

## 3. SOLID Principles Implementation

### 3.1 Single Responsibility

Each component has exactly one reason to change:

| Layer | Responsibility | File |
|-------|-----------------|------|
| **Resolvers** | Translate GraphQL → Service calls | `graphql/resolvers.js` |
| **Services** | Business logic & orchestration | `services/BookingService.js` |
| **Repositories** | Data access & CRUD | `repositories/*.js` |
| **Adapters** | External service communication | `adapters/*.js` |
| **Models** | Data schema | `prisma/schema.prisma` |

### 3.2 Open/Closed Principle

- Open for extension: Easy to add new queries/mutations
- Closed for modification: Existing code doesn't change
- Example: New repository method doesn't affect service

### 3.3 Liskov Substitution

- All repositories implement same interface pattern
- All HTTP clients follow same request/error pattern
- Mocking is straightforward for testing

### 3.4 Interface Segregation

Each client has focused interface:
```javascript
// UserClient: Only user-related operations
interface UserClient {
  verifyUser(id): Promise
  getUser(id): Promise
}

// NotificationClient: Only notification operations  
interface NotificationClient {
  notifyBookingCreated(data): Promise
  notifyBookingCancelled(data): Promise
}
```

### 3.5 Dependency Inversion

- Services depend on abstractions (repositories, clients)
- Concrete implementations injected at runtime
- Testing: Mock repositories/clients easily

```javascript
// Service receives dependencies, not creating them
class BookingService {
  constructor(bookingRepository, userRepository, userClient, notificationClient, prisma) {
    // Uses injected dependencies
  }
}
```

---

## 4. Database Design

### 4.1 Schema

#### Users Table
```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,                    -- CUID generated
  externalId TEXT UNIQUE NOT NULL,        -- From user-service
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX user_externalId_idx ON "User"(externalId);
CREATE UNIQUE INDEX user_email_idx ON "User"(email);
```

**Why**:
- `externalId`: Links to user-service user ID
- Unique indexes: Fast lookups, data integrity
- CUID: Better distributed system support than UUID

#### Bookings Table
```sql
CREATE TABLE "Booking" (
  id TEXT PRIMARY KEY,                    -- CUID
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  fecha TIMESTAMP NOT NULL,
  servicio TEXT NOT NULL,
  estado BookingStatus DEFAULT 'ACTIVO',  -- ENUM
  canceladaEn TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX booking_userId_idx ON "Booking"(userId);
CREATE INDEX booking_estado_idx ON "Booking"(estado);
CREATE INDEX booking_fecha_idx ON "Booking"(fecha);
```

**Why**:
- Foreign key with CASCADE: Automatic cleanup if user deleted
- ENUM: Type safety at DB level
- Indexes: Performance for common queries
- `canceladaEn`: Timestamp for audit trail

### 4.2 Indexes

Three indexes optimize query patterns:

| Index | Query | Benefit |
|-------|-------|---------|
| `booking_userId_idx` | Find bookings by user | Quick user list |
| `booking_estado_idx` | Find by status | Quick activo/cancelada |
| `booking_fecha_idx` | Range queries (fecha >= today) | Quick next bookings |

### 4.3 ACID Transactions

Critical operation: **Cancel Booking with Auto-Cleanup**

```javascript
// Atomic transaction
await prisma.$transaction(async (tx) => {
  // 1. Update booking (ACTIVO → CANCELADA)
  const cancelled = await tx.booking.update({...});
  
  // 2. Find all cancelled bookings
  const allCancelled = await tx.booking.findMany({...});
  
  // 3. If > 5, delete oldest
  if (allCancelled.length > 5) {
    await tx.booking.deleteMany({...});
  }
  
  return cancelled;
});
```

**Guarantees**:
- ✅ All steps succeed together
- ✅ All steps fail together (rollback)
- ✅ No partial state
- ✅ Isolation from other transactions

---

## 5. GraphQL Schema Design

### 5.1 Types

```graphql
enum BookingStatus {
  ACTIVO
  CANCELADA
}

type Booking {
  id: ID!                    # Required, Global unique
  userId: String!            # User who owns this
  fecha: String!             # ISO datetime
  fechaFormateada: String!   # America/Guayaquil formatted
  servicio: String!          # Hotel service/room type
  estado: BookingStatus!     # Current status
  canceladaEn: String        # When cancelled (nullable)
  createdAt: String!         # Creation timestamp
  updatedAt: String!         # Last update
}

type User {
  id: ID!
  externalId: String!        # Link to user-service
  email: String!
  nombre: String!
  createdAt: String!
  updatedAt: String!
}
```

### 5.2 Queries

```graphql
type Query {
  # Get all bookings (paginated optional)
  bookings: [Booking!]! @auth
  
  # Get next 5 active
  proximasReservas: [Booking!]! @auth
  
  # Get specific booking (ownership check)
  booking(id: ID!): Booking @auth
  
  # Service availability
  health: String!
}
```

### 5.3 Mutations

```graphql
type Mutation {
  # Create with automatic validation & notification
  createBooking(
    fecha: String!     # ISO datetime
    servicio: String!
  ): Booking! @auth
  
  # Cancel with cascade cleanup (ACID)
  cancelarReserva(id: ID!): Booking! @auth
  
  # Soft delete
  deleteBooking(id: ID!): Boolean! @auth
}
```

### 5.4 Schema Design Decisions

1. **fechaFormateada**: Computed field
   - Reason: Client-side conversion error-prone
   - Timezone: America/Guayaquil (business requirement)

2. **Wrapping created/updated dates**: As strings
   - Reason: GraphQL native scalar support
   - Format: ISO 8601 (standard)

3. **estado as ENUM**: Type safety
   - Reason: Database enforces valid values
   - No invalid states possible

4. **No pagination fields**: Simple design
   - Future: Can add offset/limit
   - Current: Focus on core functionality

---

## 6. Service Layer

### 6.1 BookingService Methods

```javascript
class BookingService {
  // Query-equivalent methods
  async getBookings(userId) {} // List all
  async getNextBookings(userId) {} // Top 5 active
  async getBooking(bookingId, userId) {} // By ID

  // Mutation-equivalent methods  
  async createBooking(userId, fecha, servicio) {}
  async cancelBooking(bookingId, userId) {}
  async deleteBooking(bookingId, userId) {}

  // Helpers
  formatDateToGuayaquil(date) {}
}
```

### 6.2 Business Logic Rules

**Rule 1: Max 5 Cancelled Bookings**
```
When canceling a booking:
  1. Mark as CANCELADA
  2. Set canceladaEn timestamp
  3. Count cancelled bookings for user
  4. If count > 5:
     - Sort by canceladaEn (ascending)
     - Delete oldest (count - 5) records
  5. All in one transaction
  6. Notification sent after
```

**Rule 2: User Validation**
```
Before any operation:
  1. Extract userId from JWT
  2. Call UserClient.verifyUser()
  3. If not found:
     - Throw error, fail operation
  4. If found:
     - Update local User table
     - Proceed with operation
```

**Rule 3: Ownership Verification**
```
Before modify/delete:
  1. Fetch booking by ID
  2. Compare booking.userId with request userId
  3. If mismatch:
     - Throw "Unauthorized" error
  4. Proceed with operation
```

**Rule 4: Date Timezone Handling**
```
Input: ISO string (assumed America/Guayaquil)
  → Convert to JS Date
  → Store in DB (stored in UTC)
  
Output: From DB (UTC)
  → Convert to America/Guayaquil
  → Format: "dd/MM/yyyy HH:mm:ss"
```

---

## 7. External Service Integration

### 7.1 UserClient

**Responsibility**: Verify users against external user-service

```javascript
class UserClient {
  async verifyUser(userId): Promise<User | null>
  async getUser(userId): Promise<User>
}
```

**Implementatiion**: HTTP client via Axios
- **Timeout**: 5 seconds
- **Retry**: None (fail fast)
- **Error Handling**: Distinguish 404 vs network errors

**Usage**:
- On booking creation: Verify user exists
- On cancellation: Get user details for notification
- Recovery: If user-service down, operation fails gracefully

### 7.2 NotificationClient

**Responsibility**: Send notifications to notification-service

```javascript
class NotificationClient {
  async notifyBookingCreated(data): Promise<void>
  async notifyBookingCancelled(data): Promise<void>
}
```

**Implementation**: Fire-and-forget pattern
- **Timeout**: 5 seconds
- **Failures**: Logged but don't block mutation
- **Async**: No await in resolvers

**Payload**:
```json
{
  "email": "user@example.com",
  "nombre": "John Doe",
  "servicio": "Suite Deluxe",
  "fecha": "10/02/2026 10:00:00"
}
```

---

## 8. Middleware & Authentication

### 8.1 JWT Extraction

```javascript
function extractUserFromRequest(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  
  const token = header.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

**JWT Payload Expected**:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "iat": 1644000000
}
```

### 8.2 Resolver-Level Authorization

```javascript
Query: {
  bookings: (_, __, context) => {
    const user = extractUserFromRequest(context.req);
    if (!user) throw new Error('Authentication required');
    return service.getBookings(user.userId);
  }
}
```

---

## 9. Kubernetes Deployment Architecture

### 9.1 Manifests Structure

```
k8s/
├── 00-namespace.yaml         # reservas-app namespace
├── 01-secrets.yaml           # DB + JWT + Service URLs
├── 02-configmap.yaml         # Non-sensitive config
├── 03-postgres.yaml          # StatefulSet + PVC + Service
├── 04-booking-service.yaml   # Deployment (2 replicas)
├── 05-rbac.yaml              # ServiceAccount + Roles
└── deploy.sh                 # Automated deployment script
```

### 9.2 Deployment Strategy

```
1. Create namespace (isolates resources)
2. Create secrets (encrypted configuration)
3. Create configmap (environment variables)
4. Deploy PostgreSQL (StatefulSet for state)
5. Wait for database ready
6. Run migrations (Prisma)
7. Deploy app (Deployment with 2 replicas)
8. Wait for pods ready
9. Verify health checks
```

### 9.3 Resource Requests/Limits

```yaml
resources:
  requests:
    memory: "256Mi"     # Minimum guaranteed
    cpu: "100m"         # Minimum guaranteed
  limits:
    memory: "512Mi"     # Maximum allowed
    cpu: "500m"         # Maximum allowed
```

**Rationale**:
- Requests: Scheduler reserves these
- Limits: Prevents resource starvation
- Memory: 256-512MB is sufficient
- CPU: 100-500m is appropriate for microservice

### 9.4 Health Checks

**Startup Probe** (job completion check)
```yaml
httpGet:
  path: /health/alive
  port: 5000
initialDelaySeconds: 10
failureThreshold: 30
periodSeconds: 5
```

**Readiness Probe** (ready for traffic)
```yaml
httpGet:
  path: /health/ready
  port: 5000
initialDelaySeconds: 15
periodSeconds: 10
failureThreshold: 3
```

**Liveness Probe** (still running)
```yaml
httpGet:
  path: /health/alive
  port: 5000
initialDelaySeconds: 20
periodSeconds: 10
failureThreshold: 3
```

---

## 10. Error Handling

### 10.1 GraphQL Errors

```javascript
// Standard GraphQL error
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

### 10.2 Common Errors & Recovery

| Error | Cause | Recovery |
|-------|-------|----------|
| `Authentication required` | Missing JWT | Provide valid token |
| `User not found in user-service` | User doesn't exist | Register user first |
| `Unauthorized` | Wrong user ownership | Use correct booking |
| `Invalid date format` | Bad ISO string | Use ISO 8601 format |
| `Booking not found` | ID doesn't exist | Check ID |

### 10.3 Service Failures

**User-service Down**
```
→ createBooking fails
→ BookingRepository stays clean
→ User gets: "Cannot create booking: User service unavailable"
```

**Notification-service Down**
```
→ createBooking succeeds
→ Notification logged as failed
→ User gets booking confirmation (no notification sent)
```

**Database Down**
```
→ All operations fail
→ Readiness probe fails  
→ Kubernetes removes from load balancer
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Target**: Service layer business logic

```javascript
✅ Test createBooking success
✅ Test createBooking (user not found)
✅ Test cancelBooking (max 5 rule)
✅ Test ownership verification
✅ Test date formatting
```

**Mocking**:
- BookingRepository
- UserRepository
- UserClient
- NotificationClient
- Prisma

### 11.2 Integration Tests

**Target**: Full resolver → service → repository flow

```bash
✅ E2E booking creation
✅ E2E cancellation with cleanup
✅ E2E date formatting in different timezones
```

### 11.3 Test Coverage

Target: **70%+ coverage**

```bash
npm test -- --coverage
```

---

## 12. Performance Considerations

### 12.1 Query Performance

| Operation | Indexes | Time |
|-----------|---------|------|
| List all bookings | User ID | O(log n) |
| Next 5 bookings | User ID + Fecha | O(log n) |
| Get by ID | Primary Key | O(1) |

### 12.2 Caching Opportunities

**Level 1: Database indexes** ✅ Implemented
**Level 2: Application caching** (Future)
```javascript
// Cache user-service responses
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes
```

**Level 3: GraphQL caching** (Future)
```graphql
directive @cached(ttl: Int) on FIELD_DEFINITION
```

### 12.3 Database Connection Pooling

- **Prisma default**: 2 connections
- **Production**: Consider increasing to 5-10
- **Kubernetes**: One connection pool per pod

---

## 13. Security Measures

### 13.1 Authentication
- ✅ JWT bearer token required
- ✅ Signature verification (HS256)
- ✅ Token expiration supported

### 13.2 Authorization
- ✅ User ID from JWT
- ✅ Ownership checks on all operations
- ✅ No cross-user data access

### 13.3 Input Validation
- ✅ GraphQL type system
- ✅ Prisma prepares statements
- ✅ Date format validation

### 13.4 SQL Injection Protection
- ✅ No raw SQL queries (Prisma handles)
- ✅ Parameterized queries
- ✅ Type-safe operations

### 13.5 Secrets Management
- ✅ JWT_SECRET in Kubernetes Secret
- ✅ DATABASE_URL in Kubernetes Secret
- ✅ Never commit .env to git
- ✅ Rotate secrets regularly

---

## 14. Monitoring & Observability

### 14.1 Health Endpoints

```
GET /health         # Overall status
GET /health/ready   # Readiness probe
GET /health/alive   # Liveness probe
```

### 14.2 Logging

```javascript
// Service layer logs
console.log('✅ Booking created:', bookingId);
console.error('❌ Apollo Error:', error);
console.warn('⚠️ User not found in user-service');
```

### 14.3 Future Monitoring

- OpenTelemetry traces
- Prometheus metrics
- Grafana dashboards
- CloudWatch/Datadog integration

---

## 15. Disaster Recovery

### 15.1 Backup Strategy

**Database Backups**:
```bash
# Daily snapshots
kubectl exec postgres-0 -- pg_dump -U postgres booking_db > daily-backup.sql

# Automated via Kubernetes
spec:
  backupPolicy:
    retention: "7d"
```

### 15.2 Failure Scenarios

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Pod crashes | Service unavailable (30s) | Auto-restart via Kubernetes |
| Database down | Data unavailable | Manual failover to backup |
| Network partition | Service isolated | Network heal (automatic) |

### 15.3 Rollback Plan

```bash
# Revert to v1.0.0 still possible
git checkout v1.0.0
docker build -t booking-service:v1.0.0 .
kubectl set image deployment/booking-service \
  booking-service=booking-service:v1.0.0 -n reservas-app
```

---

## 16. Future Enhancements

### 16.1 Short Term (Q1 2026)
- [ ] Add pagination to bookings query
- [ ] Implement GraphQL caching directives
- [ ] Add rate limiting
- [ ] Monitoring dashboard

### 16.2 Medium Term (Q2 2026)
- [ ] subscription for real-time notifications
- [ ] Read replicas for scaling
- [ ] Circuit breaker for external services
- [ ] Database connection pooling optimization

### 16.3 Long Term (Q3+ 2026)
- [ ] Microservice federation
- [ ] Event sourcing for audit trail
- [ ] Multi-region deployment
- [ ] GraphQL stitching with other services

---

## 17. Compliance & Standards

### 17.1 Code Quality
- ✅ SOLID principles
- ✅ DRY (Don't Repeat Yourself)
- ✅ KISS (Keep It Simple, Stupid)

### 17.2 Database Standards
- ✅ ACID compliance
- ✅ Foreign key constraints
- ✅ Proper indexing

### 17.3 API Standards
- ✅ GraphQL spec compliant
- ✅ JSON serialization
- ✅ HTTP status codes

### 17.4 DevOps Standards
- ✅ Docker containerization
- ✅ Kubernetes orchestration
- ✅ Infrastructure as Code

---

## 18. Conclusion

This specification provides a complete blueprint for the modernized Booking Service. It represents best practices in:

- **Architecture**: SOLID, layered design
- **Database**: PostgreSQL with ACID transactions
- **API**: GraphQL with Apollo Server
- **Operations**: Kubernetes-ready deployment
- **Quality**: Comprehensive testing
- **Security**: JWT + ownership verification

The implementation is production-ready and maintainable for years to come.

---

**Document Version**: 1.0  
**Author**: Architecture Team  
**Last Updated**: February 9, 2026  
**Status**: APPROVED ✅
