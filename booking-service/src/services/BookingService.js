const { formatInTimeZone } = require('date-fns-tz');
const { DateTime } = require('luxon');

/**
 * BookingService - Business logic layer
 * Responsibilities: Orchestrate booking operations, enforce business rules,
 * manage transactions, coordinate with external services
 */
class BookingService {
    constructor(bookingRepository, userRepository, userClient, notificationClient, prisma) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.userClient = userClient;
        this.notificationClient = notificationClient;
        this.prisma = prisma;
    }

    /**
     * Format date to America/Guayaquil timezone
     * @param {Date} date - Date to format
     * @returns {string}
     */
    formatDateToGuayaquil(date) {
        return formatInTimeZone(date, 'America/Guayaquil', 'dd/MM/yyyy HH:mm:ss');
    }

    /**
     * Get all bookings for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getBookings(userId) {
        const bookings = await this.bookingRepository.findByUserId(userId);

        return bookings.map(booking => ({
            ...booking,
            fechaFormateada: this.formatDateToGuayaquil(booking.fecha),
        }));
    }

    /**
     * Get next 5 active bookings
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getNextBookings(userId) {
        const bookings = await this.bookingRepository.findNextBookings(userId, 5);

        return bookings.map(booking => ({
            ...booking,
            fechaFormateada: this.formatDateToGuayaquil(booking.fecha),
        }));
    }

    /**
     * Get booking by ID
     * @param {string} bookingId - Booking ID
     * @param {string} userId - User ID (ownership check)
     * @returns {Promise<Object>}
     */
    async getBooking(bookingId, userId) {
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.userId !== userId) {
            throw new Error('Unauthorized: This booking does not belong to you');
        }

        return {
            ...booking,
            fechaFormateada: this.formatDateToGuayaquil(booking.fecha),
        };
    }

    /**
     * Create a new booking with external service validation and notification
     * @param {string} userId - User ID
     * @param {string} fecha - Date in ISO format
     * @param {string} servicio - Service name
     * @returns {Promise<Object>}
     */
    async createBooking(userId, fecha, servicio) {
        // 1. Verify user exists in user-service
        let userFromUserService;
        try {
            userFromUserService = await this.userClient.verifyUser(userId);
            if (!userFromUserService) {
                throw new Error('User not found in user-service');
            }
        } catch (error) {
            throw new Error(`Cannot create booking: ${error.message}`);
        }

        // 2. Ensure user exists in local database
        let localUser = await this.userRepository.findByExternalId(userId);
        if (!localUser) {
            localUser = await this.userRepository.upsert(userId, {
                email: userFromUserService.email,
                nombre: userFromUserService.nombre || userFromUserService.name,
            });
        }

        // 3. Convert date to JavaScript Date
        let fechaObj;
        try {
            fechaObj = DateTime.fromISO(fecha, { zone: 'America/Guayaquil' }).toJSDate();
        } catch (error) {
            throw new Error(`Invalid date format: ${error.message}`);
        }

        // 4. Create booking in database
        const booking = await this.bookingRepository.create({
            userId: localUser.id,
            fecha: fechaObj,
            servicio,
            estado: 'ACTIVO',
        });

        // 5. Send notification asynchronously (don't wait for it)
        const fechaFormateada = this.formatDateToGuayaquil(fechaObj);
        this.notificationClient.notifyBookingCreated({
            email: userFromUserService.email,
            nombre: userFromUserService.nombre || userFromUserService.name,
            servicio,
            fecha: fechaFormateada,
        });

        return {
            ...booking,
            fechaFormateada,
        };
    }

    /**
     * Cancel a booking and clean up old cancelled bookings (ACID transaction)
     * Business rule: Keep only 5 most recent cancelled bookings per user
     * @param {string} bookingId - Booking ID
     * @param {string} userId - User ID (ownership check)
     * @returns {Promise<Object>}
     */
    async cancelBooking(bookingId, userId) {
        // Verify ownership
        const isOwner = await this.bookingRepository.belongsToUser(bookingId, userId);
        if (!isOwner) {
            throw new Error('Unauthorized: This booking does not belong to you');
        }

        // Transaction: Cancel booking and clean up old cancellations
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update booking status
            const cancelled = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    estado: 'CANCELADA',
                    canceladaEn: new Date(),
                },
            });

            // 2. Get all cancelled bookings for this user
            const userMap = await tx.user.findUnique({
                where: { id: userId },
            });

            const cancelledBookings = await tx.booking.findMany({
                where: {
                    userId,
                    estado: 'CANCELADA',
                },
                orderBy: { canceladaEn: 'asc' },
            });

            // 3. Delete oldest cancelled bookings if more than 5
            if (cancelledBookings.length > 5) {
                const toDelete = cancelledBookings.slice(0, cancelledBookings.length - 5);
                await tx.booking.deleteMany({
                    where: {
                        id: { in: toDelete.map(b => b.id) },
                    },
                });
            }

            return cancelled;
        });

        // Send cancellation notification asynchronously
        const userFromUserService = await this.userClient.getUser(userId);
        const fechaFormateada = this.formatDateToGuayaquil(result.fecha);

        this.notificationClient.notifyBookingCancelled({
            email: userFromUserService.email,
            nombre: userFromUserService.nombre || userFromUserService.name,
            servicio: result.servicio,
            fecha: fechaFormateada,
        });

        return {
            ...result,
            fechaFormateada,
        };
    }

    /**
     * Delete a booking
     * @param {string} bookingId - Booking ID
     * @param {string} userId - User ID (ownership check)
     * @returns {Promise<boolean>}
     */
    async deleteBooking(bookingId, userId) {
        const isOwner = await this.bookingRepository.belongsToUser(bookingId, userId);
        if (!isOwner) {
            throw new Error('Unauthorized: This booking does not belong to you');
        }

        await this.bookingRepository.delete(bookingId);
        return true;
    }
}

module.exports = BookingService;
