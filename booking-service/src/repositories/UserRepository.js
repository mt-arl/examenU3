/**
 * UserRepository - Data access layer for User model
 * Responsibilities: User CRUD operations
 */
class UserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Create or update a user
     * @param {Object} data - User data
     * @returns {Promise<Object>}
     */
    async upsert(externalId, data) {
        return this.prisma.user.upsert({
            where: { externalId },
            update: data,
            create: { externalId, ...data },
        });
    }

    /**
     * Find user by external ID (from user-service)
     * @param {string} externalId - User ID from user-service
     * @returns {Promise<Object|null>}
     */
    async findByExternalId(externalId) {
        return this.prisma.user.findUnique({
            where: { externalId },
        });
    }

    /**
     * Find user by ID
     * @param {string} id - Internal user ID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>}
     */
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
}

module.exports = UserRepository;
