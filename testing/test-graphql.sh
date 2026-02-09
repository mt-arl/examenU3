#!/bin/bash

# GraphQL API Testing Script
# This script demonstrates common GraphQL operations and business logic verification

set -e

# Configuration
GRAPHQL_URL="${1:-http://localhost:5000/graphql}"
JWT_TOKEN="${2:-}"

echo "🧪 Booking Service GraphQL Testing"
echo "📡 Endpoint: $GRAPHQL_URL"
echo ""

if [ -z "$JWT_TOKEN" ]; then
    echo "⚠️ WARNING: No JWT token provided"
    echo "   Usage: ./test-graphql.sh <url> <jwt_token>"
    echo ""
    echo "   Generate a test token with:"
    echo "   node -e \"console.log(require('jsonwebtoken').sign({userId: 'test-user', email: 'test@example.com'}, 'your-secret'))\""
    echo ""
fi

# Helper function to make GraphQL requests
graphql_request() {
    local query="$1"
    local description="$2"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔹 $description"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -z "$JWT_TOKEN" ]; then
        curl -X POST "$GRAPHQL_URL" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$query\"}" | jq .
    else
        curl -X POST "$GRAPHQL_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -d "{\"query\": \"$query\"}" | jq .
    fi

    echo ""
}

# Test 1: Health Check
graphql_request \
    'query { health }' \
    "Test 1: Health Check (GraphQL)"

# Test 2: Health Check via REST
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔹 Test 2: Health Check (REST Endpoint)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl http://localhost:5000/health | jq .
echo ""

# Test 3: Get Bookings (requires auth)
if [ -n "$JWT_TOKEN" ]; then
    graphql_request \
        'query { bookings { id fecha fechaFormateada servicio estado } }' \
        "Test 3: Get All Bookings"

    # Test 4: Get Next Bookings
    graphql_request \
        'query { proximasReservas { id fecha fechaFormateada servicio } }' \
        "Test 4: Get Next 5 Bookings"

    # Test 5: Create Booking
    graphql_request \
        'mutation { createBooking(fecha: "2026-02-15T14:30:00", servicio: "Suite Deluxe") { id fecha fechaFormateada servicio estado createdAt } }' \
        "Test 5: Create Booking"

    # Test 6: Business Logic - Max 5 Cancelled Bookings
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔹 Test 6: Business Logic - Max 5 Cancelled Bookings"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "This test verifies that when a user cancels > 5 bookings,"
    echo "the oldest ones are automatically deleted (ACID transaction)"
    echo "To test manually:"
    echo "1. Create 7+ bookings"
    echo "2. Cancel each one"
    echo "3. Query bookings - should only see 5 cancelled + active ones"
    echo ""

else
    echo "⚠️ Skipping authenticated tests (no JWT token provided)"
    echo ""
fi

# Test 7: Error Handling
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔹 Test 7: Error Handling (Missing Auth)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d '{"query": "query { bookings { id } }"}' | jq .
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation: See README.md for full API reference"
echo "📡 GraphQL Explorer: $GRAPHQL_URL"
