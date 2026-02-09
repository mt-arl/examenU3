#!/bin/bash

# Booking Service Setup Script
# Quick setup for local development

set -e

echo "🚀 Booking Service v2.0 Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the booking-service directory"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing dependencies${NC}"
npm install

echo ""
echo -e "${BLUE}⚙️  Step 2: Setting up environment${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file (edit with your settings)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo -e "${BLUE}🗄️  Step 3: Checking PostgreSQL${NC}"
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Check if postgres is running
    if docker ps | grep -q postgres-booking; then
        echo "✅ PostgreSQL is already running"
    else
        echo "⏳ Starting PostgreSQL in Docker..."
        docker run -d \
            --name postgres-booking \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=booking_db \
            -p 5432:5432 \
            postgres:15-alpine
        echo "✅ PostgreSQL started (waiting for readiness...)"
        sleep 5
    fi
else
    echo "⚠️ Docker not found - you'll need to start PostgreSQL manually"
    echo "   docker run -d --name postgres-booking -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booking_db -p 5432:5432 postgres:15-alpine"
fi

echo ""
echo -e "${BLUE}📊 Step 4: Running Prisma migrations${NC}"
npm run migrate:dev

echo ""
echo -e "${BLUE}✨ Step 5: Generating Prisma client${NC}"
npm run gen

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start development server:"
echo "   npm run dev"
echo ""
echo "2. Visit GraphQL endpoint:"
echo "   http://localhost:5000/graphql"
echo ""
echo "3. Run tests:"
echo "   npm test"
echo ""
echo "4. View API documentation:"
echo "   cat README.md"
echo ""
echo -e "${YELLOW}Tips:${NC}"
echo "• Import provided Insomnia collection for testing"
echo "• Check .env for database URL and other settings"
echo "• Use JWT tokens for authentication"
echo ""
echo -e "${BLUE}Happy coding! 🎉${NC}"
