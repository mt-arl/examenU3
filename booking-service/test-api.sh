#!/bin/bash

# 🧪 Testing Guide for Booking Service GraphQL API
# This script helps you test the GraphQL API with proper JWT tokens

set -e

echo "🧪 BOOKING SERVICE - GRAPHQL TESTING GUIDE"
echo "=========================================="
echo ""

# Check if running
echo "🔍 Checking if service is running..."
if ! curl -s http://localhost:5000/graphql > /dev/null; then
    echo "❌ Service not running at http://localhost:5000"
    echo "Run: docker-compose -f docker-compose-local.yml up"
    exit 1
fi

echo "✅ Service is running!"
echo ""

# Generate JWT token
echo "🔐 Generating JWT Token..."
JWT_SECRET="${JWT_SECRET:-dev-secret-key-change-in-production}"
USER_ID="user-$(date +%s)"
JWT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    userId: '$USER_ID',
    email: 'test@example.com',
    nombre: 'Test User',
    iat: Math.floor(Date.now() / 1000)
  },
  '$JWT_SECRET',
  { expiresIn: '24h' }
);
console.log(token);
")

echo "✅ Token generated!"
echo "🔑 Use this token in requests:"
echo ""
echo "Authorization: Bearer $JWT_TOKEN"
echo ""

# Function to make GraphQL requests
graphql_request() {
    local query="$1"
    local description="$2"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📡 $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    curl -X POST "http://localhost:5000/graphql" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{\"query\": \"$query\"}" 2>/dev/null | jq . || echo "Error in request"
    
    echo ""
}

# 1. Health Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 TEST 1: Health Check (No Auth Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "http://localhost:5000/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query": "query { health }"}' 2>/dev/null | jq . || echo "Error"
echo ""

# 2. Get bookings
graphql_request \
    'query { bookings { id fecha fechaFormateada servicio estado createdAt } }' \
    "TEST 2: List All Bookings (should be empty)"

# 3. Create booking
graphql_request \
    'mutation { createBooking(fecha: "2026-02-15T14:30:00", servicio: "Suite Deluxe") { id fecha fechaFormateada servicio estado } }' \
    "TEST 3: Create a Booking"

# 4. List bookings after creation
graphql_request \
    'query { bookings { id fecha fechaFormateada servicio estado } }' \
    "TEST 4: List Bookings (should show created)"

# 5. Get next bookings
graphql_request \
    'query { proximasReservas { id fecha fechaFormateada servicio estado } }' \
    "TEST 5: Next 5 Bookings"

# 6. Introspection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 TEST 6: GraphQL Schema Introspection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "http://localhost:5000/graphql" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{"query": "{ __schema { types { name } } }"}' 2>/dev/null | jq '.data.__schema.types | length' || echo "Error"
echo "Types in schema loaded ✅"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Next Steps:"
echo "1. Access GraphQL Playground: http://localhost:5000/graphql"
echo "2. Use this header in your requests:"
echo "   Authorization: Bearer $JWT_TOKEN"
echo "3. Try the mutations:"
echo "   - createBooking"
echo "   - cancelarReserva"
echo "   - deleteBooking"
echo ""
echo "💡 Tips:"
echo "   • Import Insomnia collection for more examples"
echo "   • Check logs: docker-compose logs -f booking-service"
echo "   • Modify queries above to test more scenarios"
echo ""
