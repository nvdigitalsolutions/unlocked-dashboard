'use strict';
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/pages',
      handler: 'page.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/pages/:id',
      handler: 'page.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
