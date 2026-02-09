jest.mock('../adapters/UserClient');
jest.mock('../adapters/NotificationClient');

const BookingService = require('../../src/services/BookingService');
const BookingRepository = require('../../src/repositories/BookingRepository');
const UserRepository = require('../../src/repositories/UserRepository');
const UserClient = require('../../src/adapters/UserClient');
const NotificationClient = require('../../src/adapters/NotificationClient');

describe('BookingService', () => {
    let bookingService;
    let mockBookingRepository;
    let mockUserRepository;
    let mockUserClient;
    let mockNotificationClient;
    let mockPrisma;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockBookingRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findNextBookings: jest.fn(),
            findCancelledBookings: jest.fn(),
            updateBooking: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            belongsToUser: jest.fn(),
        };

        mockUserRepository = {
            upsert: jest.fn(),
            findByExternalId: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
        };

        mockUserClient = {
            verifyUser: jest.fn(),
            getUser: jest.fn(),
        };

        mockNotificationClient = {
            notifyBookingCreated: jest.fn(),
            notifyBookingCancelled: jest.fn(),
        };

        mockPrisma = {
            $transaction: jest.fn((callback) => callback({})),
        };

        // Create service with mocks
        bookingService = new BookingService(
            mockBookingRepository,
            mockUserRepository,
            mockUserClient,
            mockNotificationClient,
            mockPrisma
        );
    });

    describe('createBooking', () => {
        test('should successfully create a booking', async () => {
            const userId = 'user-123';
            const fecha = '2026-02-10T10:00:00';
            const servicio = 'Suite Deluxe';

            const mockUser = {
                id: 'external-user-123',
                email: 'user@example.com',
                nombre: 'John Doe',
            };

            const mockLocalUser = {
                id: 'local-user-123',
                externalId: userId,
                email: 'user@example.com',
                nombre: 'John Doe',
            };

            const mockBooking = {
                id: 'booking-123',
                userId: 'local-user-123',
                fecha: new Date('2026-02-10T10:00:00'),
                servicio: 'Suite Deluxe',
                estado: 'ACTIVO',
            };

            mockUserClient.verifyUser.mockResolvedValue(mockUser);
            mockUserRepository.findByExternalId.mockResolvedValue(mockLocalUser);
            mockBookingRepository.create.mockResolvedValue(mockBooking);

            const result = await bookingService.createBooking(userId, fecha, servicio);

            expect(result).toBeDefined();
            expect(result.id).toBe('booking-123');
            expect(result.estado).toBe('ACTIVO');
            expect(mockUserClient.verifyUser).toHaveBeenCalledWith(userId);
            expect(mockBookingRepository.create).toHaveBeenCalled();
        });

        test('should throw error if user not found in user-service', async () => {
            const userId = 'invalid-user';
            const fecha = '2026-02-10T10:00:00';
            const servicio = 'Suite Deluxe';

            mockUserClient.verifyUser.mockResolvedValue(null);

            await expect(
                bookingService.createBooking(userId, fecha, servicio)
            ).rejects.toThrow('User not found in user-service');
        });

        test('should throw error for invalid date format', async () => {
            const userId = 'user-123';
            const fecha = 'invalid-date';
            const servicio = 'Suite Deluxe';

            const mockUser = {
                id: 'external-user-123',
                email: 'user@example.com',
                nombre: 'John Doe',
            };

            mockUserClient.verifyUser.mockResolvedValue(mockUser);
            mockUserRepository.findByExternalId.mockResolvedValue({
                id: 'local-user-123',
            });

            await expect(
                bookingService.createBooking(userId, fecha, servicio)
            ).rejects.toThrow('Invalid date format');
        });
    });

    describe('cancelBooking', () => {
        test('should cancel booking and enforce max 5 rule', async () => {
            const bookingId = 'booking-123';
            const userId = 'user-123';

            const mockBooking = {
                id: 'booking-123',
                userId,
                fecha: new Date('2026-02-10T10:00:00'),
                servicio: 'Suite Deluxe',
                estado: 'ACTIVO',
                canceladaEn: null,
            };

            mockBookingRepository.belongsToUser.mockResolvedValue(true);

            const mockCancelledBooking = {
                ...mockBooking,
                estado: 'CANCELADA',
                canceladaEn: new Date(),
            };

            // Mock transaction
            mockPrisma.$transaction.mockImplementation((callback) => {
                return callback({
                    booking: {
                        update: jest.fn().mockResolvedValue(mockCancelledBooking),
                    },
                    user: {
                        findUnique: jest.fn().mockResolvedValue({ id: userId }),
                    },
                });
            });

            mockUserClient.getUser.mockResolvedValue({
                email: 'user@example.com',
                nombre: 'John Doe',
            });

            const result = await bookingService.cancelBooking(bookingId, userId);

            expect(result.estado).toBe('CANCELADA');
            expect(result.canceladaEn).toBeDefined();
            expect(mockNotificationClient.notifyBookingCancelled).toHaveBeenCalled();
        });

        test('should throw error if booking does not belong to user', async () => {
            const bookingId = 'booking-123';
            const userId = 'user-456';

            mockBookingRepository.belongsToUser.mockResolvedValue(false);

            await expect(
                bookingService.cancelBooking(bookingId, userId)
            ).rejects.toThrow('Unauthorized');
        });
    });

    describe('getBookings', () => {
        test('should return all bookings with formatted dates', async () => {
            const userId = 'user-123';

            const mockBookings = [
                {
                    id: 'booking-1',
                    userId,
                    fecha: new Date('2026-02-10T10:00:00'),
                    servicio: 'Suite Deluxe',
                    estado: 'ACTIVO',
                },
            ];

            mockBookingRepository.findByUserId.mockResolvedValue(mockBookings);

            const result = await bookingService.getBookings(userId);

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('fechaFormateada');
            expect(mockBookingRepository.findByUserId).toHaveBeenCalledWith(userId);
        });
    });

    describe('getNextBookings', () => {
        test('should return next 5 active bookings', async () => {
            const userId = 'user-123';

            const mockBookings = [
                {
                    id: 'booking-1',
                    userId,
                    fecha: new Date('2026-02-15T10:00:00'),
                    servicio: 'Suite Deluxe',
                    estado: 'ACTIVO',
                },
            ];

            mockBookingRepository.findNextBookings.mockResolvedValue(mockBookings);

            const result = await bookingService.getNextBookings(userId);

            expect(result).toHaveLength(1);
            expect(mockBookingRepository.findNextBookings).toHaveBeenCalledWith(userId, 5);
        });
    });

    describe('deleteBooking', () => {
        test('should delete booking successfully', async () => {
            const bookingId = 'booking-123';
            const userId = 'user-123';

            mockBookingRepository.belongsToUser.mockResolvedValue(true);
            mockBookingRepository.delete.mockResolvedValue({ id: bookingId });

            const result = await bookingService.deleteBooking(bookingId, userId);

            expect(result).toBe(true);
            expect(mockBookingRepository.delete).toHaveBeenCalledWith(bookingId);
        });

        test('should throw error if booking does not belong to user', async () => {
            const bookingId = 'booking-123';
            const userId = 'user-456';

            mockBookingRepository.belongsToUser.mockResolvedValue(false);

            await expect(
                bookingService.deleteBooking(bookingId, userId)
            ).rejects.toThrow('Unauthorized');
        });
    });
});
