// src/services/booking.service.js
async cancelBooking(bookingId, user) {
  const transaction = await sequelize.transaction();
  try {
    // 1. Verificar propiedad y estado
    const booking = await this.repository.findById(bookingId, { transaction });
    if (!booking || booking.userId !== user.userId) throw new Error("No autorizado");

    // 2. Actualizar estado a 'cancelada'
    await booking.update({ estado: 'cancelada', canceladaEn: new Date() }, { transaction });

    // 3. Aplicar regla: Máximo 5 canceladas (ACID)
    const cancelledOnes = await this.repository.findCancelledByUser(user.userId, { transaction });
    
    if (cancelledOnes.length > 5) {
      const toDelete = cancelledOnes.slice(0, cancelledOnes.length - 5);
      const ids = toDelete.map(b => b.id);
      await this.repository.deleteMany(ids, { transaction });
    }

    await transaction.commit();
    
    // 4. Notificación (Fuera de la transacción para no bloquear la DB)
    await this.notificationClient.sendCancellation(user, booking);
    
    return { message: "Reserva cancelada y depurada", success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}