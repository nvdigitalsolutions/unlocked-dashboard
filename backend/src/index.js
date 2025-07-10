'use strict';

module.exports = {
  register() {},
  async bootstrap() {
    const existingHome = await strapi.entityService.findMany('api::page.page', {
      filters: { slug: 'home' },
    });
    if (existingHome.length === 0) {
      await strapi.entityService.create('api::page.page', {
        data: {
          title: 'Home',
          slug: 'home',
          content: {},
        },
      });
    }

    const roleService = strapi.plugin('users-permissions').service('role');
    // In Strapi, role id 1 is "Authenticated" and id 2 is "Public".
    // The previous code assumed the opposite, which meant the
    // public role never received the necessary read permissions.
    const publicRole = await roleService.findOne(2);
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

    const authRole = await roleService.findOne(1);
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
