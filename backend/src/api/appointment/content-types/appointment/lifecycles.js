module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    const existing = await strapi.db.query('api::appointment.appointment').findOne({
      where: { scheduledAt: data.scheduledAt },
    });
    if (existing) {
      throw new Error('Time slot already booked');
    }
  },
};
