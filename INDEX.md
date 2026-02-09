# 📚 Booking Service v2.0 - Documentation Index

Welcome to the modernized **Booking Service** (GraphQL + PostgreSQL). This index helps you navigate all available documentation.

---

## 🎯 Quick Navigation

### 🚀 Getting Started (5 minutes)
- **New to the project?** Start here: [Quick Start Guide](#quick-start)
- **Quick setup script**: `./booking-service/setup.sh`
- **Test GraphQL**: `./testing/test-graphql.sh`

### 📖 Main Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [booking-service/README.md](booking-service/README.md) | **Complete API Reference** | Developers, API Users |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | **REST → GraphQL Changes** | Developers, Architects |
| [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) | **Architecture & Design** | Architects, Senior Developers |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | **Quick Overview** | Everyone |

### 🔧 Developer Resources

| Resource | Purpose |
|----------|---------|
| `booking-service/.env.example` | Environment variables list |
| `booking-service/package.json` | Dependencies list |
| `booking-service/jest.config.js` | Testing configuration |
| `testing/booking-service-insomnia.json` | GraphQL request collection |
| `testing/test-graphql.sh` | Automated GraphQL testing |

### 🐳 DevOps Resources

| Resource | Purpose |
|----------|---------|
| `booking-service/Dockerfile` | Container image definition |
| `booking-service/docker-compose-local.yml` | Local development Docker setup |
| `k8s/` directory | All Kubernetes manifests |
| `k8s/deploy.sh` | Automated K8s deployment script |

---

## 📋 Documentation by Use Case

### 👨‍💻 "I want to develop locally"

1. **Setup**
   ```bash
   cd booking-service
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start coding**
   ```bash
   npm run dev
   # Open http://localhost:5000/graphql
   ```

3. **Learn API**
   - Read: [README.md](booking-service/README.md) (GraphQL API Reference section)
   - Try: Examples in GraphQL docs

4. **Run tests**
   ```bash
   npm test
   ```

### 📊 "I need to understand the architecture"

1. **Overview** (15 min read)
   - Read: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) (Architecture Summary)

2. **Deep dive** (45 min read)
   - Read: [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)
   - Focus: Section 2 (Overview), Section 3 (SOLID), Section 6 (Services)

3. **Design patterns**
   - File: `src/services/BookingService.js` (example)
   - File: `src/repositories/BookingRepository.js` (example)

### 🚀 "I want to deploy to Kubernetes"

1. **Quick deployment** (10 minutes)
   ```bash
   cd k8s
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Manual deployment** (20 minutes)
   - Read: [booking-service/README.md](booking-service/README.md) (Kubernetes Deployment section)
   - Follow: Step-by-step manual deployment

3. **Troubleshooting**
   - Read: [booking-service/README.md](booking-service/README.md) (Troubleshooting section)
   - Check: Kubernetes pod logs

### 🔄 "I'm upgrading from v1.0.0"

1. **Understand changes**
   - Read: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
   - Focus: Endpoint Mapping, Database Changes

2. **Update your code**
   - Change REST endpoints → GraphQL queries
   - Update request/response parsing
   - Add JWT authorization header

3. **Test integration**
   - Use: Insomnia collection for manual testing
   - Run: `testing/test-graphql.sh` script

### 🧪 "I need to write tests"

1. **Understand test structure**
   - Read: [booking-service/README.md](booking-service/README.md) (Testing section)
   - File: `src/__tests__/services/BookingService.test.js`

2. **Run existing tests**
   ```bash
   npm test              # Run all
   npm test -- --watch   # Watch mode
   npm test -- --coverage # With coverage
   ```

3. **Write new tests**
   - Pattern: Copy existing test structure
   - Mock: All external dependencies
   - Assert: Business logic rules

### 🔒 "I need to understand security"

1. **Authentication**
   - Read: [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) (Section 8)
   - File: `src/middleware/auth.js`

2. **Authorization**
   - Read: [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) (Section 3, SOLID)
   - File: `src/services/BookingService.js` (ownership checks)

3. **Data Protection**
   - Read: [booking-service/README.md](booking-service/README.md) (Security Considerations)
   - File: `k8s/01-secrets.yaml` (secret management)

---

## 🎯 Quick Reference

### Commands

**Development**
```bash
npm run dev          # Start dev server
npm test             # Run tests
npm run gen          # Generate Prisma client
npm run migrate:dev  # Run migrations
```

**Docker**
```bash
docker-compose -f docker-compose-local.yml up     # Start services
docker-compose -f docker-compose-local.yml down   # Stop services
```

**Kubernetes**
```bash
cd k8s && ./deploy.sh                # Deploy to K8s
kubectl logs -n reservas-app <pod>   # View logs
kubectl port-forward ... 5000:5000   # Port forward
```

### URLs

**Local Development**
- GraphQL: `http://localhost:5000/graphql`
- Health: `http://localhost:5000/health`

**Kubernetes** (after port-forward)
- GraphQL: `http://localhost:5000/graphql`
- Health: `http://localhost:5000/health`

### Files Structure

```
booking-service/
├── src/             # Application code
├── prisma/          # Database schema & migrations
├── __tests__/       # Test files
├── README.md        # Complete API documentation
├── package.json     # Dependencies
└── Dockerfile       # Container image

k8s/
├── 00-namespace.yaml
├── 01-secrets.yaml
├── 02-configmap.yaml
├── 03-postgres.yaml
├── 04-booking-service-deployment.yaml
├── 05-rbac.yaml
└── deploy.sh

testing/
├── booking-service-insomnia.json
└── test-graphql.sh

Documentation/
├── README.md (root)
├── PROJECT_SUMMARY.md
├── MIGRATION_GUIDE.md
└── TECHNICAL_SPECIFICATION.md
```

---

## 📈 Learning Path

### Beginner (1-2 hours)
1. ✅ [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview
2. ✅ [booking-service/README.md](booking-service/README.md) - API basics
3. ✅ Try: Run `./setup.sh` and access GraphQL

### Intermediate (3-4 hours)
1. ✅ [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Changes explained
2. ✅ [booking-service/README.md](booking-service/README.md) - Full API reference
3. ✅ Learn: File structure in `src/`
4. ✅ Try: Run tests, write mutation

### Advanced (6-8 hours)
1. ✅ [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md) - Full architecture
2. ✅ Study: SOLID principles in code
3. ✅ Review: Database design & transactions
4. ✅ Deploy: To Kubernetes using `k8s/deploy.sh`

---

## ✅ Verification Checklist

### ✅ Setup Complete When:
- [ ] `npm install` succeeds
- [ ] `npm run migrate:dev` runs without errors
- [ ] `npm run dev` starts server on port 5000
- [ ] GraphQL endpoint responds: `http://localhost:5000/graphql`

### ✅ First Query When:
- [ ] Authorization header included
- [ ] Query: `{ health }` returns "OK"
- [ ] Query: `{ bookings { id } }` returns array (empty or with data)

### ✅ Deployment Ready When:
- [ ] `npm test` passes all tests
- [ ] Docker image builds: `docker build -t booking-service:latest .`
- [ ] `k8s/deploy.sh` runs without errors
- [ ] Pods are ready: `kubectl get pods -n reservas-app`

---

## 🆘 Getting Help

### Issue: Something doesn't work

**Step 1: Check the logs**
```bash
# Local development
npm run dev
# Look for error messages

# Docker
docker-compose logs booking-service

# Kubernetes
kubectl logs -n reservas-app -l app=booking-service
```

**Step 2: Check the documentation**
- API error? → [README.md](booking-service/README.md) (Error Handling)
- Architecture question? → [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)
- Deployment issue? → [README.md](booking-service/README.md) (Troubleshooting)
- Migration question? → [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

**Step 3: Check the code**
- Test file: `src/__tests__/services/BookingService.test.js`
- Example: `src/services/BookingService.js`

### Common Issues

| Problem | Solution |
|---------|----------|
| Port 5000 already in use | Kill process: `lsof -i :5000 \| kill` |
| PostgreSQL connection error | Check .env DATABASE_URL |
| GraphQL authentication error | Add Authorization header with JWT |
| K8s deployment fails | Check: `kubectl describe pod` and `kubectl logs` |

---

## 📞 Support Resources

### Internal
- Code comments in source files
- JSDoc in function definitions
- Example usage in test files

### External
- [Apollo Server Docs](https://www.apollographql.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [GraphQL Spec](https://graphql.org/)
- [Kubernetes Docs](https://kubernetes.io/)

---

## 📅 Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| README.md | 1.0 | 2026-02-09 |
| MIGRATION_GUIDE.md | 1.0 | 2026-02-09 |
| TECHNICAL_SPECIFICATION.md | 1.0 | 2026-02-09 |
| PROJECT_SUMMARY.md | 1.0 | 2026-02-09 |
| INDEX.md (this file) | 1.0 | 2026-02-09 |

---

## 🎉 You're Ready!

Choose your path:

- **Developers**: Start with [setup.sh](booking-service/setup.sh)
- **Architects**: Read [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)
- **DevOps**: Go to [k8s/deploy.sh](k8s/deploy.sh)
- **Users**: Check [README.md](booking-service/README.md) API Reference

**Happy coding! 🚀**

---

*Last Updated: February 9, 2026*  
*Booking Service v2.0 - Production Ready*
