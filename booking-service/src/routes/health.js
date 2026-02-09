const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Readiness probe - Check if all dependencies are ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Readiness check failed:', error.message);
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});

/**
 * Liveness probe - Check if service is alive
 */
router.get('/alive', async (req, res) => {
    try {
        res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'dead' });
    }
});

/**
 * Health check endpoint (combined)
 */
router.get('/', async (req, res) => {
    try {
        // Check database
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
        });
    }
});

module.exports = router;
