/**
 * BookingRepository - Data access layer for Booking model
 * Responsibilities: CRUD operations, complex queries with transactions
 */
class BookingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Create a new booking
     * @param {Object} data - Booking data
     * @returns {Promise<Object>} Created booking
     */
    async create(data) {
        return this.prisma.booking.create({
            data,
            include: { user: true },
        });
    }

    /**
     * Find booking by ID
     * @param {string} id - Booking ID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        return this.prisma.booking.findUnique({
            where: { id },
            include: { user: true },
        });
    }

    /**
     * Find all bookings for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async findByUserId(userId) {
        return this.prisma.booking.findMany({
            where: { userId },
            orderBy: { fecha: 'desc' },
            include: { user: true },
        });
    }

    /**
     * Find active bookings (estado = ACTIVO) with fecha >= today
     * @param {string} userId - User ID
     * @param {number} limit - Max results
     * @returns {Promise<Array>}
     */
    async findNextBookings(userId, limit = 5) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.booking.findMany({
            where: {
                userId,
                estado: 'ACTIVO',
                fecha: { gte: today },
            },
            orderBy: { fecha: 'asc' },
            take: limit,
            include: { user: true },
        });
    }

    /**
     * Find cancelled bookings for a user, ordered by cancellation date
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async findCancelledBookings(userId) {
        return this.prisma.booking.findMany({
            where: {
                userId,
                estado: 'CANCELADA',
            },
            orderBy: { canceladaEn: 'asc' },
        });
    }

    /**
     * Update booking status and cancelledAt date in a transaction
     * @param {string} id - Booking ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>}
     */
    async updateBooking(id, data) {
        return this.prisma.booking.update({
            where: { id },
            data,
            include: { user: true },
        });
    }

    /**
     * Delete booking by ID
     * @param {string} id - Booking ID
     * @returns {Promise<Object>}
     */
    async delete(id) {
        return this.prisma.booking.delete({
            where: { id },
        });
    }

    /**
     * Delete multiple bookings by IDs
     * @param {Array<string>} ids - Booking IDs
     * @returns {Promise<Object>}
     */
    async deleteMany(ids) {
        return this.prisma.booking.deleteMany({
            where: {
                id: { in: ids },
            },
        });
    }

    /**
     * Check if booking belongs to user
     * @param {string} bookingId - Booking ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>}
     */
    async belongsToUser(bookingId, userId) {
        const booking = await this.findById(bookingId);
        return booking?.userId === userId;
    }
}

module.exports = BookingRepository;
