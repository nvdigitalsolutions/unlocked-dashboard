'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/appointments',
      handler: 'appointment.find',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/appointments/:id',
      handler: 'appointment.findOne',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/appointments',
      handler: 'appointment.create',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/appointments/:id',
      handler: 'appointment.update',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/appointments/:id',
      handler: 'appointment.delete',
      config: { policies: [], middlewares: [] },
    },
  ],
};
