#!/usr/bin/env node

/**
 * 🔐 JWT Token Generator for Booking Service
 * Generates valid JWT tokens for testing the GraphQL API
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Generate a test token
const userId = `user-${Date.now()}`;
const token = jwt.sign(
    {
        userId,
        email: 'test@example.com',
        nombre: 'Test User',
        iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '24h' }
);

console.log('\n🔐 JWT Token Generated Successfully!\n');
console.log('📋 Token Details:');
console.log(`   User ID: ${userId}`);
console.log(`   Email: test@example.com`);
console.log(`   Expires: 24 hours\n`);

console.log('🔑 Token:');
console.log(`${token}\n`);

console.log('📡 Use in GraphQL requests:');
console.log('   Authorization: Bearer ' + token + '\n');

console.log('🧪 Example curl request:');
console.log(`   curl -X POST http://localhost:5000/graphql \\`);
console.log(`     -H "Content-Type: application/json" \\`);
console.log(`     -H "Authorization: Bearer ${token}" \\`);
console.log(`     -d '{"query": "query { bookings { id fecha servicio } }"}'`);
console.log('\n');

// Decode token info
const decoded = jwt.decode(token);
console.log('📊 Decoded Token:');
console.log(JSON.stringify(decoded, null, 2));
console.log('\n');
