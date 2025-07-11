module.exports = [
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [process.env.FRONTEND_URL],
      credentials: true,
    },
  },
  'strapi::errors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  {
    name: 'strapi::favicon',
    config: {
      path: './public/favicon.ico',
    },
  },
  'strapi::public',
];
