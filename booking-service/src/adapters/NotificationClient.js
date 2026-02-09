const axios = require('axios');

/**
 * NotificationClient - Handles communication with notification-service
 * Responsibilities: Send booking and cancellation notifications
 */
class NotificationClient {
    constructor(baseURL = process.env.NOTIFICATION_SERVICE_URL) {
        this.client = axios.create({
            baseURL,
            timeout: 5000,
        });
    }

    /**
     * Notify user of booking creation
     * @param {Object} data - Notification data
     * @param {string} data.email - User email
     * @param {string} data.nombre - User name
     * @param {string} data.servicio - Service name
     * @param {string} data.fecha - Formatted date
     */
    async notifyBookingCreated(data) {
        try {
            await this.client.post('/notify/reserva', data);
            console.log(`✅ Booking notification sent to ${data.email}`);
        } catch (error) {
            console.error(`⚠️ Failed to send booking notification: ${error.message}`);
            // Don't throw - notification failure shouldn't block booking creation
        }
    }

    /**
     * Notify user of booking cancellation
     * @param {Object} data - Notification data
     * @param {string} data.email - User email
     * @param {string} data.nombre - User name
     * @param {string} data.servicio - Service name
     * @param {string} data.fecha - Formatted date
     */
    async notifyBookingCancelled(data) {
        try {
            await this.client.post('/notify/cancelacion', data);
            console.log(`✅ Cancellation notification sent to ${data.email}`);
        } catch (error) {
            console.error(`⚠️ Failed to send cancellation notification: ${error.message}`);
            // Don't throw - notification failure shouldn't block cancellation
        }
    }
}

module.exports = NotificationClient;
