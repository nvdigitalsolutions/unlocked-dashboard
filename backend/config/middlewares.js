module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  },
  'strapi::security',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
