const BookingService = require('../services/BookingService');
const BookingRepository = require('../repositories/BookingRepository');
const UserRepository = require('../repositories/UserRepository');
const UserClient = require('../adapters/UserClient');
const NotificationClient = require('../adapters/NotificationClient');
const { extractUserFromRequest } = require('../middleware/auth');

/**
 * Create instances of services, repositories, and clients
 * These are initialized with context
 */
function initializeResolverDependencies(prisma) {
    const bookingRepository = new BookingRepository(prisma);
    const userRepository = new UserRepository(prisma);
    const userClient = new UserClient();
    const notificationClient = new NotificationClient();

    const bookingService = new BookingService(
        bookingRepository,
        userRepository,
        userClient,
        notificationClient,
        prisma
    );

    return { bookingService, bookingRepository, userRepository };
}

/**
 * Resolvers - Handle GraphQL queries and mutations
 * SOLID Principle: Resolvers are thin and delegate to service layer
 */
const resolvers = {
    Query: {
        /**
         * Get all bookings for authenticated user
         */
        bookings: async (_, __, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);
            return await bookingService.getBookings(user.userId);
        },

        /**
         * Get next 5 active bookings
         */
        proximasReservas: async (_, __, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);
            return await bookingService.getNextBookings(user.userId);
        },

        /**
         * Get a specific booking by ID
         */
        booking: async (_, { id }, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);
            return await bookingService.getBooking(id, user.userId);
        },

        /**
         * Health check for readiness/liveness probes
         */
        health: async () => {
            return 'OK';
        },
    },

    Mutation: {
        /**
         * Create a new booking
         */
        createBooking: async (_, { fecha, servicio }, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);

            try {
                return await bookingService.createBooking(user.userId, fecha, servicio);
            } catch (error) {
                throw new Error(`Failed to create booking: ${error.message}`);
            }
        },

        /**
         * Cancel a booking
         */
        cancelarReserva: async (_, { id }, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);

            try {
                return await bookingService.cancelBooking(id, user.userId);
            } catch (error) {
                throw new Error(`Failed to cancel booking: ${error.message}`);
            }
        },

        /**
         * Delete a booking
         */
        deleteBooking: async (_, { id }, context) => {
            const user = extractUserFromRequest(context.req);
            if (!user) {
                throw new Error('Authentication required');
            }

            const { bookingService } = initializeResolverDependencies(context.prisma);

            try {
                return await bookingService.deleteBooking(id, user.userId);
            } catch (error) {
                throw new Error(`Failed to delete booking: ${error.message}`);
            }
        },
    },
};

module.exports = resolvers;
