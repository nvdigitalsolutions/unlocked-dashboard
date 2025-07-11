'use strict';

module.exports = {
  register() {},
  async bootstrap() {
    const existingHome = await strapi.db
      .query('api::page.page')
      .findMany({ where: { slug: 'home' } });
    if (existingHome.length === 0) {
      const defaultBlocks = [
        {
          __component: 'blocks.hero',
          title: 'Welcome to the frontend',
          subtitle: 'Your Strapi v5 site is ready',
        },
      ];
      await strapi.entityService.create('api::page.page', {
        data: {
          title: 'Home',
          slug: 'home',
          blocks: defaultBlocks,
        },
      });
    }

    const existingHeader = await strapi.db
      .query('api::header.header')
      .findMany();
    if (existingHeader.length === 0) {
      await strapi.entityService.create('api::header.header', {
        data: { siteName: 'My Site' },
      });
    }

    const existingFooter = await strapi.db
      .query('api::footer.footer')
      .findMany();
    if (existingFooter.length === 0) {
      await strapi.entityService.create('api::footer.footer', {
        data: { text: '© 2024 My Site' },
      });
    }

    const existingGlobal = await strapi.db
      .query('api::global.global')
      .findMany();
    if (existingGlobal.length === 0) {
      await strapi.entityService.create('api::global.global', {
        data: { brandColor: '#ff0000', metaTitle: 'My Site', metaDescription: 'Site powered by Strapi v5' },
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
        'api::page': {
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
        'api::order': {
          controllers: { order: { create: { enabled: true } } },
        },
        'api::appointment': {
          controllers: { appointment: { create: { enabled: true } } },
        },
      },
    });
  },
};
