'use strict';

module.exports = {
  register() {},
  async bootstrap() {
    const pageCount = await strapi.entityService.count('api::page.page');
    if (pageCount === 0) {
      await strapi.entityService.create('api::page.page', {
        data: {
          title: 'Home',
          slug: 'home',
          content: {},
        },
      });
    }

    const roleService = strapi.plugin('users-permissions').service('role');
    const publicRole = await roleService.findOne(1);
    await roleService.updateRole(publicRole.id, {
      permissions: {
        ...publicRole.permissions,
        'api::page.page': {
          controllers: {
            page: {
              find: { enabled: true },
              findOne: { enabled: true },
            },
          },
        },
      },
    });

    const authRole = await roleService.findOne(2);
    await roleService.updateRole(authRole.id, {
      permissions: {
        ...authRole.permissions,
        'api::order.order': {
          controllers: { order: { create: { enabled: true } } },
        },
        'api::appointment.appointment': {
          controllers: { appointment: { create: { enabled: true } } },
        },
      },
    });
  },
};
