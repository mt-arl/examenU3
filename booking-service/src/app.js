require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { PrismaClient } = require('@prisma/client');
const { json } = require('body-parser');

// Import schema and resolvers
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

// Import routes
const healthRouter = require('./routes/health');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use('/health', healthRouter);

async function startServer() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connected successfully');

        const server = new ApolloServer({
            typeDefs,
            resolvers,
            formatError: (error) => {
                console.error('❌ Apollo Error:', error);
                return error;
            },
        });

        await server.start();

        // Nueva forma de aplicar el middleware en Apollo 4
        app.use(
            '/graphql',
            cors(),
            json(),
            expressMiddleware(server, {
                context: async ({ req }) => ({
                    req,
                    prisma,
                    user: req.user || null,
                }),
            })
        );

        const server_instance = app.listen(PORT, () => {
            console.log(`✅ Booking Service running on http://localhost:${PORT}/graphql`);
        });

        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down gracefully...');
            await prisma.$disconnect();
            server_instance.close(() => {
                process.exit(0);
            });
        });

    } catch (err) {
        console.error('❌ Error starting server:', err);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();