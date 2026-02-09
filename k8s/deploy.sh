#!/bin/bash

# Kubernetes Deployment Script for Booking Service
# This script handles the deployment of booking-service with all dependencies

set -e

NAMESPACE="reservas-app"
CONTEXT="${1:-docker-desktop}"

echo "🚀 Starting Kubernetes deployment for Booking Service"
echo "📦 Namespace: $NAMESPACE"
echo "🔗 Context: $CONTEXT"

# Switch context (optional)
if [ ! -z "$CONTEXT" ]; then
    echo "Switching to context: $CONTEXT"
    kubectl config use-context "$CONTEXT"
fi

# Step 1: Create namespace
echo "📂 Creating namespace..."
kubectl apply -f 00-namespace.yaml

# Step 2: Create secrets and configmaps
echo "🔐 Creating secrets..."
kubectl apply -f 01-secrets.yaml

echo "⚙️ Creating configmaps..."
kubectl apply -f 02-configmap.yaml

# Step 3: Deploy PostgreSQL
echo "🗄️ Deploying PostgreSQL..."
kubectl apply -f 03-postgres.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s || true

# Step 4: Run database migrations
echo "🔄 Running Prisma migrations..."
# Using the public Docker Hub image pushed by the user
MIGRATION_IMAGE="m4tt1619/booking-service:latest"
kubectl run -it --rm --image=${MIGRATION_IMAGE} \
  --restart=Never \
  --env="DATABASE_URL=postgresql://postgres:postgres_password_change_me@postgres.reservas-app.svc.cluster.local:5432/booking_db" \
  booking-migrations-$(date +%s) \
  -n $NAMESPACE \
  -- npm run migrate || echo "⚠️ Migration failed or skipped"

# Step 5: Deploy Booking Service
echo "🚀 Deploying Booking Service..."
kubectl apply -f 05-rbac.yaml
kubectl apply -f 04-booking-service-deployment.yaml

# Step 6: Wait for Booking Service to be ready
echo "⏳ Waiting for Booking Service to be ready..."
kubectl wait --for=condition=ready pod -l app=booking-service -n $NAMESPACE --timeout=300s || true

# Step 7: Show deployment status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployment Status:"
kubectl get all -n $NAMESPACE

echo ""
echo "🔍 Port Forwarding (optional):"
echo "kubectl port-forward -n $NAMESPACE svc/booking-service 5000:5000"

echo ""
echo "🧪 GraphQL Endpoint:"
echo "http://localhost:5000/graphql"

echo ""
echo "❓ Check logs:"
echo "kubectl logs -n $NAMESPACE -l app=booking-service -f"
