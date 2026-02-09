const { gql } = require('graphql-tag');
const typeDefs = gql`
    enum BookingStatus {
        ACTIVO
        CANCELADA
    }

    type Booking {
        id: ID!
        userId: String!
        fecha: String!
        fechaFormateada: String!
        servicio: String!
        estado: BookingStatus!
        canceladaEn: String
        createdAt: String!
        updatedAt: String!
    }

    type User {
        id: ID!
        externalId: String!
        email: String!
        nombre: String!
        createdAt: String!
        updatedAt: String!
    }

    type Query {
        # Get all bookings for authenticated user
        bookings: [Booking!]!

        # Get next 5 active bookings for authenticated user
        proximasReservas: [Booking!]!

        # Get a specific booking by ID (must belong to authenticated user)
        booking(id: ID!): Booking

        # Get booking by ID (admin only - optional)
        bookingById(id: ID!): Booking

        # Health check
        health: String!
    }

    type Mutation {
        # Create a new booking
        createBooking(fecha: String!, servicio: String!): Booking!

        # Cancel a booking (changes status to CANCELADA and removes oldest if > 5)
        cancelarReserva(id: ID!): Booking!

        # Delete a booking by ID
        deleteBooking(id: ID!): Boolean!
    }

    schema {
        query: Query
        mutation: Mutation
    }
`;

module.exports = typeDefs;
