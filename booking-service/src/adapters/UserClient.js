const axios = require('axios');

/**
 * UserClient - Handles communication with user-service
 * Responsibilities: Verify user exists, get user details
 */
class UserClient {
    constructor(baseURL = process.env.USER_SERVICE_URL) {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
        });
    }

    /**
     * Verify if a user exists and is valid
     * @param {string} userId - User ID from JWT
     * @returns {Promise<Object>} User data or null if not found
     */
    async verifyUser(userId) {
        try {
            const response = await this.client.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn(`⚠️ User not found in user-service: ${userId}`);
                return null;
            }
            console.error(`❌ Error verifying user ${userId}:`, error.message);
            throw new Error('User service unavailable');
        }
    }

    /**
     * Get user details
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUser(userId) {
        try {
            const response = await this.client.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Error fetching user ${userId}:`, error.message);
            throw new Error('User service error');
        }
    }
}

module.exports = UserClient;
